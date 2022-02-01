import * as thetajs from '@thetalabs/theta-js';
import _ from 'lodash';
import Api from '../../services/Api'
import {reduxFetch} from './Api'
import {
    RESET,
    CREATE_SMART_CONTRACT_TRANSACTION,
    CREATE_SMART_CONTRACT_TRANSACTION_START,
    CREATE_SMART_CONTRACT_TRANSACTION_END
} from "../types/Transactions";
import Wallet from "../../services/Wallet";
import Theta from "../../services/Theta";
import Timeout from 'await-timeout';
import {hideLoader, hideModal, hideModals, showLoader, showModal} from "./ui";
import Alerts from "../../services/Alerts";
import ThetaJS from "../../libs/thetajs.esm";
import ContractModes from "../../constants/ContractModes";
import Router from "../../services/Router";
import ModalTypes from "../../constants/ModalTypes";
import {updateAccountStakes} from "./Wallet";
import {sleep} from "../../utils/Utils";

export function fetchThetaTransactions() {
    return function (dispatch, getState) {
        const selectedAddress = _.get(getState(), 'thetaWallet.selectedAddress');
        if(selectedAddress){
            return Wallet.controller.RPCApi.updateAccountTransactions({
                address: selectedAddress
            });
        }
    };
}

export async function createSmartContractTransactionAsync(dispatch, network, contractMode, contractAbi, txData, password) {
    let metadata = {
        network: network,
        contractMode: contractMode,
        txData: txData,
    };

    //The decryption can take some time, so start the event early
    dispatch({
        type: CREATE_SMART_CONTRACT_TRANSACTION_START,
        metadata: metadata
    });

    //Let the spinners start, so we will delay the decryption/signing a bit
    await Timeout.set(1000);

    try {
        let address = Wallet.getWalletAddress();
        let sequence = await Wallet.getThetaTxSequence(address, network);
        let unsignedTx = Theta.unsignedSmartContractTx(txData, sequence);
        const rawTxBytes = ThetaJS.TxSigner.serializeTx(unsignedTx);
        const rawTxHex = rawTxBytes.toString('hex').slice(2);
        let signedTx = await Wallet.signTransaction(network, unsignedTx, password);

        if (signedTx) {
            let dryRunResponseJSON = null;

            if(contractMode === ContractModes.DEPLOY){
                const dryRunResponse = await Api.callSmartContract({data: rawTxHex}, {network: network});
                dryRunResponseJSON = await dryRunResponse.json();
            }

            let opts = {
                onSuccess: function (dispatch, response) {
                    //Show success alert
                    if(contractMode === ContractModes.DEPLOY){
                        Alerts.showSuccess("Your smart contract has been deployed.");

                        const contractAddress = _.get(dryRunResponseJSON, ['result', 'contract_address']);
                        const contractABIB64 = btoa(contractAbi);
                        Router.push(`/wallet/contract/interact?address=${contractAddress}&abi=${contractABIB64}`);
                    }
                    else{
                        Alerts.showSuccess("Your transaction is now being processed.");
                    }

                    //Hide the send modals
                    dispatch(hideModals());
                },
                onError: function (dispatch, response) {
                    const errorMsg = _.get(response, ['body', 'message'], "Your transaction failed.");

                    Alerts.showError(errorMsg);
                }
            };

            //Call API to create the transaction
            let result = reduxFetch(CREATE_SMART_CONTRACT_TRANSACTION, function () {
                if(contractMode === ContractModes.DEPLOY || contractMode === ContractModes.EXECUTE){
                    return Api.executeSmartContract({data: signedTx}, {network: network});
                }
                }, metadata, opts);

            return Promise.resolve(result);
        }
    }
    catch (e) {
        //Signing failed so end the request
        dispatch({
            type: CREATE_SMART_CONTRACT_TRANSACTION_END
        });

        //Display error
        Alerts.showError(e.message);

        return Promise.resolve(null);
    }
}

