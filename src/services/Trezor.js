import {BigNumber} from 'bignumber.js';
import Ethereum from "./Ethereum";
import ThetaJS from '../libs/thetajs.esm';
import TokenTypes from "../constants/TokenTypes";
import Config from '../Config';
import TrezorConnect from 'trezor-connect';
import Web3 from 'web3';
import RLP from 'eth-lib/lib/rlp';
import Bytes from 'eth-lib/lib/bytes';

const rpcURL = "https://mainnet.infura.io/v3/40980e2189924c8abfc5f60dd2e5dc4b";
const web3 = new Web3(rpcURL);

// const protobuf = require("protobufjs");
// const TrezorUri = 'http://127.0.0.1:21325';
// const TrezorOrigin = 'https://wallet.trezor.io';

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

        console.log("============== sequence: ", sequence)
        console.log("============== txData: ", txData)
        console.log("============== data: ", payload.toString('hex'))
        const trezorSignParams = {
            path: "m/44'/60'/0'/0", //`${addressN}/0`,
            transaction: {
                to: "0000000000000000000000000000000000000000",
                value: web3.utils.toHex('0'),
                // // chainId: 1,
                nonce: web3.utils.toHex('0'),
                gasPrice: web3.utils.toHex('0'),
                gasLimit: web3.utils.toHex('0'),
                data: "0x8a707269766174656e657402f84cc78085e8d4a51000e2e19429ea70257452bfd24548f4d6c7d3ff0ec34cecd2c98087038e67796b90000b80e0df942e833968e5bb786ae419c4d13189fb081cc43babc98087038d7ea4c68000", //payload.toString('hex'),
            },
        };

        const signedTr = await TrezorConnect.ethereumSignTransaction(trezorSignParams);
        console.log("============= signedTr: ", signedTr.payload)
        if (signedTr.payload.error) {
            throw signedTr.payload.error;
        }
          
        //   transaction: {
        //     tokenType: this.state.tokenType,
        //     from: this.props.walletAddress,
        //     to: this.state.to,
        //     amount: this.state.amount,
        //     transactionFee: this.state.transactionFee
        // }


        // //Remove the '0x' until the RPC endpoint supports '0x' prefixes
        // signedTxRaw = signedTxRaw.substring(2);

        // if(signedTxRaw){
        //     return signedTxRaw;
        // }
        // else{
        //     throw new Error("Failed to sign transaction.");
        // }
    }
}