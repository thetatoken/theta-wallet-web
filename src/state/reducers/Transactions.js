import * as actionTypes from "../types/Transactions";
import { zipMap } from "../../utils/Utils";
import _ from 'lodash';
import TokenTypes from "../../constants/TokenTypes";

const INITIAL_STATE = {
    isFetchingTransactions : false,

    isCreatingTransaction : false,

    transactions: [],
    transactionsByHash: {},

    pendingTransaction: {},

    localTransactionsByHash: {},

    //Legacy
    isFetchingERC20Transactions : false,
    isFetchingEthereumTransactions : false,

    ethereumNetworkTransactionsByHash: {},
    ethereumNetworkTransactionsByType: {}
};

function pendingTransactionToLocalTransaction(pendingTransaction, hash){
    let type = null;
    let tokenSymbol = null;

    if(pendingTransaction.tokenType === TokenTypes.ERC20_THETA){
        type = TokenTypes.ERC20_THETA;
        tokenSymbol = "THETA";
    }
    else if(pendingTransaction.tokenType === TokenTypes.ETHEREUM){
        type = TokenTypes.ETHEREUM;
        tokenSymbol = "ETH";
    }

    return {
        type: type,
        from: pendingTransaction.from,
        to: pendingTransaction.to,
        hash: hash,
        token_symbol: tokenSymbol,
        dec_value: pendingTransaction.amount,
        time_stamp: "" + (new Date().getTime() / 1000), //Server returns as a string
        bound: "outbound",
        is_local: true
    };
}

export const transactionsReducer = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        //ERC20 Transactions
        case actionTypes.FETCH_TRANSACTIONS_ERC20_START:{
            return Object.assign({}, state, {
                isFetchingERC20Transactions: true
            });
        }
        case actionTypes.FETCH_TRANSACTIONS_ERC20_END:{
            return Object.assign({}, state, {
                isFetchingERC20Transactions: false
            });
        }
        case actionTypes.FETCH_TRANSACTIONS_ERC20_SUCCESS:{
            let body = action.response.body;
            let transactions = body.transactions;

            return Object.assign({}, state, {
                ethereumNetworkTransactionsByHash: Object.assign({}, state.ethereumNetworkTransactionsByHash, zipMap(transactions.map(({ hash }) => hash), transactions)),
                ethereumNetworkTransactionsByType: Object.assign({}, state.ethereumNetworkTransactionsByType, {"erc20" : transactions})
            });
        }

        //ETH Transactions
        case actionTypes.FETCH_TRANSACTIONS_ETHEREUM_START:{
            return Object.assign({}, state, {
                isFetchingEthereumTransactions: true
            });
        }
        case actionTypes.FETCH_TRANSACTIONS_ETHEREUM_END:{
            return Object.assign({}, state, {
                isFetchingEthereumTransactions: false
            });
        }
        case actionTypes.FETCH_TRANSACTIONS_ETHEREUM_SUCCESS:{
            let body = action.response.body;
            let transactions = body.transactions;

            return Object.assign({}, state, {
                ethereumNetworkTransactionsByHash: Object.assign({}, state.ethereumNetworkTransactionsByHash, zipMap(transactions.map(({ hash }) => hash), transactions)),
                ethereumNetworkTransactionsByType: Object.assign({}, state.ethereumNetworkTransactionsByType, {"ethereum" : transactions})
            });
        }

        //Theta Transactions
        case actionTypes.FETCH_TRANSACTIONS_THETA_START:{
            return Object.assign({}, state, {
                isFetchingTransactions: true
            });
        }
        case actionTypes.FETCH_TRANSACTIONS_THETA_END:{
            return Object.assign({}, state, {
                isFetchingTransactions: false
            });
        }
        case actionTypes.FETCH_TRANSACTIONS_THETA_SUCCESS:{
            let body = action.response.body;
            let transactions = body.transactions;

            return Object.assign({}, state, {
                transactionsByHash: Object.assign({}, state.transactionsByHash, zipMap(transactions.map(({ hash }) => hash), transactions)),
                transactions: transactions
            });
        }



        //Create Transaction
        case actionTypes.CREATE_TRANSACTION_START:{
            return Object.assign({}, state, {
                isCreatingTransaction: true,
                pendingTransaction: action.metadata.txData
            });
        }
        case actionTypes.CREATE_TRANSACTION_END:{
            return Object.assign({}, state, {
                isCreatingTransaction: false
            });
        }
        case actionTypes.CREATE_TRANSACTION_SUCCESS:{
            let body = action.response.body;
            let hash = body.hash;
            let localTransaction = pendingTransactionToLocalTransaction(state.pendingTransaction, hash);

            return Object.assign({}, state, {
                localTransactionsByHash: Object.assign({}, state.localTransactionsByHash, {[hash]: localTransaction}),
                pendingTransaction: null
            });
        }

        //Fetch Transaction
        case actionTypes.FETCH_TRANSACTION_SUCCESS:{
            let body = action.response.body;
            let transactions = body.transactions;
            let transaction = null;

            if(transactions.length > 0){
                transaction = transactions[0];

                return Object.assign({}, state, {
                    //Remove the local transaction from the state since it is in the blockchain now
                    localTransactionsByHash: _.omit(state.localTransactionsByHash, transaction.hash),

                    //Append this tx to the list
                    transactionsByHash: Object.assign({}, state.transactionsByHash,  {[transaction.hash]: transaction}),
                    transactionsByType: Object.assign({}, state.transactionsByType, {[transaction.type] : [...state.transactionsByType[transaction.type], transaction]})
                });
            }

            return state;
        }

        //Reset all state (useful when recovering a wallet which may have another wallet's state stored in memory))
        case actionTypes.RESET:{
            return INITIAL_STATE;
        }

        default:{
            return state
        }
    }
};