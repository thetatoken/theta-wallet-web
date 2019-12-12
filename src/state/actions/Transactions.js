import Api from '../../services/Api'
import {reduxFetch} from './Api'
import {
    CREATE_SEND_TRANSACTION,
    CREATE_SEND_TRANSACTION_END,
    CREATE_SEND_TRANSACTION_START,
    FETCH_TRANSACTIONS_ERC20,
    FETCH_TRANSACTIONS_ETHEREUM,
    FETCH_TRANSACTION,
    RESET,
    FETCH_TRANSACTIONS_THETA,
    CREATE_DEPOSIT_STAKE_TRANSACTION_START,
    CREATE_DEPOSIT_STAKE_TRANSACTION,
    CREATE_DEPOSIT_STAKE_TRANSACTION_END,
    CREATE_WITHDRAW_STAKE_TRANSACTION,
    CREATE_WITHDRAW_STAKE_TRANSACTION_START,
    CREATE_WITHDRAW_STAKE_TRANSACTION_END
} from "../types/Transactions";
import Wallet from "../../services/Wallet";
import Theta from "../../services/Theta";
import TokenTypes from "../../constants/TokenTypes";
import Timeout from 'await-timeout';
import {hideModals} from "./Modals";
import Alerts from "../../services/Alerts";
import Config from '../../Config'

export function fetchERC20Transactions() {
    let address = Wallet.getWalletAddress();

    return reduxFetch(FETCH_TRANSACTIONS_ERC20, function () {
        return Api.fetchTransactions(address, {type: TokenTypes.ERC20_THETA});
    });
}

export function fetchEthereumTransactions() {
    let address = Wallet.getWalletAddress();

    return reduxFetch(FETCH_TRANSACTIONS_ETHEREUM, function () {
        return Api.fetchTransactions(address, {type: TokenTypes.ETHEREUM});
    });
}

export function fetchThetaTransactions() {
    let address = Wallet.getWalletAddress();

    return reduxFetch(FETCH_TRANSACTIONS_THETA, function () {
        return Api.fetchTransactions(address, {network: Config.thetaNetwork});
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
                    Alerts.showError(response.body.message);
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
        //TODO create deposit stake Tx instead
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
                    Alerts.showError(response.body.message);
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
                    Alerts.showError(response.body.message);
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

export function resetTransactionsState(){
    return {
        type: RESET,
    }
}
