import * as actionTypes from "../types/Transactions";
import {zipMap} from "../../utils/Utils";
import _ from 'lodash';
import TokenTypes from "../../constants/TokenTypes";
import {isThetaNetwork} from "../../constants/Networks";
import {BigNumber} from "bignumber.js";

const INITIAL_STATE = {
    isFetchingTransactions: false,

    isCreatingTransaction: false,

    transactions: [],
    transactionsByHash: {},

    pendingTransaction: {},

    localTransactionsByHash: {},

    pendingDepositStakeTransaction: null,
    pendingWithdrawStakeTransaction: null,


    //Legacy
    isFetchingERC20Transactions: false,
    isFetchingEthereumTransactions: false,

    ethereumNetworkTransactionsByHash: {},
    ethereumNetworkTransactionsByType: {}
};

function pendingThetaNetworkTransactionToLocalTransaction(network, pendingTransaction, hash) {
    let { tokenType, from, to, amount, transactionFee} = pendingTransaction;

    return {
        hash: hash,//TODO this looks uppercase but it lowercase when creating the TX
        timestamp: "" + (new Date().getTime() / 1000), //Server returns as a string,
        fee: {
            theta: "0",
            tfuel: transactionFee
        },
        inputs: [
            {
                address: from,
                coins: {
                    theta: (tokenType === TokenTypes.THETA ? amount : 0),
                    tfuel: (tokenType === TokenTypes.THETA_FUEL ? amount : 0) + transactionFee
                }
            }
        ],
        outputs: [
            {
                address: to,
                coins: {
                    theta: (tokenType === TokenTypes.THETA ? amount : 0),
                    tfuel: (tokenType === TokenTypes.THETA_FUEL ? amount : 0)
                }
            }
        ],

        is_local: true,
        bound: "outbound",
        network: network
    };
}

function pendingEthererumNetworkTransactionToLocalTransaction(network, pendingTransaction, hash) {
    let type = null;
    let tokenSymbol = null;

    if (pendingTransaction.tokenType === TokenTypes.ERC20_THETA) {
        type = TokenTypes.ERC20_THETA;
        tokenSymbol = "THETA";
    }
    else if (pendingTransaction.tokenType === TokenTypes.ETHEREUM) {
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
        is_local: true,
        network: network
    };
}

function pendingTransactionToLocalTransaction(network, pendingTransaction, hash) {
    if (isThetaNetwork(network)) {
        return pendingThetaNetworkTransactionToLocalTransaction(network, pendingTransaction, hash);
    }
    else {
        //Unknown network
        return null;
    }
}

