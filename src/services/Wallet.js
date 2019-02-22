import { ethers } from 'ethers';
import Web3 from 'web3';

const MnemonicPath = "m/44'/500'/0'/0/0";

const rpcURL = "https://mainnet.infura.io/v3/40980e2189924c8abfc5f60dd2e5dc4b";
const web3 = new Web3(rpcURL);

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

    static async signTransaction(transactionData){

    }








    //
    //NEW
    //

    static unlocked(){
        return (this._wallet !== null);
    }

    static encryptToKeystore(privateKey, password){
        return web3.eth.accounts.encrypt(privateKey, password);
    }

    static decryptFromKeystore(keystoreJsonV3, password){
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
            return null;
        }
    }

    static walletFromPrivateKey(privateKey){
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
        }
        catch (e) {
            //TODO throw the caught error?
        }
    }
}