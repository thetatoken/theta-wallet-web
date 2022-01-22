import {UPDATE_THETA_WALLET_STATE} from "../types/ThetaWallet";

const INITIAL_STATE = {

};

export const thetaWalletReducer = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case UPDATE_THETA_WALLET_STATE : {
            return Object.assign({}, state, action.data);
        }
        default: {
            return state;
        }
    }
};
