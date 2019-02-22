import { combineReducers } from 'redux';
import { walletReducer } from '../reducers/Wallet';
import { transactionsReducer } from '../reducers/Transactions';
import { modalsReducer } from '../reducers/Modals';

export const rootReducer = combineReducers({
    wallet: walletReducer,
    transactions: transactionsReducer,
    modals: modalsReducer
});