export const transactionsReducer = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        //ERC20 Transactions
        case actionTypes.FETCH_TRANSACTIONS_ERC20_START: {
            return Object.assign({}, state, {
                isFetchingERC20Transactions: true
            });
        }
        case actionTypes.FETCH_TRANSACTIONS_ERC20_END: {
            return Object.assign({}, state, {
                isFetchingERC20Transactions: false
            });
        }
        case actionTypes.FETCH_TRANSACTIONS_ERC20_SUCCESS: {
            let body = action.response.body;
            let transactions = body.transactions;

            return Object.assign({}, state, {
                ethereumNetworkTransactionsByHash: Object.assign({}, state.ethereumNetworkTransactionsByHash, zipMap(transactions.map(({hash}) => hash), transactions)),
                ethereumNetworkTransactionsByType: Object.assign({}, state.ethereumNetworkTransactionsByType, {"erc20": transactions})
            });
        }

        //ETH Transactions
        case actionTypes.FETCH_TRANSACTIONS_ETHEREUM_START: {
            return Object.assign({}, state, {
                isFetchingEthereumTransactions: true
            });
        }
        case actionTypes.FETCH_TRANSACTIONS_ETHEREUM_END: {
            return Object.assign({}, state, {
                isFetchingEthereumTransactions: false
            });
        }
        case actionTypes.FETCH_TRANSACTIONS_ETHEREUM_SUCCESS: {
            let body = action.response.body;
            let transactions = body.transactions;

            return Object.assign({}, state, {
                ethereumNetworkTransactionsByHash: Object.assign({}, state.ethereumNetworkTransactionsByHash, zipMap(transactions.map(({hash}) => hash), transactions)),
                ethereumNetworkTransactionsByType: Object.assign({}, state.ethereumNetworkTransactionsByType, {"ethereum": transactions})
            });
        }

        //Theta Transactions
        case actionTypes.FETCH_TRANSACTIONS_THETA_START: {
            return Object.assign({}, state, {
                isFetchingTransactions: true
            });
        }
        case actionTypes.FETCH_TRANSACTIONS_THETA_END: {
            return Object.assign({}, state, {
                isFetchingTransactions: false
            });
        }
        case actionTypes.FETCH_TRANSACTIONS_THETA_SUCCESS: {
            let body = action.response.body;
            let transactions = body.transactions;

            //The explorer may give us txs that are pending and have no data.  The UI can't show these because it has no data
            transactions = _.filter(transactions, function(tx) {
                return (tx['inputs'] !== null);
            });

            return Object.assign({}, state, {
                transactionsByHash: Object.assign({}, state.transactionsByHash, zipMap(transactions.map(({hash}) => hash), transactions)),
                transactions: transactions
            });
        }

        //Create Send Transaction
        case actionTypes.CREATE_SEND_TRANSACTION_START: {
            return Object.assign({}, state, {
                isCreatingTransaction: true,
                pendingTransaction: action.metadata.txData
            });
        }
        case actionTypes.CREATE_SEND_TRANSACTION_END: {
            return Object.assign({}, state, {
                isCreatingTransaction: false
            });
        }
        case actionTypes.CREATE_SEND_TRANSACTION_SUCCESS: {
            let body = action.response.body;
            let hash = body.hash;
            let network = action.metadata.network;
            let localTransaction = pendingTransactionToLocalTransaction(network, state.pendingTransaction, hash);

            return Object.assign({}, state, {
                localTransactionsByHash: Object.assign({}, state.localTransactionsByHash, {[hash]: localTransaction}),
                pendingTransaction: null
            });
        }

        //Create Deposit Stake Transaction
        case actionTypes.CREATE_DEPOSIT_STAKE_TRANSACTION_START: {
            return Object.assign({}, state, {
                isCreatingTransaction: true,
                pendingDepositStakeTransaction: action.metadata.txData
            });
        }
        case actionTypes.CREATE_DEPOSIT_STAKE_TRANSACTION_END: {
            return Object.assign({}, state, {
                isCreatingTransaction: false
            });
        }
        case actionTypes.CREATE_DEPOSIT_STAKE_TRANSACTION_SUCCESS: {
            return Object.assign({}, state, {
                pendingDepositStakeTransaction: null
            });
        }

        //Create Withdraw Stake Transaction
        case actionTypes.CREATE_WITHDRAW_STAKE_TRANSACTION_START: {
            return Object.assign({}, state, {
                isCreatingTransaction: true,
                pendingWithdrawStakeTransaction: action.metadata.txData
            });
        }
        case actionTypes.CREATE_WITHDRAW_STAKE_TRANSACTION_END: {
            return Object.assign({}, state, {
                isCreatingTransaction: false
            });
        }
        case actionTypes.CREATE_WITHDRAW_STAKE_TRANSACTION_SUCCESS: {
            return Object.assign({}, state, {
                pendingWithdrawStakeTransaction: null
            });
        }

        //Create Smart Contract Transaction
        case actionTypes.CREATE_SMART_CONTRACT_TRANSACTION_START: {
            return Object.assign({}, state, {
                isCreatingTransaction: true
            });
        }
        case actionTypes.CREATE_SMART_CONTRACT_TRANSACTION_END: {
            return Object.assign({}, state, {
                isCreatingTransaction: false
            });
        }
        case actionTypes.CREATE_SMART_CONTRACT_TRANSACTION_SUCCESS: {
            let body = action.response.body;
            let hash = body.hash;
            let network = action.metadata.network;
            //TODO grab the contract address here if it was a deploy, otherwise show a popup of the result?

            return state;
        }

        //Fetch Transaction
        case actionTypes.FETCH_TRANSACTION_SUCCESS: {
            let metadata = action.metadata;
            let body = action.response.body;
            let transaction = null;
            let transactions = body.transactions;

            if(isThetaNetwork(metadata.network)){
                //The explorer may give us txs that are pending and have no data.  The UI can't show these because it has no data
                transactions = _.filter(transactions, function(tx) {
                    return (tx['inputs'] !== null);
                });
            }


            if (transactions.length > 0) {
                transaction = transactions[0];

                let transactionsByHash = Object.assign({}, state.transactionsByHash, {[transaction.hash]: transaction});

                return Object.assign({}, state, {
                    //Remove the local transaction from the state since it is in the blockchain now
                    localTransactionsByHash: _.omit(state.localTransactionsByHash, transaction.hash),

                    //Append this tx to the list
                    transactionsByHash: transactionsByHash,
                    transactions: Object.values(transactionsByHash)
                });
            }

            return state;
        }

        //Reset all state (useful when recovering a wallet which may have another wallet's state stored in memory))
        case actionTypes.RESET: {
            return INITIAL_STATE;
        }

        default: {
            return state
        }
    }
};
