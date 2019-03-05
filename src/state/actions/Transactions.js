import Api from '../../services/Api'
import {reduxFetch} from './Api'
import {
    CREATE_TRANSACTION, CREATE_TRANSACTION_END,
    CREATE_TRANSACTION_START,
    FETCH_TRANSACTIONS_ERC20,
    FETCH_TRANSACTIONS_ETHEREUM,
    FETCH_TRANSACTION,
    RESET, FETCH_TRANSACTIONS_THETA
} from "../types/Transactions";
import Wallet from "../../services/Wallet";
import TokenTypes from "../../constants/TokenTypes";
import Networks from "../../constants/Networks";
import Timeout from 'await-timeout';
import {hideModals} from "./Modals";
import Alerts from "../../services/Alerts";

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
        return Api.fetchTransactions(address, {network: Networks.THETA_MAINNET});
    });
}

export function fetchEthereumTransaction(txHash) {
    return reduxFetch(FETCH_TRANSACTION, function () {
        return Api.fetchTransaction(txHash, {network: Networks.ETHEREUM});
    });
}

export function fetchThetaTransaction(txHash) {
    return reduxFetch(FETCH_TRANSACTION, function () {
        return Api.fetchTransaction(txHash, {network: Networks.THETA_MAINNET});
    });
}

function errorToHumanError(error){
    if(error === "Insufficient funds for gas * price + value"){
        return "Insufficient gas, please deposit additional Ethereum";
    }
    else{
        return error;
    }
}

export async function createTransactionAsync(dispatch, network, txData, password) {
    let metadata = {txData: txData};

    //The decryption can take some time, so start the event early
    dispatch({
        type: CREATE_TRANSACTION_START,
        metadata: metadata
    });

    //Let the spinners start, so we will delay the decryption/signing a bit
    await Timeout.set(1000);

    try {
        let signedTransaction = await Wallet.signTransaction(network, txData, password);

        if (signedTransaction) {
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
            let result = reduxFetch(CREATE_TRANSACTION, function () {
                return Api.createTransaction({data: signedTransaction}, {network: network});
            }, metadata, opts);

            return Promise.resolve(result);
        }
    }
    catch (e) {
        //Signing failed so end the request
        dispatch({
            type: CREATE_TRANSACTION_END
        });

        //Display error
        Alerts.showError(e.message);

        return Promise.resolve(null);
    }
}

export function createTransaction(network, txData, password) {
    return function (dispatch, getState) {
        createTransactionAsync(dispatch, network, txData, password).then(function (thunk) {
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