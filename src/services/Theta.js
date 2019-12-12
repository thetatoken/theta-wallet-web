import {BigNumber} from 'bignumber.js';
import Ethereum from "./Ethereum";
import ThetaJS from '../libs/thetajs.esm';
import TokenTypes from "../constants/TokenTypes";
import Config from '../Config';
import RLP from 'eth-lib/lib/rlp';
import Bytes from 'eth-lib/lib/bytes';

export default class Theta {

    static getTransactionFee(){
        //10^12 TFuelWei
        return 0.000001;
    }

    static getChainID(){
        return Config.thetaChainID;
    }

    static unsignedSendTx(txData, sequence) {
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

    static unsignedDepositStakeTx(txData, sequence) {
        let { tokenType, from, holder, amount, transactionFee} = txData;

        const ten18 = (new BigNumber(10)).pow(18); // 10^18, 1 Theta = 10^18 ThetaWei, 1 Gamma = 10^ TFuelWei
        const thetaWeiToSend = (tokenType === TokenTypes.THETA ? (new BigNumber(amount)).multipliedBy(ten18) : (new BigNumber(0)));
        const feeInTFuelWei  = (new BigNumber(transactionFee)).multipliedBy(ten18); // Any fee >= 10^12 TFuelWei should work, higher fee yields higher priority
        const source =  from;
        const senderSequence = sequence;
        const purpose = ThetaJS.StakePurposes.StakeForGuardian;

        let tx = new ThetaJS.DepositStakeTx(source, holder, thetaWeiToSend, feeInTFuelWei, purpose, senderSequence);

        return tx;
    }

    static unsignedWithdrawStakeTx(txData, sequence) {
        let { tokenType, from, holder, transactionFee} = txData;

        const ten18 = (new BigNumber(10)).pow(18); // 10^18, 1 Theta = 10^18 ThetaWei, 1 Gamma = 10^ TFuelWei
        const feeInTFuelWei  = (new BigNumber(transactionFee)).multipliedBy(ten18); // Any fee >= 10^12 TFuelWei should work, higher fee yields higher priority
        const source =  from;
        const senderSequence = sequence;
        const purpose = ThetaJS.StakePurposes.StakeForGuardian;

        let tx = new ThetaJS.WithdrawStakeTx(source, holder, feeInTFuelWei, purpose, senderSequence);

        return tx;
    }

    static isAddress(address){
        return Ethereum.isAddress(address);
    }

    static isHolderSummary(holderSummary){
        if(holderSummary){
            let expectedLen = 458;

            if(holderSummary.startsWith('0x')){
                expectedLen = expectedLen + 2;
            }

            return (holderSummary.length === expectedLen);
        }
        else{
            return false;
        }
    }

    static async signTransaction(unsignedTx, privateKey){
        let chainID = Theta.getChainID();
        // let unsignedTx = Theta.unsignedSendTx(txData, sequence);
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

    static prepareTxPayload(unsignedTx){
        let chainID = Theta.getChainID();
        let encodedChainID = RLP.encode(Bytes.fromString(chainID));
        let encodedTxType = RLP.encode(Bytes.fromNumber(unsignedTx.getType()));
        let encodedTx = RLP.encode(unsignedTx.rlpInput());
        let payload = encodedChainID + encodedTxType.slice(2) + encodedTx.slice(2);
        return payload.toString('hex');
    }
}
