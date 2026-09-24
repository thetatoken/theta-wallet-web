import {store} from '../state';
import {getChainByChainIdNum} from '../utils/Utils';
import {setNetwork} from '../state/actions/Wallet';
import {getNetworkForChainId} from '@thetalabs/theta-js/src/networks';
import Wallet from './Wallet';
import {hideModal, showModal} from '../state/actions/ui';
import {createTransactionRequest} from '../state/actions/Transactions';
import {TxType} from '@thetalabs/theta-js/src/constants';
import ModalTypes from '../constants/ModalTypes';
import {getDAppUrl} from './DAppOrigin';

export default class Web3Bridge {
    constructor() {
        this.session = null;
        this.requestSequence = 0;
        this.listener = event => this.handleMessage(event);
    }

    // Called only after the user approves the displayed browser-derived origin.
    startSession(frame, uri, onEnd) {
        this.endSession();
        const url = getDAppUrl(uri);
        const {selectedAddress, network} = store.getState().thetaWallet;
        if (!url || !frame?.contentWindow || !Wallet.unlocked() || !selectedAddress ||
            !getNetworkForChainId(network?.chainId)) return null;
        const session = {
            frame, source: frame.contentWindow, origin: url.origin,
            address: selectedAddress, chainId: network.chainId, pending: null, onEnd
        };
        this.session = session;
        this.unsubscribe = store.subscribe(() => {
            if (!this.isActive(session)) this.endSession(session);
        });
        return session;
    }

    isActive(session) {
        const wallet = store.getState().thetaWallet;
        return !!session && this.session === session && Wallet.unlocked() &&
            session.source === session.frame.contentWindow &&
            wallet.selectedAddress === session.address && wallet.network?.chainId === session.chainId;
    }

    endSession(session = this.session) {
        if (!session || this.session !== session) return;
        this.session = null;
        if (this.unsubscribe) this.unsubscribe();
        this.unsubscribe = null;
        if (session.pending) session.pending.cancel();
        if (session.onEnd) session.onEnd();
    }

    sendConfig(session = this.session) {
        if (!this.isActive(session)) return;
        const network = getNetworkForChainId(session.chainId);
        session.source.postMessage(JSON.stringify({
            type: 'wallet_setConfig',
            config: {
                origin: window.location.origin, chainId: network.chainIdNum,
                jsonRpcUrl: network.ethRpcUrl, accounts: [session.address]
            }
        }), session.origin);
    }

    init() {
        window.removeEventListener('message', this.listener);
        window.addEventListener('message', this.listener);
    }

    async handleMessage(event) {
        const session = this.session;
        if (!this.isActive(session) || event.source !== session.source || event.origin !== session.origin) return;
        let data;
        try { data = JSON.parse(event.data); } catch (error) { return; }
        // Metadata from websites is not a verified identity and is not used.
        if (!data || data.type !== 'request') return;
        const request = data.request;
        if (!request || !['string', 'number'].includes(typeof request.id)) return;
        const respond = (result, error) => {
            if (!this.isActive(session)) return;
            session.source.postMessage(JSON.stringify({
                id: request.id, jsonrpc: '2.0', ...(error ? {error} : {result})
            }), session.origin);
        };
        const fail = (code, message) => respond(null, {code, message});
        const {method, params = []} = request;
        if (!Array.isArray(params)) return fail(-32602, 'Invalid parameters.');
        if (method === 'eth_requestAccounts') return respond([session.address]);
        if (!['wallet_switchEthereumChain', 'personal_sign', 'eth_sendTransaction'].includes(method)) {
            return fail(-32601, 'Unsupported method.');
        }
        // One confirmation at a time, including native wallet dialogs/transactions.
        if (session.pending || store.getState().ui.modals.some(modal => modal.type !== ModalTypes.DAPP) ||
            store.getState().thetaWallet.transactionRequests?.length) {
            return fail(-32002, 'A wallet request is already pending.');
        }
        const chainId = session.chainId;
        const dappRequestId = `dapp-${++this.requestSequence}`;
        let settled = false;
        let modalOpen = false;
        let transactionId = null;
        const isValid = () => !settled && this.isActive(session) && session.chainId === chainId;
        const finish = (result, error, closeModal = false) => {
            if (settled) return;
            settled = true;
            session.pending = null;
            if (closeModal && modalOpen) store.dispatch(hideModal(dappRequestId));
            respond(result, error);
        };
        const reject = () => finish(null, {code: 4001, message: 'User rejected the request.'}, true);
        session.pending = {cancel: () => {
            if (transactionId) Wallet.controller.RPCApi.rejectTransactionRequest({transactionRequestId: transactionId});
            // The old document is no longer trusted to receive a response.
            finish(null, null, true);
        }};
        const openModal = (type, props) => {
            if (!isValid()) return;
            modalOpen = true;
            store.dispatch(showModal({type, props: {closeable: false, origin: session.origin, isValid, dappRequestId, ...props}}));
        };
        try {
            if (method === 'wallet_switchEthereumChain') {
                const value = params[0]?.chainId;
                if (typeof value !== 'string' || !/^0x[0-9a-f]+$/i.test(value)) throw new Error('Invalid chain.');
                const network = getChainByChainIdNum(Number(value));
                if (!network || !getNetworkForChainId(network.chainId)) {
                    finish(null, {code: 4902, message: 'Unsupported chain id.'});
                } else if (network.chainId === chainId) {
                    finish(null);
                } else {
                    openModal(ModalTypes.DAPP_NETWORK, {network, onReject: reject, onAccept: async () => {
                        if (!isValid()) return reject();
                        // Keep the approved session valid during the synchronous store update.
                        session.chainId = network.chainId;
                        try {
                            await store.dispatch(setNetwork(network));
                            this.sendConfig(session);
                            finish(null, null, true);
                        } catch (error) {
                            this.endSession(session);
                        }
                    }});
                }
            } else if (method === 'personal_sign') {
                const [message, address] = params;
                if (typeof message !== 'string' || !/^0x(?:[0-9a-f]{2})*$/i.test(message) ||
                    typeof address !== 'string' || address.toLowerCase() !== session.address.toLowerCase()) {
                    throw new Error('Invalid signing parameters.');
                }
                openModal(ModalTypes.PERSONAL_SIGN, {
                    message: Buffer.from(message.slice(2), 'hex').toString('utf8'),
                    onAccept: signature => signature ? finish(signature, null, true) :
                        finish(null, {code: -32603, message: 'Signing failed.'}, true),
                    onReject: reject
                });
            } else {
                const transaction = params[0];
                if (!transaction || typeof transaction !== 'object' || Array.isArray(transaction) ||
                    (transaction.from && transaction.from.toLowerCase() !== session.address.toLowerCase())) {
                    throw new Error('Invalid transaction parameters.');
                }
                await store.dispatch(createTransactionRequest({txData: transaction, txType: TxType.SmartContract}, {
                    origin: session.origin, isValid, dappRequestId,
                    onCreated: id => { transactionId = id; modalOpen = true; },
                    onAccept: hash => finish(hash),
                    // The transaction modal/action closes itself.
                    onReject: () => finish(null, {code: 4001, message: 'User rejected the request.'}),
                    onError: () => finish(null, {code: -32603, message: 'Unable to prepare the transaction.'})
                }));
            }
        } catch (error) {
            finish(null, {code: -32602, message: 'Invalid request parameters.'}, true);
        }
    }
}
