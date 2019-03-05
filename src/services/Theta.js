import Ethereum from "./Ethereum";

export default class Theta {

    static getTransactionFee(){
        //10^12 TFuelWei
        return 0.000001;
    }

    static unsignedTransaction(txData) {
        return {};
    }

    static isAddress(address){
        return Ethereum.isAddress(address);
    }

    static async signTransaction(txData, privateKey){
        let unsignedTx = Theta.unsignedTransaction(txData);
        let signedTx = null;

        if(signedTx){
            return signedTx.rawTransaction;
        }
        else{
            throw new Error("Failed to sign transaction.");
        }
    }
}