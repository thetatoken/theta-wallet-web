import { createSelector } from 'reselect'
import _ from "lodash";
import TokenTypes from "../../constants/TokenTypes";
import Wallet from '../../services/Wallet'

const getTransactions = (state) => state.transactions.transactions;
const getLocalTransactionsByHash = (state) => state.transactions.localTransactionsByHash;

const getEthereumNetworkTransactionsByType = (state) => state.transactions.ethereumNetworkTransactionsByType;

const getWalletAddress = (state) => Wallet.getWalletAddress();

function transformTransaction(walletAddress, transaction) {
    return Object.assign({}, transaction, {bound: (walletAddress === transaction.to ? "inbound" : "outbound")});
}

function getTransformedEthereumNetworkTransactions(walletAddress, type, transactionsByType, localTransactionsByHash) {
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
    let localTransactions = _.filter(Object.values(localTransactionsByHash), function(transaction){
        return !transactionHashes.has(transaction.hash) && transaction["type"] === type;
    });

    let allTransactions = _.flatten([localTransactions, transactions]);

    //Ensure all transactiosn are unique
    return _.uniqBy(allTransactions, 'hash')
}

function getTransformedTransactions(walletAddress, txs, localTransactionsByHash) {
    walletAddress = (walletAddress ? walletAddress.toLowerCase() : null);

    console.log("getTransformedTransactions :: txs == ");
    console.log(txs);

    //TODO actually transform the Theta txs

    //Merge these transactions and sort by timestamp
    let txTransformer = _.partial(transformTransaction, walletAddress);
    let transactions = _(txs)
        .sortBy(tx => parseInt(tx.timestamp))
        .reverse()
        .map(txTransformer)
        .value();
    let transactionHashes = new Set(_.map(transactions, function(transaction){
        return transaction.hash;
    }));
    let localTransactions = _.filter(Object.values(localTransactionsByHash), function(transaction){
        return !transactionHashes.has(transaction.hash);
    });

    let allTransactions = _.flatten([localTransactions, transactions]);

    //Ensure all transactions are unique
    return _.uniqBy(allTransactions, 'hash')
}

export const getERC20Transactions = createSelector(
    [ getWalletAddress, getEthereumNetworkTransactionsByType, getLocalTransactionsByHash ],
    (walletAddress, transactionsByType, localTransactionsByHash) => {
        return getTransformedEthereumNetworkTransactions(walletAddress, TokenTypes.ERC20_THETA, transactionsByType, localTransactionsByHash);
    }
);

export const getEthereumTransactions = createSelector(
    [ getWalletAddress, getEthereumNetworkTransactionsByType, getLocalTransactionsByHash ],
    (walletAddress, transactionsByType, localTransactionsByHash) => {
        return getTransformedEthereumNetworkTransactions(walletAddress, TokenTypes.ETHEREUM, transactionsByType, localTransactionsByHash);
    }
);

export const getThetaNetworkTransactions = createSelector(
    [ getWalletAddress, getTransactions, getLocalTransactionsByHash ],
    (walletAddress, transactions, localTransactionsByHash) => {
        return getTransformedTransactions(walletAddress, transactions, localTransactionsByHash);
    }
);