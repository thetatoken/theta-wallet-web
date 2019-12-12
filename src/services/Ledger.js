import ThetaJS from '../libs/thetajs.esm';
import TransportU2F from "@ledgerhq/hw-transport-u2f";
import Eth from "@ledgerhq/hw-app-eth";
import Web3 from 'web3';
import Wallet from './Wallet';
import Theta from "./Theta.js";
import Tx from "ethereumjs-tx";

const rpcURL = "https://mainnet.infura.io/v3/40980e2189924c8abfc5f60dd2e5dc4b";
const web3 = new Web3(rpcURL);

export default class Ledger {
    static async signTransaction(unsignedTx){
        // let unsignedTx = Theta.unsignedSendTx(txData, sequence);
        let payload = Theta.prepareTxPayload(unsignedTx);

        let txParams = {
            nonce: web3.utils.toHex(0),
            gasPrice: web3.utils.toHex(0),
            gasLimit: web3.utils.toHex(0),
            to: '0x0000000000000000000000000000000000000000',
            value: web3.utils.toHex(0),
            // chainId: 1,
            data: payload,
        };

        let serializedTx = new Tx(txParams).serialize();
        serializedTx[1] -= 3;
        serializedTx = serializedTx.slice(0, serializedTx.length - 3);
        let ethTxWrapper = serializedTx.toString("hex");

        const transport = await TransportU2F.create();
        const eth = new Eth(transport);

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
