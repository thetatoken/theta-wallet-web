import { combineReducers } from 'redux';
import { walletReducer } from './Wallet';
import { uiReducer } from './ui';
import {thetaWalletReducer} from "./ThetaWallet";

export const rootReducer = combineReducers({
    wallet: walletReducer,
    ui: uiReducer,
    thetaWallet: thetaWalletReducer,
});
