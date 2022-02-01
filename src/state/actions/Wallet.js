import _ from 'lodash';
import Api from '../../services/Api'
import { reduxFetch } from'./Api'
import {FETCH_WALLET_BALANCES, SET_WALLET_ADDRESS, RESET, SET_NETWORK} from "../types/Wallet";
import Wallet, {WalletUnlockStrategy} from '../../services/Wallet'
import TemporaryState from "../../services/TemporaryState";
import {resetTransactionsState} from './Transactions'
import Router from "../../services/Router";
import Alerts from '../../services/Alerts'
import {onLine} from "../../utils/Utils";
import Config from "../../Config";
import {hideLoader, hideModal, showLoader} from "./ui";
import Theta from "../../services/Theta";


export function setNetwork(networkId){
    Theta.setChainID(networkId);
    Wallet.controller.preferencesController.setNetwork({
        chainId: networkId
    });

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

        // Reload the app
        window.location.reload();
    };
}

export function updateAccountBalances(shouldShowLoader){
    return async function(dispatch, getState){
        if(shouldShowLoader){
            dispatch(showLoader());
        }

        const result = await Wallet.controller.RPCApi.updateAccountBalances({});

        if(shouldShowLoader){
            dispatch(hideLoader());
        }
    };
}

export function updateAccountStakes(address, shouldShowLoader){
    return async function(dispatch, getState){
        if(shouldShowLoader){
            dispatch(showLoader());
        }

        const result = await Wallet.controller.RPCApi.updateAccountStakes({
            address: address
        });

        if(shouldShowLoader) {
            dispatch(hideLoader());
        }
    };
}

//
// Tokens
//

export function addToken(tokenData) {
    return async (dispatch) => {
        try {
            dispatch(showLoader());

            const result = await Wallet.controller.RPCApi.addToken({
                token: tokenData
            });

            dispatch(hideModal());

            dispatch(hideLoader());

            return result;
        }
        catch (error) {
            dispatch(hideLoader());
            return false;
        }
    };
}

export function removeToken(address) {
    return async (dispatch) => {
        try {
            dispatch(showLoader());

            const result = await Wallet.controller.RPCApi.removeToken({
                address: address
            });

            dispatch(hideLoader());

            return result;
        }
        catch (error) {
            dispatch(hideLoader());
            return false;
        }
    };
}


export function connectHardware(deviceName, page, hdPath) {
    return async (dispatch) => {
        dispatch(showLoader(`Looking for your ${_.capitalize(deviceName)}...`));

        let accounts
        try {
            accounts = await Wallet.controller.connectHardware(
                deviceName,
                page,
                hdPath,
            )
        } catch (error) {
            dispatch(hideLoader())
            Alerts.showError(error.message);
            throw error
        }
        dispatch(hideLoader())

        return accounts
    }
}

export function unlockHardwareWalletAccount(index, address, deviceName, hdPath) {
    return (dispatch) => {
        dispatch(showLoader())
        return new Promise(async (resolve, reject) => {
            await Wallet.controller.unlockHardwareWalletAccount(
                index,
                deviceName,
                hdPath,
                (err) => {
                    if (err) {
                        Alerts.showError(err.message);
                        reject(err)
                        return
                    }

                    dispatch(hideLoader())
                    resolve()
                },
            );

            dispatch(hideLoader())


            dispatch(unlockWallet(
                WalletUnlockStrategy.COLD_WALLET,
                null,
                {hardware: deviceName, path: hdPath, address: address}));
        })
    }
}
