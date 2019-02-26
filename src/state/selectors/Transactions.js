import { createSelector } from 'reselect'
import _ from "lodash";
import TokenTypes from "../../constants/TokenTypes";
import Wallet from '../../services/Wallet'

const getTransactionsByType = (state) => state.transactions.transactionsByType;
const getLocalTransactionsByID = (state) => state.transactions.localTransactionsByID;
const getWalletAddress = (state) => Wallet.getWalletAddress();

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

    walletAddress = (walletAddress ? walletAddress.toLowerCase() : null);

    //Merge these transactions and sort by timestamp
    let scopedTransactions = transactionsByType[type];
    let txTransformer = _.partial(transformTransaction, walletAddress);
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

    let allTransactions = _.flatten([localTransactions, transactions]);

    //Ensure all transactiosn are unique
    return _.uniqBy(allTransactions, 'hash')
}

export const getERC20Transactions = createSelector(
    [ getWalletAddress, getTransactionsByType, getLocalTransactionsByID ],
    (walletAddress, transactionsByType, localTransactionsByID) => {
        return getTransactions(walletAddress, TokenTypes.ERC20_THETA, transactionsByType, localTransactionsByID);
    }
);

export const getEthereumTransactions = createSelector(
    [ getWalletAddress, getTransactionsByType, getLocalTransactionsByID, getWalletAddress ],
    (walletAddress, transactionsByType, localTransactionsByID) => {
        return getTransactions(walletAddress, TokenTypes.ETHEREUM, transactionsByType, localTransactionsByID);
    }
);