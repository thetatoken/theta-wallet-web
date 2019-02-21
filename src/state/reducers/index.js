import { combineReducers } from 'redux';
import { walletReducer } from '../reducers/Wallet';
import { transactionsReducer } from '../reducers/Transactions';

export const rootReducer = combineReducers({
    wallet: walletReducer,
    transactions: transactionsReducer
});