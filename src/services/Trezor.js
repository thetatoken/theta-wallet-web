import {BigNumber} from 'bignumber.js';
import Ethereum from "./Ethereum";
import ThetaJS from '../libs/thetajs.esm';
import TokenTypes from "../constants/TokenTypes";
import Config from '../Config';
import TrezorConnect from 'trezor-connect';
import Web3 from 'web3';
import RLP from 'eth-lib/lib/rlp';
import Bytes from 'eth-lib/lib/bytes';
import Wallet from './Wallet'

const rpcURL = "https://mainnet.infura.io/v3/40980e2189924c8abfc5f60dd2e5dc4b";
const web3 = new Web3(rpcURL);

export default class Trezor {

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

    static async signTransaction(txData, sequence){
        let chainID = Trezor.getChainID();
        let unsignedTx = Trezor.unsignedTransaction(txData, sequence);

        let encodedChainID = RLP.encode(Bytes.fromString(chainID));
        let encodedTxType = RLP.encode(Bytes.fromNumber(unsignedTx.getType()));
        let encodedTx = RLP.encode(unsignedTx.rlpInput());
        let payload = encodedChainID + encodedTxType.slice(2) + encodedTx.slice(2);

        const trezorSignParams = {
            path: Wallet.getWalletPath(),
            transaction: {
                to: "0000000000000000000000000000000000000000",
                value: web3.utils.toHex('0'),
                // // chainId: 1,
                nonce: web3.utils.toHex('0'),
                gasPrice: web3.utils.toHex('0'),
                gasLimit: web3.utils.toHex('0'),
                data: payload.toString('hex'),
            },
        };

        const signedTx = await TrezorConnect.ethereumSignTransaction(trezorSignParams);
        if (signedTx.payload.error) {
            throw signedTx.payload.error;
        }

        let signature = signedTx.payload.r + signedTx.payload.s.slice(2) + (parseInt(signedTx.payload.v, 16) - 27).toString().padStart(2, '0');
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