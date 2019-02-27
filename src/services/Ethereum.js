import Web3 from 'web3';
import TokenTypes from "../constants/TokenTypes";

const rpcURL = "https://mainnet.infura.io/v3/40980e2189924c8abfc5f60dd2e5dc4b";
const web3 = new Web3(rpcURL);

const thetaAbi = [{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function","signature":"0x06fdde03"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function","signature":"0x095ea7b3"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function","signature":"0x18160ddd"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_amount","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function","signature":"0x23b872dd"},{"constant":true,"inputs":[],"name":"getController","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function","signature":"0x3018205f"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function","signature":"0x313ce567"},{"constant":false,"inputs":[{"name":"_newController","type":"address"}],"name":"changeController","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function","signature":"0x3cebb823"},{"constant":false,"inputs":[{"name":"_owner","type":"address"},{"name":"_amount","type":"uint256"}],"name":"mint","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function","signature":"0x40c10f19"},{"constant":false,"inputs":[{"name":"_unlockTime","type":"uint256"}],"name":"changeUnlockTime","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function","signature":"0x48f1cfdb"},{"constant":true,"inputs":[],"name":"getUnlockTime","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function","signature":"0x602bc62b"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function","signature":"0x70a08231"},{"constant":false,"inputs":[{"name":"_addr","type":"address"}],"name":"allowPrecirculation","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function","signature":"0x8ef16d02"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function","signature":"0x95d89b41"},{"constant":true,"inputs":[{"name":"_addr","type":"address"}],"name":"isPrecirculationAllowed","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function","signature":"0x99d84045"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_amount","type":"uint256"}],"name":"transfer","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function","signature":"0xa9059cbb"},{"constant":false,"inputs":[{"name":"_addr","type":"address"}],"name":"disallowPrecirculation","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function","signature":"0xcc481912"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"remaining","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function","signature":"0xdd62ed3e"},{"constant":true,"inputs":[],"name":"controller","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function","signature":"0xf77c4791"},{"inputs":[{"name":"_unlockTime","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_from","type":"address"},{"indexed":true,"name":"_to","type":"address"},{"indexed":false,"name":"_value","type":"uint256"}],"name":"Transfer","type":"event","signature":"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_owner","type":"address"},{"indexed":true,"name":"_spender","type":"address"},{"indexed":false,"name":"_value","type":"uint256"}],"name":"Approval","type":"event","signature":"0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925"}];
const thetaContractAddress = '0x3883f5e181fccaF8410FA61e12b59BAd963fb645';
const thetaContract = new web3.eth.Contract(thetaAbi, thetaContractAddress);

export default class Ethereum {
    static getWeb3(){
        return web3;
    }

    static getTransactionFee(gasPrice, gasLimit){
        try {
            let gasPriceWei = web3.utils.toWei(gasPrice.toString(), 'Gwei');
            let gasLimitWei = gasLimit.toString();

            return web3.utils.fromWei((parseInt(gasPriceWei) * parseInt(gasLimitWei)).toString());
        } catch (exception) {
            return null;
        }
    }

    static unsignedTransaction(txData) {
        let { tokenType, from, to, amount, gas, gasPrice} = txData;
        let amountWei = web3.utils.toWei(amount);
        let gasePriceGwei = web3.utils.toWei(gasPrice.toString(), 'Gwei');

        if (tokenType === TokenTypes.ERC20_THETA) {
            let data = thetaContract.methods.transfer(to, amountWei).encodeABI();

            return {
                from: from,
                to: thetaContractAddress,
                data: data,
                gas: gas,
                gasPrice: gasePriceGwei,
            };
        } else if(tokenType === TokenTypes.ETHEREUM) {
            return {
                from: from,
                to: to,
                value: amountWei,
                gas: gas,
                gasPrice: gasePriceGwei
            }
        }
    }

    static async estimateGas(txData) {
        try {
            let genericRawTx = Ethereum.unsignedTransaction(txData);
            let estimatedGas = await web3.eth.estimateGas(genericRawTx);

            return estimatedGas;
        } catch (exception) {
            return null;
        }
    }

    static async getGasPrice(){
        try {
            let gasPrice = await web3.eth.getGasPrice();

            if(gasPrice){
                return parseInt(web3.utils.fromWei(gasPrice, 'Gwei')) + 1;
            }
            else{
                return null;
            }
        } catch (exception) {
            return null;
        }
    }

    static isAddress(address){
        try {
            return web3.utils.isAddress(address);
        }
        catch (e) {
            return false;
        }
    }

    static async signTransaction(txData, privateKey){
        let unsignedTx = Ethereum.unsignedTransaction(txData);
        let signedTx = await web3.eth.accounts.signTransaction(unsignedTx, privateKey);

        if(signedTx){
            return signedTx.rawTransaction;
        }
        else{
            throw new Error("Failed to sign transaction.");
        }
    }
}