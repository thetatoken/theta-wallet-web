import { combineReducers } from 'redux';
import { walletReducer } from '../reducers/Wallet';
import { transactionsReducer } from '../reducers/Transactions';
import { uiReducer } from './ui';
import { stakesReducer } from '../reducers/Stakes';
import { nodesReducer } from '../reducers/Nodes';
import {thetaWalletReducer} from "./ThetaWallet";

export const rootReducer = combineReducers({
    wallet: walletReducer,
    transactions: transactionsReducer,
    ui: uiReducer,
    // stakes: stakesReducer,
    // nodes: nodesReducer,
    thetaWallet: thetaWalletReducer,
});
