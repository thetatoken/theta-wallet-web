import ThetaJS from '../libs/thetajs.esm';
import TrezorConnect from 'trezor-connect';
import Web3 from 'web3';
import Wallet from './Wallet'
import Theta from "./Theta.js"
import {chainIDStringToNumber} from "../utils/Utils";
import Api from './Api'

const rpcURL = "https://mainnet.infura.io/v3/40980e2189924c8abfc5f60dd2e5dc4b";
const web3 = new Web3(rpcURL);


async function localBoardcast(signedTxRaw) {
    console.log("jlog0 local boardcasting", signedTxRaw)
    var payload1 = {
        "jsonrpc": "2.0", 
        "method": "theta.BroadcastRawTransaction",
        "params": [{"tx_bytes": signedTxRaw}], 
        "id": 0
    };
    var payload2 = {
        "jsonrpc": "2.0", 
        "method": "theta.GetStatus",
        "params": [{}], 
        "id": 0
    };
    await fetch("http://localhost:16888/rpc", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload1),
    }).then(response => response.json())
    .then(data => console.log("jlog1", data));
    await fetch("http://localhost:16888/rpc", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload2),
    }).then(response => response.json())
    .then(data => console.log("jlog2", data));

}

export default class Trezor {
    static async signTransaction(unsignedTx){
        // let unsignedTx = Theta.unsignedSendTx(txData, sequence);
        let payload = Theta.prepareTxPayload(unsignedTx);

        const trezorSignParams = {
            path: Wallet.getWalletPath(),
            transaction: {
                // chainId: chainIDStringToNumber(Theta.getChainID()),
                chainId: 1,
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
        unsignedTx.setSignature(signature);
        console.log("jlog3 unsignedTX is ", unsignedTx);
        console.log("jlog4 signedTx is ", signedTx);
        let signedRawTxBytes = ThetaJS.TxSigner.serializeTx(unsignedTx);
        let signedTxRaw = signedRawTxBytes.toString('hex');

        //Remove the '0x' until the RPC endpoint supports '0x' prefixes
        // signedTxRaw = signedTxRaw.substring(2);

        if(signedTxRaw){
            localBoardcast(signedTxRaw)
            return signedTxRaw;
        }
        else{
            throw new Error("Failed to sign transaction.");
        }
    }
}
