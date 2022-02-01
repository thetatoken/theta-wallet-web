import ThetaJS from '../libs/thetajs.esm';
import TransportWebUSB from "@ledgerhq/hw-transport-webusb";
import TransportU2F from "@ledgerhq/hw-transport-u2f";
import Eth from "@ledgerhq/hw-app-eth";
import Wallet from './Wallet';
import Theta from "./Theta.js";
import { ThetaDevDerivationPath } from './Wallet';

export default class Ledger {
    static async signTransaction(ethApp, path, unsignedTx){
        let chainID = Theta.getChainID();
        let ethTxWrapper = unsignedTx.signBytes(chainID).slice(2); // remove the '0x' prefix
        let sig = await ethApp.signTransaction(path, ethTxWrapper);

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
