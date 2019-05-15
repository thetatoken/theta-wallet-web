import {createSelector} from 'reselect'
import _ from "lodash";
import TokenTypes from "../../constants/TokenTypes";
import Wallet from '../../services/Wallet'

const getTransactions = (state) => state.transactions.transactions;
const getLocalTransactionsByHash = (state) => state.transactions.localTransactionsByHash;

const getEthereumNetworkTransactionsByType = (state) => state.transactions.ethereumNetworkTransactionsByType;

const getWalletAddress = (state) => Wallet.getWalletAddress();

function sortThetaNetworkTransactionOutputs(walletAddress, outputs){
    return _.sortBy(outputs, [function (output) {
        //Ensure the output we care about is always first
        if (output.address === walletAddress) {
            return -1;
        }
        else {
            return 0;
        }
    }]);
}

function transformThetaNetworkTransaction(walletAddress, transaction) {
    let {outputs} = transaction;
    outputs = sortThetaNetworkTransactionOutputs(walletAddress, outputs);

    let output = null;
    let address = null;

    if (_.isNil(outputs)) {
        //This tx is messed up, return null to prevent breaking the UI
        return null;
    }

    output = outputs[0];
    address = output['address'];

    return Object.assign({}, transaction, {
        bound: (walletAddress === address ? "inbound" : "outbound"),
        outputs: outputs
    });
}

function transformEthereumNetworkTransaction(walletAddress, transaction) {
    return Object.assign({}, transaction, {bound: (walletAddress === transaction.to ? "inbound" : "outbound")});
}

function getTransformedEthereumNetworkTransactions(walletAddress, type, transactionsByType, localTransactionsByHash) {
    walletAddress = (walletAddress ? walletAddress.toLowerCase() : null);

    //Merge these transactions and sort by timestamp
    let scopedTransactions = transactionsByType[type];
    let txTransformer = _.partial(transformEthereumNetworkTransaction, walletAddress);
    let transactions = _(scopedTransactions)
        .sortBy(tx => parseInt(tx.time_stamp))
        .reverse()
        .map(txTransformer)
        .value();
    let transactionHashes = new Set(_.map(transactions, function (transaction) {
        return transaction.hash;
    }));
    let localTransactions = _.filter(Object.values(localTransactionsByHash), function (transaction) {
        return !transactionHashes.has(transaction.hash) && transaction["type"] === type;
    });

    let allTransactions = _.flatten([localTransactions, transactions]);

    //Ensure all transactiosn are unique
    return _.uniqBy(allTransactions, 'hash')
}

function getTransformedTransactions(walletAddress, txs, localTransactionsByHash) {
    walletAddress = (walletAddress ? walletAddress.toLowerCase() : null);

    //Merge these transactions and sort by timestamp
    let isNotNil = _.negate(_.isNil);//returns true if the obj is NOT nil
    let txTransformer = _.partial(transformThetaNetworkTransaction, walletAddress);
    let transactions = _(txs)
        .map(txTransformer)
        .filter(isNotNil)
        .sortBy(tx => parseInt(tx.timestamp))
        .reverse()
        .value();
    let transactionHashes = new Set(_.map(transactions, function (transaction) {
        return transaction.hash;
    }));
    let localTransactions = _.filter(Object.values(localTransactionsByHash), function (transaction) {
        return !transactionHashes.has(transaction.hash);
    });

    let allTransactions = _.flatten([localTransactions, transactions]);

    //Ensure all transactions are unique
    return _.uniqBy(allTransactions, 'hash')
}

export const getERC20Transactions = createSelector(
    [getWalletAddress, getEthereumNetworkTransactionsByType, getLocalTransactionsByHash],
    (walletAddress, transactionsByType, localTransactionsByHash) => {
        return getTransformedEthereumNetworkTransactions(walletAddress, TokenTypes.ERC20_THETA, transactionsByType, localTransactionsByHash);
    }
);

export const getEthereumTransactions = createSelector(
    [getWalletAddress, getEthereumNetworkTransactionsByType, getLocalTransactionsByHash],
    (walletAddress, transactionsByType, localTransactionsByHash) => {
        return getTransformedEthereumNetworkTransactions(walletAddress, TokenTypes.ETHEREUM, transactionsByType, localTransactionsByHash);
    }
);

export const getThetaNetworkTransactions = createSelector(
    [getWalletAddress, getTransactions, getLocalTransactionsByHash],
    (walletAddress, transactions, localTransactionsByHash) => {
        return getTransformedTransactions(walletAddress, transactions, localTransactionsByHash);
    }
);