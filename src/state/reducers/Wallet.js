import * as actionTypes from "../types/Wallet";
import { zipMap } from "../../utils/Utils";

const INITIAL_STATE = {
    isFetchingBalances : false,

    address: null,
    name: null,
    balances: [],
    balancesByType: {},
    gasPrice: 0,
};

export const walletReducer = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case actionTypes.FETCH_WALLET_BALANCES_START:{
            return Object.assign({}, state, {
                isFetchingBalances: true
            });
        }
        case actionTypes.FETCH_WALLET_BALANCES_END:{
            return Object.assign({}, state, {
                isFetchingBalances: false
            });
        }
        case actionTypes.FETCH_WALLET_BALANCES_SUCCESS:{
            let body = action.response.body;
            let balances = body.balances;

            return Object.assign({}, state, {
                balances: balances,
                balancesByType: zipMap(balances.map(({ type }) => type), balances.map(({ value }) => value))
            });
        }
        case actionTypes.SET_WALLET_ADDRESS:{
            return Object.assign({}, state, {
                address: action.address
            });
        }
        case actionTypes.SET_WALLET_NAME: {
            return Object.assign({}, state, {
                name: action.name
            });
        }
        case actionTypes.SET_GAS_PRICE:{
            return Object.assign({}, state, {
                gasPrice: action.gasPrice
            });
        }

        //Reset all state (useful when recovering a wallet which may have another wallet's state stored in memory))
        case actionTypes.RESET:{
            return INITIAL_STATE;
        }

        default:{
            return state
        }
    }
};