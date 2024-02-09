import _ from 'lodash';
import {store} from "../state";
import {getChainByChainIdNum, sleep} from "../utils/Utils";
import {setNetwork} from "../state/actions/Wallet";
import {getNetworkForChainId} from "@thetalabs/theta-js/src/networks";
import Wallet from "./Wallet";
import * as thetajs from "@thetalabs/theta-js";
import {hideLoader} from "../state/actions/ui";
import {createTransactionRequest} from "../state/actions/Transactions";
import {TxType} from "@thetalabs/theta-js/src/constants";

export default class Web3Bridge {
    constructor() {
        this.projectMetadata = null;
        this.targetOrigin = '*'; //Gets set by the DAppModal
        this.targetFrame = null;
    }
    endSession() {
        this.projectMetadata = null;
        this.targetFrame = null;
    }
    sendConfig() {
        const {thetaWallet} = store.getState();
        const selectedAddress = thetaWallet.selectedAddress;
        const identities = thetaWallet.identities;
        const chainId = thetaWallet.network?.chainId;
        const network = getNetworkForChainId(chainId);

        const config = {
            origin: window.location.origin,
            chainId: network.chainIdNum,
            jsonRpcUrl: network.ethRpcUrl,
            accounts: [selectedAddress]
        };
        this.targetFrame.contentWindow.postMessage(JSON.stringify({
            type: 'wallet_setConfig',
            config: config
        }), this.targetOrigin);
    }
    init() {
        window.addEventListener('message', async (event) => {
            // TODO ensure the origin is whitelisted in our wallet-metadata
            // if (event.origin !== "https://example-dapp.com") return; // Check origin for security

            try {
                const sourceFrame = event.source;

                const {thetaWallet} = store.getState();
                const selectedAddress = thetaWallet.selectedAddress;
                const identities = thetaWallet.identities;
                const selectedIdentity = identities[selectedAddress];
                const chainId = thetaWallet.network?.chainId;
                const network = getNetworkForChainId(chainId);


                const buildRPCResponse = (id, result, error) => {
                    if(error){
                        return {
                            id: id,
                            jsonrpc: '2.0',
                            error: error,
                        }
                    }

                    return {
                        id: id,
                        jsonrpc: '2.0',
                        result: result,
                    }
                }
                const respond = (request, result, error) => {
                    const {id} = request;
                    const response = buildRPCResponse(id, result, error);
                    sourceFrame.postMessage(JSON.stringify(response), this.targetOrigin);
                }

                const data = JSON.parse(event.data);
                if (data.type === 'connect') {
                    // Ignore?
                }
                else if(data.type === 'wallet_sendDomainMetadata'){
                    this.projectMetadata = data.metadata;
                }
                else if(data.type === 'request') {
                    const request = data.request;
                    const {id, method, params} = request;

                    try {
                        switch (method) {
                            case 'wallet_switchEthereumChain': {
                                const [targetChain] = params;
                                let {chainId} = targetChain;
                                chainId = parseInt(chainId, 16);
                                const network = getChainByChainIdNum(chainId);

                                if (network === null) {
                                    respond(request, null, {
                                        code: -32000,
                                        message: 'Unsupported chain id',
                                    });
                                    break;
                                }

                                // TODO set network
                                await store.dispatch(setNetwork(network));
                                respond(request, true);
                                break;
                            }
                            case 'eth_requestAccounts': {
                                respond(request, [selectedAddress]);
                                break;
                            }
                            case 'eth_sign': {
                                const [address, message] = params;
                                const decodedMessage = Buffer.from(message.replace('0x', ''), 'hex').toString('utf8');

                                // TODO need to show the modal here...
                                console.log('eth_sign', decodedMessage);
                                // store.dispatch(showModal(ModalTypes.PERSONAL_SIGN, {
                                //     wallet: selectedIdentity,
                                //     chainInfo: network,
                                //     projectMetadata: projectMetadata,
                                //     message: decodedMessage,
                                //     onAccept: async (signedMessage) => {
                                //         respond(request, signedMessage);
                                //     },
                                //     onReject: () => {
                                //         respond(request, null, {
                                //             code: 4001,
                                //             message: 'User rejected the request.',
                                //         });
                                //     }
                                // }))
                                break;
                            }
                            case 'personal_sign': {
                                const [message, address] = params;
                                const decodedMessage = Buffer.from(message.replace('0x', ''), 'hex').toString('utf8');
                                // TODO need to show the modal here...
                                console.log('personal_sign', decodedMessage);
                                // store.dispatch(showModal(ModalTypes.PERSONAL_SIGN, {
                                //     wallet: selectedIdentity,
                                //     chainInfo: network,
                                //     projectMetadata: projectMetadata,
                                //     message: decodedMessage,
                                //     onAccept: async (signedMessage) => {
                                //         respond(request, signedMessage);
                                //     },
                                //     onReject: () => {
                                //         respond(request, null, {
                                //             code: 4001,
                                //             message: 'User rejected the request.',
                                //         });
                                //     }
                                // }))
                                break;
                            }
                            case 'eth_sendTransaction': {
                                const [transaction] = params;
                                window.transaction = transaction;
                                store.dispatch(createTransactionRequest({
                                    txData: transaction,
                                    txType: TxType.SmartContract
                                }, {
                                    onAccept: async (txHash) => {
                                        respond(request, txHash);
                                    },
                                    onReject: () => {
                                        respond(request, null, {
                                            code: 4001,
                                            message: 'User rejected the request.',
                                        });
                                    }
                                }));
                            }
                        }
                    } catch (e) {
                        respond(request, null, {
                            code: -32603,
                            message: 'Internal JSON-RPC error.',
                        });
                    }
                }
            }
            catch (e){

            }
        }, false);
    }
}
