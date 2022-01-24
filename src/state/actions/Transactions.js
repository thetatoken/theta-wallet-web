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

    console.log("createSmartContractTransactionAsync :: txData == ");
    console.log(txData);

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

        console.log("createSmartContractTransactionAsync :: rawTxHex = " + rawTxHex);

        if (signedTx) {
            let dryRunResponseJSON = null;

            if(contractMode === ContractModes.DEPLOY){
                const dryRunResponse = await Api.callSmartContract({data: rawTxHex}, {network: network});
                dryRunResponseJSON = await dryRunResponse.json();

                console.log("dryRunResponseJSON == ");
                console.log(dryRunResponseJSON);
            }

            let opts = {
                onSuccess: function (dispatch, response) {
                    //Show success alert
                    if(contractMode === ContractModes.DEPLOY){
                        Alerts.showSuccess("Your smart contract has been deployed.");


                        console.log("contractAbi == " );
                        console.log(contractAbi);

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

export function createSmartContractTransaction(network, contractMode, contractAbi, txData, password) {
    return function (dispatch, getState) {
        createSmartContractTransactionAsync(dispatch, network, contractMode, contractAbi, txData, password).then(function (thunk) {
            if (thunk) {
                dispatch(thunk);
            }
        });
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
    return async (dispatch) => {
        try {
            dispatch(showLoader('Sending Transaction'));
            const validPassword = Wallet.verifyPassword(password);

            if(!validPassword){
                dispatch(hideLoader());
                Alerts.showError('Wrong password. Your transaction could not be signed.');
                return false;
            }

            const result = await Wallet.controller.RPCApi.approveTransactionRequest({
                transactionRequestId: transactionRequestId
            });
            dispatch(hideModals());
            dispatch(hideLoader());

            return result;
        }
        catch (error) {
            return false;
        }
    };
}
