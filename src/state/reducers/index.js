import { combineReducers } from 'redux';
import { walletReducer } from '../reducers/Wallet';
import { transactionsReducer } from '../reducers/Transactions';
import { modalsReducer } from '../reducers/Modals';
import { stakesReducer } from '../reducers/Stakes';

export const rootReducer = combineReducers({
    wallet: walletReducer,
    transactions: transactionsReducer,
    modals: modalsReducer,
    stakes: stakesReducer
});
