import { ethers } from 'ethers';
import _ from "lodash";
import Ethereum from './Ethereum'
import TokenTypes from "../constants/TokenTypes";
import {downloadFile} from "../utils/Utils";
import Alerts from "./Alerts";
import Theta from "./Theta";
import Networks, {isEthereumNetwork, isThetaNetwork} from "../constants/Networks";
import Api from './Api';
import TrezorConnect from 'trezor-connect';
import Trezor from './Trezor';

const ethUtil = require('ethereumjs-util');

const MnemonicPath = "m/44'/500'/0'/0/0";

export const NumPathsPerPage = 5;

export const WalletUnlockStrategy = {
    KEYSTORE_FILE: 'keystore-file',
    MNEMONIC_PHRASE: 'mnemonic-phrase',
    COLD_WALLET: 'cold-wallet',
    PRIVATE_KEY: 'private-key',
};

export default class Wallet {
    static _wallet = null;
    static _keystore = null;

    static setWallet(wallet){
        this._wallet = wallet;

        if(wallet === null){
            //Also clear the encrypted keystore
            Wallet.setKeystore(null);
        }
    }

    static getWallet(){
        return this._wallet;
    }

    static setKeystore(keystore){
        this._keystore = keystore;
    }

    static getKeystore(){
        return this._keystore;
    }

    static getWalletAddress(){
        return _.get(this._wallet, ['address'], null);
    }

    static getWalletPath(){
        return _.get(this._wallet, ['path'], null);
    }

    static getWalletHardware(){
        return _.get(this._wallet, ['hardware'], null);
    }

    static unlocked(){
        return (this._wallet !== null);
    }

    static encryptToKeystore(privateKey, password){
        let web3 = Ethereum.getWeb3();

        return web3.eth.accounts.encrypt(privateKey, password);
    }

    static decryptFromKeystore(keystoreJsonV3, password){
        let web3 = Ethereum.getWeb3();

        return web3.eth.accounts.decrypt(keystoreJsonV3, password);
    }

    static walletFromMnemonic(mnemonic){
        return ethers.Wallet.fromMnemonic(mnemonic, MnemonicPath);
    }

    static walletFromPrivateKey(privateKey){
        let web3 = Ethereum.getWeb3();

        return web3.eth.accounts.privateKeyToAccount(privateKey);
    }

    static async walletFromTrezor(page){
        // window.__TREZOR_CONNECT_SRC = 'https://localhost:8088/'; //TODO: for dev

        TrezorConnect.manifest({
            email: 'support@thetatoken.org',
            appUrl: 'https://wallet.thetatoken.org',
            keepSession: true
        });

        let baseDerivationPath = "m/44'/60'/0'/0/";
        let bundle = [];
        for(var i = 0; i < 50; i++){
            bundle.push({ path: baseDerivationPath + (page * NumPathsPerPage + i), showOnTrezor: false });
        }

        const result = await TrezorConnect.ethereumGetAddress({
            bundle: bundle,
            keepSession: true
        });
        return result;
    }

    static createWallet(password){
        let mnemonic = ethers.utils.HDNode.entropyToMnemonic(ethers.utils.randomBytes(16));
        let wallet = this.walletFromMnemonic(mnemonic);
        let keystore = this.encryptToKeystore(wallet.privateKey, password);

        return {
            wallet: wallet,
            keystore: keystore
        };
    }

    static async getHardwareWalletAddresses(hardware, page){
        let wallets = null;

        try{
            if(hardware === 'trezor'){
                let res = await Wallet.walletFromTrezor(page);
                wallets = res.payload;
            }
            else if(hardware === 'ledger'){
                // TODO
            }

            return wallets;
        }
        catch (e) {
            let message = null;

            if(hardware === 'trezor'){
                message = "No Trezor device attached.";
            }
            else if(hardware === 'ledger'){
                message = "No Ledger device attached.";
            }

            throw new Error(message);
        }
    }

