import { combineReducers } from 'redux';
import { walletReducer } from '../reducers/Wallet';
import { transactionsReducer } from '../reducers/Transactions';
import { modalsReducer } from '../reducers/Modals';
import { stakesReducer } from '../reducers/Stakes';
import { nodesReducer } from '../reducers/Nodes';

export const rootReducer = combineReducers({
    wallet: walletReducer,
    transactions: transactionsReducer,
    modals: modalsReducer,
    stakes: stakesReducer,
    nodes: nodesReducer
});
