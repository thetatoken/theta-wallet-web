import Api from '../../services/Api'
import {reduxFetch} from './Api'
import {
    CREATE_TRANSACTION, CREATE_TRANSACTION_END,
    CREATE_TRANSACTION_START,
    FETCH_TRANSACTIONS_ERC20,
    FETCH_TRANSACTIONS_ETH,
    FETCH_TRANSACTION,
    RESET
} from "../types/Transactions";
import Wallet from "../../services/Wallet";


export function fetchERC20Transactions() {
    let address = Wallet.getWallet().address;

    return reduxFetch(FETCH_TRANSACTIONS_ERC20, function () {
        return Api.fetchTransactions(address, {type: "erc20"});
    });
}

export function fetchETHTransactions() {
    let address = Wallet.getWallet().address;

    return reduxFetch(FETCH_TRANSACTIONS_ETH, function () {
        return Api.fetchTransactions(address, {type: "ethereum"});
    });
}

export function fetchETHTransaction(txHash) {
    return reduxFetch(FETCH_TRANSACTION, function () {
        return Api.fetchTransaction(txHash, {network: "ethereum"});
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

export async function createTransactionAsync(dispatch, transactionData) {
    let metadata = {transactionData: transactionData};

    //Signing may take time because of the bridge, better to start the request early
    dispatch({
        type: CREATE_TRANSACTION_START,
        metadata: metadata
    });

    let signedTransaction = await Wallet.signTransaction(transactionData);

    if (signedTransaction) {
        let opts = {
            onSuccess: function (dispatch, response) {
                //TODO show success alert
            },
            onError: function (dispatch, response) {
                //TODO show failure alert
            }
        };

        //Call API to create the transaction
        let result = reduxFetch(CREATE_TRANSACTION, function () {
            return Api.createTransaction({data: signedTransaction});
        }, metadata, opts);

        return Promise.resolve(result);
    } else {
        //Signing failed so end the request
        dispatch({
            type: CREATE_TRANSACTION_END
        });

        //TODO show invalid alert

        return Promise.resolve(null);
    }
}

export function createTransaction(transactionData) {
    return function (dispatch, getState) {
        createTransactionAsync(dispatch, transactionData).then(function (thunk) {
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