    static async unlockWallet(strategy, password, data){
        let wallet = null;
        let { keystore, mnemonic, privateKey, hardware, address, path } = data;

        try{
            if(strategy === WalletUnlockStrategy.KEYSTORE_FILE){
                if(typeof keystore === 'string' || keystore instanceof String){
                    //Parse the keystore file
                    keystore = JSON.parse(keystore);
                }

                wallet = Wallet.decryptFromKeystore(keystore, password);
            }
            else if(strategy === WalletUnlockStrategy.MNEMONIC_PHRASE){
                mnemonic = mnemonic.toString();
                mnemonic = _.trim(mnemonic);

                wallet = Wallet.walletFromMnemonic(mnemonic.toString());
            }
            else if(strategy === WalletUnlockStrategy.PRIVATE_KEY){
                privateKey = _.trim(privateKey);

                if(privateKey.startsWith("0x") === false){
                    privateKey = "0x" + privateKey;
                }

                let privateKeyBuffer = ethUtil.toBuffer(privateKey);

                if(!ethUtil.isValidPrivate(privateKeyBuffer)){
                    throw new Error("Private key does not satisfy the curve requirements (ie. it is invalid)");
                }

                wallet = Wallet.walletFromPrivateKey(privateKey);
            }
            else if(strategy === WalletUnlockStrategy.COLD_WALLET){
                // if(hardware === 'trezor'){
                //     let resp = await Wallet.walletFromTrezor(addressPage);

                //     wallet = new Object();
                //     wallet.address = resp.payload[0].address;
                // }
                // else if(hardware === 'ledger'){
                //     // TODO
                // }

                wallet = new Object();
                wallet.address = address;
            }

            if(wallet){
                //Only store the address in memory
                Wallet.setWallet({address: wallet.address, path: path, hardware: hardware});

                if(strategy !== WalletUnlockStrategy.COLD_WALLET && (keystore === null || keystore === undefined)){
                    //The user is restoring a wallet, let's encrypt their keystore using their session password
                    keystore = Wallet.encryptToKeystore(wallet.privateKey, password);
                }

                Wallet.setKeystore(keystore);
            }

            return wallet;
        }
        catch (e) {
            let message = null;

            if(strategy === WalletUnlockStrategy.KEYSTORE_FILE){
                message = "Wrong password OR invalid keystore.";
            }
            else if(strategy === WalletUnlockStrategy.MNEMONIC_PHRASE){
                message = "No wallet found for this mnemonic phrase.";
            }
            else if(strategy === WalletUnlockStrategy.PRIVATE_KEY){
                message = "No wallet found for this private key.";
            }

            throw new Error(message);
        }
    }

    static async signTransaction(network, txData, password){
        let address = Wallet.getWalletAddress();

        if(Wallet.getWalletHardware() == "trezor"){
            let response = await Api.fetchSequence(address, {network: network});
            let responseJSON = await response.json();
            let sequence = parseInt(responseJSON['sequence']) + 1;

            return Trezor.signTransaction(txData, sequence);
        }
        else if(Wallet.getWalletHardware() == "trezor"){
            //TODO
        }    
        else {
            let keystore = Wallet.getKeystore();
            let wallet = Wallet.decryptFromKeystore(keystore, password);
        
            if(wallet){
                //User had the correct password
                if(isEthereumNetwork(network)){
                    //Ethereum Network
                    return Ethereum.signTransaction(txData, wallet.privateKey);
                }
                else if(isThetaNetwork(network)){
                    //Theta Network
                    let response = await Api.fetchSequence(address, {network: network});
                    let responseJSON = await response.json();
                    let sequence = parseInt(responseJSON['sequence']) + 1;

                    return Theta.signTransaction(txData, sequence, wallet.privateKey);
                }
            }
            else{
                throw new Error('Wrong password.  Your transaction could not be signed.');
            }
        }
    }

    static exportKeystore(currentPassword, newPassword){
        let keystore = Wallet.getKeystore();
        let wallet = Wallet.decryptFromKeystore(keystore, currentPassword);

        if(wallet){
            let keystore = Wallet.encryptToKeystore(wallet.privateKey, newPassword);

            return keystore;
        }
        else{
            throw new Error('Wrong password.  Your keystore could not be exported.');
        }
    }
}