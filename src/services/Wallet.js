import { ethers } from 'ethers';
import Web3 from 'web3';

const MnemonicPath = "m/44'/500'/0'/0/0";

const rpcURL = "https://mainnet.infura.io/v3/40980e2189924c8abfc5f60dd2e5dc4b";
const web3 = new Web3(rpcURL);

export default class Wallet {
    static async setPrivateKey(pKey){
        //TODO
    }

    static async getPrivateKey(){
        //TODO
        return null;
    }

    static async signTransaction(transactionData){

    }








    //
    //NEW
    //

    static encryptToKeystore(privateKey, password){
        return web3.eth.accounts.encrypt(privateKey, password);
    }

    static decryptFromKeystore(keystoreJsonV3, password){
        return web3.eth.accounts.decrypt(keystoreJsonV3, password);
    }

    static walletFromMnemonic(mnemonic){
        try {
            return ethers.Wallet.fromMnemonic(mnemonic, MnemonicPath);
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
}