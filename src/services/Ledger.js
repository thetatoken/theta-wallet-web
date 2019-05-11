import ThetaJS from '../libs/thetajs.esm';
import TransportWebUSB from "@ledgerhq/hw-transport-webusb";
import Eth from "@ledgerhq/hw-app-eth";
import Web3 from 'web3';
import Wallet from './Wallet';
import Theta from "./Theta.js";
import Tx from "ethereumjs-tx";

const rpcURL = "https://mainnet.infura.io/v3/40980e2189924c8abfc5f60dd2e5dc4b";
const web3 = new Web3(rpcURL);

export default class Ledger {
    static async signTransaction(txData, sequence){
        console.log("=============== sequence: ", sequence)
        console.log("=============== txData: ", txData)
        let unsignedTx = Theta.unsignedTransaction(txData, sequence);
        console.log("=============== unsignedTx: ", unsignedTx)
        let payload = Theta.prepareTxPayload(unsignedTx);
        // console.log("=============== payload: ", payload)
        
        let txParams = {
            nonce: web3.utils.toHex(0),
            gasPrice: web3.utils.toHex(0),
            gasLimit: web3.utils.toHex(0),
            to: '0x0000000000000000000000000000000000000000',
            value: web3.utils.toHex(0),
            // chainId: 1,
            data: payload,
            // v: '0x01',
            // r: '0x00',
            // s: '0x00',
        };

        let ethTxWrapper = new Tx(txParams).serialize().toString("hex");

        console.log("=============== ethTxWrapper: ", ethTxWrapper)
        // ethTxWrapper = "f87780808094000000000000000000000000000000000000000080b85c876d61696e6e657402f851c78085e8d4a51000e7e6940a19d7bb0d855d66dc6aeda739e9df27f71b62a0ce872386f26fc1000085e8d4a510000280e0df942e833968e5bb786ae419c4d13189fb081cc43babc9872386f26fc1000080";
        
        const transport = await TransportWebUSB.create();
        const eth = new Eth(transport);
        
        let sig = await eth.signTransaction(Wallet.getWalletPath(), ethTxWrapper);
        // transport.close();
        console.log("-------------------- sig ", sig)
        let signature = sig.r + sig.s + (parseInt(sig.v, 16) - 27).toString().padStart(2, '0');
        console.log("-------------------- signature ", signature)

        unsignedTx.setSignature(signature);
        let signedRawTxBytes = ThetaJS.TxSigner.serializeTx(unsignedTx);
        let signedTxRaw = signedRawTxBytes.toString('hex');

        // txParams.v = '0x' + sig.v;
        // txParams.r = '0x' + sig.r;
        // txParams.s = '0x' + sig.s;

        // let signedTx = new Tx(txParams)
        // let signedTxRaw = signedTx.serialize().toString('hex')

        

        //Remove the '0x' until the RPC endpoint supports '0x' prefixes
        signedTxRaw = signedTxRaw.substring(2);

        console.log("-------------------->>> signedTxRaw ", signedTxRaw)

        if(signedTxRaw){
            return signedTxRaw;
        }
        else{
            throw new Error("Failed to sign transaction.");
        }
    }
}