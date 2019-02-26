import { ethers } from 'ethers';
import _ from "lodash";
import Ethereum from './Ethereum'

const MnemonicPath = "m/44'/500'/0'/0/0";

export const WalletUnlockStrategy = {
    KEYSTORE_FILE: 'keystore-file',
    MNEMONIC_PHRASE: 'mnemonic-phrase',
    PRIVATE_KEY: 'private-key',
};

export default class Wallet {
    static _wallet = null;

    static setWallet(wallet){
        this._wallet = wallet;
    }

    static getWallet(){
        return this._wallet;
    }

    static getWalletAddress(){
        return _.get(this._wallet, ['address'], null);
    }

    static async signTransaction(transactionData){

    }








    //
    //NEW
    //

    static unlocked(){
        return (this._wallet !== null);
    }

    static encryptToKeystore(privateKey, password){
        let web3 = Ethereum.getWeb3();

        return web3.eth.accounts.encrypt(privateKey, password);
    }

    static decryptFromKeystore(keystoreJsonV3, password){
        let web3 = Ethereum.getWeb3();

        try{
            return web3.eth.accounts.decrypt(keystoreJsonV3, password);
        }
        catch (e) {
            return null;
        }
    }

    static walletFromMnemonic(mnemonic){
        try {
            return ethers.Wallet.fromMnemonic(mnemonic, MnemonicPath);
        } catch (exception) {
            console.log("exception == ");
            console.log(exception);
            return null;
        }
    }

    static walletFromPrivateKey(privateKey){
        let web3 = Ethereum.getWeb3();

        try {
            return web3.eth.accounts.privateKeyToAccount(privateKey);
        } catch (exception) {
            return null;
        }
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

    static unlockWallet(strategy, password, data){
        let wallet = null;
        let { keystore, mnemonic, privateKey } = data;

        try{
            if(strategy === WalletUnlockStrategy.KEYSTORE_FILE){
                wallet = Wallet.decryptFromKeystore(JSON.parse(keystore), password);
            }
            else if(strategy === WalletUnlockStrategy.MNEMONIC_PHRASE){
                wallet = Wallet.walletFromMnemonic(mnemonic);
            }
            else if(strategy === WalletUnlockStrategy.PRIVATE_KEY){
                wallet = Wallet.walletFromPrivateKey(privateKey);
            }

            if(wallet){
                Wallet.setWallet(wallet);
            }

            return wallet;
        }
        catch (e) {
            //TODO throw the caught error?
            return null;
        }
    }
}