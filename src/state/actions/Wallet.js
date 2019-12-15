import Api from '../../services/Api'
import { reduxFetch } from'./Api'
import {FETCH_WALLET_BALANCES, FETCH_WALLET_ETHEREUM_BALANCES, SET_WALLET_ADDRESS, RESET, SET_NETWORK} from "../types/Wallet";
import Wallet from '../../services/Wallet'
import TemporaryState from "../../services/TemporaryState";
import {resetTransactionsState} from './Transactions'
import Router from "../../services/Router";
import Alerts from '../../services/Alerts'
import {onLine} from "../../utils/Utils";
import Networks from "../../constants/Networks";
import Config from "../../Config";
import {store} from "../../state";
import {showModal} from "./Modals";
import ModalTypes from "../../constants/ModalTypes";
import Theta from "../../services/Theta";


export function setNetwork(networkId){
    Theta.setChainID(networkId);

    return async function(dispatch, getState){
        dispatch({
                type: SET_NETWORK,
                network: networkId
            }
        );
    };
}

export function fetchWalletBalances(){
    let address = Wallet.getWalletAddress();

    return reduxFetch(FETCH_WALLET_BALANCES, function(){
        return Api.fetchWallet(address, {network: Theta.getChainID()});
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

export function getHardwareWalletAddresses(hardware, page, derivationPath){
    return async function(dispatch, getState){
        let addresses = null;

        try {
            addresses = await Wallet.getHardwareWalletAddresses(hardware, page, derivationPath);
        }
        catch (e) {
            Alerts.showError(e.message);
        }

        if(addresses){
            store.dispatch(showModal({
                type: ModalTypes.COLD_WALLET_SELECTOR,
                props: {
                    hardware: hardware,
                    addresses: addresses,
                    page: page,
                    derivationPath: derivationPath
                }
            }));
        }
    };
}

export function logout(){
    return async function(dispatch, getState){
        //Clear the wallet
        Wallet.setWallet(null);

        //Restore the default chainId
        Theta.setChainID(Config.defaultThetaChainID);

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
