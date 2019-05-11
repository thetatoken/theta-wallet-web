import ThetaJS from '../libs/thetajs.esm';
import TrezorConnect from 'trezor-connect';
import Web3 from 'web3';
import Wallet from './Wallet'
import Theta from "./Theta.js"

const rpcURL = "https://mainnet.infura.io/v3/40980e2189924c8abfc5f60dd2e5dc4b";
const web3 = new Web3(rpcURL);

export default class Trezor {
    static async signTransaction(txData, sequence){
        console.log("=============== sequence: ", sequence)
        let unsignedTx = Theta.unsignedTransaction(txData, sequence);
        console.log("=============== unsignedTx: ", unsignedTx)
        let payload = Theta.prepareTxPayload(unsignedTx);
        // console.log("=============== payload: ", payload)

        const trezorSignParams = {
            path: Wallet.getWalletPath(),
            transaction: {
                // // chainId: 1,
                nonce: web3.utils.toHex('0'),
                gasPrice: web3.utils.toHex('0'),
                gasLimit: web3.utils.toHex('0'),
                to: "0000000000000000000000000000000000000000",
                value: web3.utils.toHex('0'),
                data: payload,
            },
        };

        const signedTx = await TrezorConnect.ethereumSignTransaction(trezorSignParams);
        if (signedTx.payload.error) {
            throw signedTx.payload.error;
        }

        let signature = signedTx.payload.r + signedTx.payload.s.slice(2) + (parseInt(signedTx.payload.v, 16) - 27).toString().padStart(2, '0');
        console.log("================ signature: ", signature)
        unsignedTx.setSignature(signature);

        let signedRawTxBytes = ThetaJS.TxSigner.serializeTx(unsignedTx);
        let signedTxRaw = signedRawTxBytes.toString('hex');

        //Remove the '0x' until the RPC endpoint supports '0x' prefixes
        signedTxRaw = signedTxRaw.substring(2);

        console.log("================ signedTxRaw: ", signedTxRaw)
        if(signedTxRaw){
            // return signedTxRaw;
            return;
        }
        else{
            throw new Error("Failed to sign transaction.");
        }
    }
}