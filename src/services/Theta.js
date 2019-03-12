import {BigNumber} from 'bignumber.js';
import Ethereum from "./Ethereum";
import ThetaJS from '../libs/thetajs.esm';
import TokenTypes from "../constants/TokenTypes";
import Config from '../Config';

export default class Theta {

    static getTransactionFee(){
        //10^12 TFuelWei
        return 0.000001;
    }

    static getChainID(){
        return Config.thetaChainID;
    }

    static unsignedTransaction(txData, sequence) {
        let { tokenType, from, to, amount, transactionFee} = txData;

        const ten18 = (new BigNumber(10)).pow(18); // 10^18, 1 Theta = 10^18 ThetaWei, 1 Gamma = 10^ TFuelWei
        const thetaWeiToSend = (tokenType === TokenTypes.THETA ? (new BigNumber(amount)).multipliedBy(ten18) : (new BigNumber(0)));
        const tfuelWeiToSend = (tokenType === TokenTypes.THETA_FUEL ? (new BigNumber(amount)).multipliedBy(ten18) : (new BigNumber(0)));
        const feeInTFuelWei  = (new BigNumber(transactionFee)).multipliedBy(ten18); // Any fee >= 10^12 TFuelWei should work, higher fee yields higher priority
        const senderAddr =  from;
        const receiverAddr = to;
        const senderSequence = sequence;

        let tx = new ThetaJS.SendTx(senderAddr, receiverAddr, thetaWeiToSend, tfuelWeiToSend, feeInTFuelWei, senderSequence);

        return tx;
    }

    static isAddress(address){
        return Ethereum.isAddress(address);
    }

    static async signTransaction(txData, sequence, privateKey){
        let chainID = Theta.getChainID();
        let unsignedTx = Theta.unsignedTransaction(txData, sequence);
        let signedRawTxBytes = ThetaJS.TxSigner.signAndSerializeTx(chainID, unsignedTx, privateKey);
        let signedTxRaw = signedRawTxBytes.toString('hex');

        //Remove the '0x' until the RPC endpoint supports '0x' prefixes
        signedTxRaw = signedTxRaw.substring(2);

        if(signedTxRaw){
            return signedTxRaw;
        }
        else{
            throw new Error("Failed to sign transaction.");
        }
    }
}