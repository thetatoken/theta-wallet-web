import {BigNumber} from 'bignumber.js';
import Ethereum from "./Ethereum";
import ThetaJS from '../libs/thetajs.esm';
import TokenTypes from "../constants/TokenTypes";
import Config from '../Config';
import RLP from 'eth-lib/lib/rlp';
import Bytes from 'eth-lib/lib/bytes';
import {NetworkExplorerUrls} from '../constants/Networks';

export default class Theta {
    static _chainId = Config.defaultThetaChainID;

    static setChainID(newChainID){
        this._chainId = newChainID;
    }

    static getChainID(){
        return this._chainId;
    }

    static getTransactionExplorerUrl(transaction){
        const chainId = this.getChainID();
        const urlBase = NetworkExplorerUrls[chainId];

        return`${urlBase}/txs/${transaction.hash}`;
    }

    static getAccountExplorerUrl(account){
        const chainId = this.getChainID();
        const urlBase = NetworkExplorerUrls[chainId];

        return`${urlBase}/account/${account}`;
    }

    static getTransactionFee(){
        return 0.3;
    }

    static getSmartContractGasPrice(){
        //10^12 x 4 TFuelWei
        return 0.000004;
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
        const outputs = [
            {
                address: receiverAddr,
                thetaWei: thetaWeiToSend,
                tfuelWei: tfuelWeiToSend,
            }
        ];

        let tx = new ThetaJS.SendTx(senderAddr, outputs, feeInTFuelWei, senderSequence);

        return tx;
    }

    static unsignedDepositStakeTx(txData, sequence) {
        let { tokenType, from, holder, amount, transactionFee, purpose} = txData;
        const ten18 = (new BigNumber(10)).pow(18); // 10^18, 1 Theta = 10^18 ThetaWei, 1 Gamma = 10^ TFuelWei
        const amountWeiToSend = (new BigNumber(amount)).multipliedBy(ten18);
        const feeInTFuelWei  = (new BigNumber(transactionFee)).multipliedBy(ten18); // Any fee >= 10^12 TFuelWei should work, higher fee yields higher priority
        const source =  from;
        const senderSequence = sequence;

        let tx = null;

        if(purpose === ThetaJS.StakePurposes.StakeForValidator){
            tx = new ThetaJS.DepositStakeTx(source, holder, amountWeiToSend, feeInTFuelWei, purpose, senderSequence);
        }
        else if(purpose === ThetaJS.StakePurposes.StakeForGuardian){
            tx = new ThetaJS.DepositStakeV2Tx(source, holder, amountWeiToSend, feeInTFuelWei, purpose, senderSequence);
        }
        else if(purpose === ThetaJS.StakePurposes.StakeForEliteEdge){
            tx = new ThetaJS.DepositStakeV2Tx(source, holder, amountWeiToSend, feeInTFuelWei, purpose, senderSequence);
        }

        return tx;
    }

    static unsignedWithdrawStakeTx(txData, sequence) {
        let { tokenType, from, holder, transactionFee, purpose} = txData;

        const ten18 = (new BigNumber(10)).pow(18); // 10^18, 1 Theta = 10^18 ThetaWei, 1 Gamma = 10^ TFuelWei
        const feeInTFuelWei  = (new BigNumber(transactionFee)).multipliedBy(ten18); // Any fee >= 10^12 TFuelWei should work, higher fee yields higher priority
        const source =  from;
        const senderSequence = sequence;

        let tx = new ThetaJS.WithdrawStakeTx(source, holder, feeInTFuelWei, purpose, senderSequence);

        return tx;
    }

    static unsignedSmartContractTx(txData, sequence) {
        let { from, to, data, value, transactionFee, gasLimit} = txData;

        const ten18 = (new BigNumber(10)).pow(18); // 10^18, 1 Theta = 10^18 ThetaWei, 1 Gamma = 10^ TFuelWei
        const feeInTFuelWei  = (new BigNumber(transactionFee)).multipliedBy(ten18); // Any fee >= 10^12 TFuelWei should work, higher fee yields higher priority
        const senderSequence = sequence;
        const gasPrice = feeInTFuelWei;

        let tx = new ThetaJS.SmartContractTx(from, to, gasLimit, gasPrice, data, value, senderSequence);

        return tx;
    }

    static isAddress(address){
        return Ethereum.isAddress(address);
    }

    static isValidHolderSummary(purpose, holderSummary){
        return ThetaJS.DepositStakeV2Tx.isValidHolderSummary(purpose, holderSummary);
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