export function createSmartContractTransactionLegacy(network, contractMode, contractAbi, txData, password) {
    return function (dispatch, getState) {
        createSmartContractTransactionAsync(dispatch, network, contractMode, contractAbi, txData, password).then(function (thunk) {
            if (thunk) {
                dispatch(thunk);
            }
        });
    };
}

export function createSmartContractTransaction(contractMode, contractAbi, txData) {
    return async function (dispatch, getState) {
        dispatch(showLoader('Preparing transaction...'));

        //Let the spinners start, so we will delay the decryption/signing a bit
        await sleep(1000);

        try {
            let address = Wallet.getWalletAddress();
            const provider = Wallet.controller.provider;
            const transaction = new thetajs.transactions.SmartContractTransaction(txData);
            let sequence = await provider.getTransactionCount(address);
            sequence = sequence + 1;
            transaction.setSequence(sequence);
            const callResult = await provider.callSmartContract(transaction);
            await sleep(1000);
            dispatch(hideLoader());

            dispatch(createTransactionRequest(transaction.toJson()));

            if(contractMode === ContractModes.DEPLOY){
                // Assume the TX goes through
                const contractAddress = _.get(callResult, ['contract_address']);
                const contractABIB64 = btoa(contractAbi);
                Router.push(`/wallet/contract/interact?address=${contractAddress}&abi=${contractABIB64}`);
            }
        }
        catch (e) {
            dispatch(hideLoader());

            //Display error
            Alerts.showError(e.message);

            return Promise.resolve(null);
        }
        finally {
            dispatch(hideLoader());
        }
    };
}

export function resetTransactionsState(){
    return {
        type: RESET,
    }
}

export function createTransactionRequest(transactionRequest) {
    return async (dispatch) => {
        try {
            const result = Wallet.controller.RPCApi.addTransactionRequest({
                transactionRequest: transactionRequest
            });

            dispatch(showModal({
                type: ModalTypes.CONFIRM_TRANSACTION,
                props: {
                    closeable: false
                }
            }));

            return result;
        }
        catch (error) {
            return false;
        }
    };
}

export function rejectTransactionRequest(transactionRequestId) {
    return async (dispatch) => {
        try {
            const result = Wallet.controller.RPCApi.rejectTransactionRequest({
                transactionRequestId: transactionRequestId
            });

            dispatch(hideModal());

            return result;
        }
        catch (error) {
            return false;
        }
    };
}

export function approveTransactionRequest(transactionRequestId, password) {
    return async (dispatch, getState) => {
        try {
            const transactionRequest = Wallet.controller.transactionsController.pendingTransactionRequests.get(transactionRequestId);
            const dependencies = _.get(transactionRequest, 'request.dependencies', []);
            const totalTransactions = (dependencies.length + 1);

            if(dependencies.length === 0){
                dispatch(showLoader('Sending Transaction'));
            }
            else{
                dispatch(showLoader(`Sending Transaction (1 / ${totalTransactions})`));
            }

            // Sleep a bit so the password check doesn't lag
            await sleep(1500);

            const validPassword = Wallet.verifyPassword(password);

            if(!validPassword){
                dispatch(hideLoader());
                Alerts.showError('Wrong password. Your transaction could not be signed.');
                return false;
            }

            const result = await Wallet.controller.RPCApi.approveTransactionRequest({
                transactionRequestId: transactionRequestId,
                onDependencySent: () => {
                    if(dependencies.length === 0){
                        dispatch(showLoader('Sending Transaction'));
                    }
                    else{
                        dispatch(showLoader(`Sending Transaction (${totalTransactions} / ${totalTransactions})`));
                    }
                }
            });
            dispatch(hideModals());

            if(window.location.href.includes('stakes')){
                const selectedAddress = _.get(getState(), 'thetaWallet.selectedAddress');
                dispatch(updateAccountStakes(selectedAddress));
            }

            dispatch(hideLoader());

            return result;
        }
        catch (error) {
            dispatch(hideLoader());
            const humanizedErrorMessage = thetajs.errors.humanizeErrorMessage(error.message);
            Alerts.showError(humanizedErrorMessage);
            return false;
        }
    };
}
