import Api from '../../services/Api'
import { reduxFetch } from'./Api'
import {FETCH_WALLET_BALANCES, FETCH_WALLET_ETHEREUM_BALANCES, SET_WALLET_ADDRESS, RESET} from "../types/Wallet";
import Wallet from '../../services/Wallet'
import TemporaryState from "../../services/TemporaryState";
import {resetTransactionsState} from './Transactions'
import Router from "../../services/Router";
import Alerts from '../../services/Alerts'
import {onLine} from "../../utils/Utils";
import Networks from "../../constants/Networks";
import Config from "../../Config";


export function fetchWalletEthereumBalances(){
    let address = Wallet.getWalletAddress();

    return reduxFetch(FETCH_WALLET_ETHEREUM_BALANCES, function(){
        return Api.fetchWallet(address, {network: Networks.ETHEREUM});
    });
}

export function fetchWalletBalances(){
    let address = Wallet.getWalletAddress();

    return reduxFetch(FETCH_WALLET_BALANCES, function(){
        return Api.fetchWallet(address, {network: Config.thetaNetwork});
    });
}

export function resetWalletState(){
    return {
        type: RESET,
    }
}

export function setWalletAddress(address){
    return {
        type: SET_WALLET_ADDRESS,
        address: address
    }
}

export function unlockWallet(strategy, password, data){
    return async function(dispatch, getState){
        let wallet = null;

        try {
            wallet = await Wallet.unlockWallet(strategy, password, data);
        }
        catch (e) {
            Alerts.showError(e.message);
        }

        if(wallet){
            dispatch(setWalletAddress(wallet.address));

            if(onLine()){
                //Navigate to the wallet
                Router.push('/wallet');
            }
            else{
                //Navigate to the offline until they enable their network again
                Router.push('/offline');
            }
        }
    };
}

export function logout(){
    return async function(dispatch, getState){
        //Clear the wallet
        Wallet.setWallet(null);

        //Delete the temp state
        TemporaryState.setWalletData(null);

        //Reset wallet state
        dispatch(resetWalletState());

        //Reset transactions state
        dispatch(resetTransactionsState());

        //Navigate away
        Router.push('/unlock');
    };
}