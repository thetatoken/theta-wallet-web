import * as actionTypes from "../types/Wallet";
import { zipMap } from "../../utils/Utils";
import Config from '../../Config';

const INITIAL_STATE = {
    thetaWallet: null,

    network: Config.defaultThetaChainID,

    isFetchingBalances : false,
    isFetchingEthereumBalances : false,

    address: null,
    name: null,

    //Theta
    balances: [],
    balancesByType: {},
    balancesRefreshedAt: null,

    //Legacy
    ethereumBalances:[],
    ethereumBalancesByType: {},
};

export const walletReducer = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case actionTypes.SET_NETWORK:{
            return Object.assign({}, state, {
                network: action.network
            });
        }
        case actionTypes.FETCH_WALLET_ETHEREUM_BALANCES_START:{
            return Object.assign({}, state, {
                isFetchingEthereumBalances: true
            });
        }
        case actionTypes.FETCH_WALLET_ETHEREUM_BALANCES_END:{
            return Object.assign({}, state, {
                isFetchingEthereumBalances: false
            });
        }
        case actionTypes.FETCH_WALLET_ETHEREUM_BALANCES_SUCCESS:{
            let body = action.response.body;
            let balances = body.balances;

            return Object.assign({}, state, {
                ethereumBalances: balances,
                ethereumBalancesByType: zipMap(balances.map(({ type }) => type), balances.map(({ value }) => value))
            });
        }

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
                balancesByType: zipMap(balances.map(({ type }) => type), balances.map(({ value }) => value)),
                balancesRefreshedAt: new Date()
            });
        }

        case actionTypes.SET_WALLET_ADDRESS:{
            return Object.assign({}, state, {
                address: action.address
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
