import _ from 'lodash';
import Api from '../../services/Api'
import {reduxFetch} from './Api'
import {
    CREATE_SEND_TRANSACTION,
    CREATE_SEND_TRANSACTION_END,
    CREATE_SEND_TRANSACTION_START,
    FETCH_TRANSACTION,
    RESET,
    FETCH_TRANSACTIONS_THETA,
    CREATE_DEPOSIT_STAKE_TRANSACTION_START,
    CREATE_DEPOSIT_STAKE_TRANSACTION,
    CREATE_DEPOSIT_STAKE_TRANSACTION_END,
    CREATE_WITHDRAW_STAKE_TRANSACTION,
    CREATE_WITHDRAW_STAKE_TRANSACTION_START,
    CREATE_WITHDRAW_STAKE_TRANSACTION_END,
    CREATE_SMART_CONTRACT_TRANSACTION,
    CREATE_SMART_CONTRACT_TRANSACTION_START,
    CREATE_SMART_CONTRACT_TRANSACTION_END
} from "../types/Transactions";
import Wallet from "../../services/Wallet";
import Theta from "../../services/Theta";
import Timeout from 'await-timeout';
import {hideModals} from "./Modals";
import Alerts from "../../services/Alerts";
import ThetaJS from "../../libs/thetajs.esm";
import ContractModes from "../../constants/ContractModes";
import Router from "../../services/Router";

const DefaultTransactionErrorMessage = "An error occurred while sending your transaction. Please wait and try again.";

export function fetchThetaTransactions() {
    let address = Wallet.getWalletAddress();

    return reduxFetch(FETCH_TRANSACTIONS_THETA, function () {
        return Api.fetchTransactions(address, {network: Theta.getChainID()});
    });
}

export function fetchTransaction(network, txHash) {
    return reduxFetch(FETCH_TRANSACTION, function () {
        return Api.fetchTransaction(txHash, {network: network});
    }, {network: network});
}

export async function createSendTransactionAsync(dispatch, network, txData, password) {
    let metadata = {
        network: network,
        txData: txData,
    };

    //The decryption can take some time, so start the event early
    dispatch({
        type: CREATE_SEND_TRANSACTION_START,
        metadata: metadata
    });

    //Let the spinners start, so we will delay the decryption/signing a bit
    await Timeout.set(1000);

    try {

        let address = Wallet.getWalletAddress();
        let sequence = await Wallet.getThetaTxSequence(address, network);
        let unsignedTx = Theta.unsignedSendTx(txData, sequence);
        let signedTx = await Wallet.signTransaction(network, unsignedTx, password);

        if (signedTx) {
            let opts = {
                onSuccess: function (dispatch, response) {
                    //Show success alert
                    Alerts.showSuccess("Your transaction is now being processed.");

                    //Hide the send modals
                    dispatch(hideModals());
                },
                onError: function (dispatch, response) {
                    const errorMessage = _.get(response, ['body', 'message'], DefaultTransactionErrorMessage)
                    Alerts.showError(errorMessage);
                }
            };

            //Call API to create the transaction
            let result = reduxFetch(CREATE_SEND_TRANSACTION, function () {
                return Api.createTransaction({data: signedTx}, {network: network});
            }, metadata, opts);

            return Promise.resolve(result);
        }
    }
    catch (e) {
        //Signing failed so end the request
        dispatch({
            type: CREATE_SEND_TRANSACTION_END
        });

        //Display error
        Alerts.showError(e.message);

        return Promise.resolve(null);
    }
}

export function createSendTransaction(network, txData, password) {
    return function (dispatch, getState) {
        createSendTransactionAsync(dispatch, network, txData, password).then(function (thunk) {
            if (thunk) {
                dispatch(thunk);
            }
        });
    };
}


export async function createDepositStakeTransactionAsync(dispatch, network, txData, password) {
    let metadata = {
        network: network,
        txData: txData,
    };

    //The decryption can take some time, so start the event early
    dispatch({
        type: CREATE_DEPOSIT_STAKE_TRANSACTION_START,
        metadata: metadata
    });

    //Let the spinners start, so we will delay the decryption/signing a bit
    await Timeout.set(1000);

    try {

        let address = Wallet.getWalletAddress();
        let sequence = await Wallet.getThetaTxSequence(address, network);
        let unsignedTx = Theta.unsignedDepositStakeTx(txData, sequence);
        let signedTx = await Wallet.signTransaction(network, unsignedTx, password);

        if (signedTx) {
            let opts = {
                onSuccess: function (dispatch, response) {
                    //Show success alert
                    Alerts.showSuccess("Your transaction is now being processed.");

                    //Hide the send modals
                    dispatch(hideModals());
                },
                onError: function (dispatch, response) {
                    const errorMessage = _.get(response, ['body', 'message'], DefaultTransactionErrorMessage)
                    Alerts.showError(errorMessage);
                }
            };

            //Call API to create the transaction
            let result = reduxFetch(CREATE_DEPOSIT_STAKE_TRANSACTION, function () {
                return Api.createTransaction({data: signedTx}, {network: network});
            }, metadata, opts);

            return Promise.resolve(result);
        }
    }
    catch (e) {
        //Signing failed so end the request
        dispatch({
            type: CREATE_DEPOSIT_STAKE_TRANSACTION_END
        });

        //Display error
        Alerts.showError(e.message);

        return Promise.resolve(null);
    }
}

export function createDepositStakeTransaction(network, txData, password) {
    return function (dispatch, getState) {
        createDepositStakeTransactionAsync(dispatch, network, txData, password).then(function (thunk) {
            if (thunk) {
                dispatch(thunk);
            }
        });
    };
}

export async function createWithdrawStakeTransactionAsync(dispatch, network, txData, password) {
    let metadata = {
        network: network,
        txData: txData,
    };

    //The decryption can take some time, so start the event early
    dispatch({
        type: CREATE_WITHDRAW_STAKE_TRANSACTION_START,
        metadata: metadata
    });

    //Let the spinners start, so we will delay the decryption/signing a bit
    await Timeout.set(1000);

    try {

        let address = Wallet.getWalletAddress();
        let sequence = await Wallet.getThetaTxSequence(address, network);
        let unsignedTx = Theta.unsignedWithdrawStakeTx(txData, sequence);
        let signedTx = await Wallet.signTransaction(network, unsignedTx, password);

        if (signedTx) {
            let opts = {
                onSuccess: function (dispatch, response) {
                    //Show success alert
                    Alerts.showSuccess("Your transaction is now being processed.");

                    //Hide the send modals
                    dispatch(hideModals());
                },
                onError: function (dispatch, response) {
                    const errorMessage = _.get(response, ['body', 'message'], DefaultTransactionErrorMessage)
                    Alerts.showError(errorMessage);
                }
            };

            //Call API to create the transaction
            let result = reduxFetch(CREATE_WITHDRAW_STAKE_TRANSACTION, function () {
                return Api.createTransaction({data: signedTx}, {network: network});
            }, metadata, opts);

            return Promise.resolve(result);
        }
    }
    catch (e) {
        //Signing failed so end the request
        dispatch({
            type: CREATE_WITHDRAW_STAKE_TRANSACTION_END
        });

        //Display error
        Alerts.showError(e.message);

        return Promise.resolve(null);
    }
}

export function createWithdrawStakeTransaction(network, txData, password) {
    return function (dispatch, getState) {
        createWithdrawStakeTransactionAsync(dispatch, network, txData, password).then(function (thunk) {
            if (thunk) {
                dispatch(thunk);
            }
        });
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
