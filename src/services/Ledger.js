import ThetaJS from '../libs/thetajs.esm';
import TransportWebUSB from "@ledgerhq/hw-transport-webusb";
import TransportU2F from "@ledgerhq/hw-transport-u2f";
import Eth from "@ledgerhq/hw-app-eth";
import Wallet from './Wallet';
import Theta from "./Theta.js";
import { encode as rlpEncode } from 'eth-lib/lib/rlp';
import Bytes from 'eth-lib/lib/bytes';
import * as thetajs from "@thetalabs/theta-js";

class EthereumTxV2{
    constructor(payload, chainId = 1){
        this.nonce = "0x0";
        this.gasPrice = "0x0";
        this.gas = "0x0";
        this.to = "0x0000000000000000000000000000000000000000";
        this.value = "0x0";
        this.input = payload;
        this.chainId = chainId;
    }

    rlpInput() {
        let rplInput = [
            Bytes.fromNat("0x0"),      // AccountNonce - required
            Bytes.fromNat("0x0"),      // Price - required
            Bytes.fromNat("0x0"),      // GasLimit - required
            this.to.toLowerCase(),     // Recipient - keep as is
            Bytes.fromNat("0x0"),      // Amount - required
            this.input,                // Payload - required
            Bytes.fromNumber(1),       // ChainID - required
            "",                        // EIP155Field1 - required
            "",                        // EIP155Field2 - required
        ];
        return rplInput;
    }
}

export default class Ledger {
    static signBytes(tx, chainID) {
        let sigz = [];

        // Detach signatures
        const txType = tx.getType();
        if(txType === thetajs.constants.TxType.Send){
            for(var i = 0; i < tx.inputs.length; i++){
                let input = tx.inputs[i];

                sigz[i] = input.signature;
                input.signature = "";
            }
        }
        else if(txType === thetajs.constants.TxType.DepositStake ||
                txType === thetajs.constants.TxType.DepositStakeV2 ||
                txType === thetajs.constants.TxType.WithdrawStake){
            sigz[0] = tx.source.signature;

            tx.source.signature = "";
        }
        else if(txType === thetajs.constants.TxType.StakeRewardDistribution){
            sigz[0] = tx.holder.signature;

            tx.holder.signature = "";
        }
        else if(txType === thetajs.constants.TxType.SmartContract){
            sigz[0] = tx.fromInput.signature;

            tx.fromInput.signature = "";
        }

        // Mirror the TxSigner.serializeTx structure
        let encodedChainID = rlpEncode(Bytes.fromString(chainID));
        let encodedTxType = rlpEncode(Bytes.fromNumber(tx.getType()));
        let encodedTx = rlpEncode(tx.rlpInput());
        let payload = encodedChainID + encodedTxType.slice(2) + encodedTx.slice(2);

        let ethTxWrapper = new EthereumTxV2(payload);
        let finalBytes = rlpEncode(ethTxWrapper.rlpInput());

        // Restore signatures
        if(txType === thetajs.constants.TxType.Send){
            for (var j = 0; j < tx.inputs.length; j++) {
                let input = tx.inputs[j];
                input.signature = sigz[j];
            }
        }
        else if(txType === thetajs.constants.TxType.DepositStake ||
            txType === thetajs.constants.TxType.DepositStakeV2 ||
            txType === thetajs.constants.TxType.WithdrawStake){
            tx.source.signature = sigz[0];
        }
        else if(txType === thetajs.constants.TxType.StakeRewardDistribution){
            tx.holder.signature = sigz[0];
        }
        else if(txType === thetajs.constants.TxType.SmartContract){
            tx.fromInput.signature = sigz[0];
        }

        return finalBytes;
    }

    static async signTransaction(ethApp, path, unsignedTx) {
        try {
            let chainID = Theta.getChainID();
            let ethTxWrapper = Ledger.signBytes(unsignedTx, chainID).slice(2); // remove the '0x' prefix
            let sig = await ethApp.signTransaction(path, ethTxWrapper, null);
            // let signature = '0x' + sig.r + sig.s + (parseInt(sig.v, 16) - 27).toString().padStart(2, '0'); // Pre-EIP155...may require checking the device version
            let signature = '0x' + sig.r + sig.s + (parseInt(sig.v, 16) - 37).toString().padStart(2, '0');

            unsignedTx.setSignature(signature);

            let signedRawTxBytes = ThetaJS.TxSigner.serializeTx(unsignedTx);
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
        catch (error) {
            console.error('Ledger signing error:', error);
            throw new Error(`Failed to sign with Ledger: ${error.message}`);
        }

    }
    static async signTransactionLegacy(unsignedTx){
        let chainID = Theta.getChainID();
        let ethTxWrapper = unsignedTx.signBytes(chainID).slice(2); // remove the '0x' prefix
        let path = Wallet.getWalletPath();
        let transport;
        if(navigator.userAgent.toLowerCase().indexOf('firefox') > -1){
            transport = await TransportU2F.create();
        }
        else {
            transport = await TransportWebUSB.create();
        }
        var eth = new Eth(transport);
        let sig = await eth.signTransaction(Wallet.getWalletPath(), ethTxWrapper);
        // transport.close();

        let signature = '0x' + sig.r + sig.s + (parseInt(sig.v, 16) - 27).toString().padStart(2, '0');
        unsignedTx.setSignature(signature);

        let signedRawTxBytes = ThetaJS.TxSigner.serializeTx(unsignedTx);
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
