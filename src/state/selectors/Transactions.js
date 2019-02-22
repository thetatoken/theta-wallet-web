import { createSelector } from 'reselect'
import _ from "lodash";

const getTransactionsByType = (state) => state.transactions.transactionsByType;
const getLocalTransactionsByID = (state) => state.transactions.localTransactionsByID;

function transformTransaction(walletAddress, transaction) {
    console.log("transformTransaction :: transaction == ");
    console.log(transaction);

    return Object.assign({}, transaction, {bound: (walletAddress === transaction.to ? "inbound" : "outbound")});
}

function getTransactions(walletAddress, type, transactionsByType, localTransactionsByID) {
    console.log("getTransactions :: transactionsByType == ");
    console.log(transactionsByType);
    console.log("transactionsByType[type] == ");
    console.log(transactionsByType[type]);

    //Merge these transactions and sort by timestamp
    let scopedTransactions = transactionsByType[type];
    let txTransformer = _.partial(transformTransaction, walletAddress.toLowerCase());
    let transactions = _(scopedTransactions)
        .sortBy(tx => parseInt(tx.time_stamp))
        .reverse()
        .map(txTransformer)
        .value();
    let transactionHashes = new Set(_.map(transactions, function(transaction){
        return transaction.hash;
    }));
    let localTransactions = _.filter(Object.values(localTransactionsByID), function(transaction){
        return !transactionHashes.has(transaction.hash) && transaction["type"] === type;
    });

    return _.flatten([localTransactions, transactions]);
}

export const getERC20Transactions = createSelector(
    [ getTransactionsByType, getLocalTransactionsByID ],
    (transactionsByType, localTransactionsByID) => {
        return getTransactions("", "erc20", transactionsByType, localTransactionsByID);
    }
);

export const getEthereumTransactions = createSelector(
    [ getTransactionsByType, getLocalTransactionsByID ],
    (transactionsByType, localTransactionsByID) => {
        return getTransactions("", "ethereum", transactionsByType, localTransactionsByID);
    }
);