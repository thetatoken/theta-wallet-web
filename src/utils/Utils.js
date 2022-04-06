import _ from 'lodash';
import Networks from '../constants/Networks'
import BigNumber from 'bignumber.js';
import {Ten18} from '@thetalabs/theta-js/src/constants';
import {DefaultAssets, getAllAssets, tokenToAsset} from "../constants/assets";
import * as thetajs from "@thetalabs/theta-js";
import {TDropStakingABI, TNT20ABI} from "../constants/contracts";
import {StakePurposeForTDROP, TDropAddressByChainId, TDropStakingAddressByChainId} from "../constants";


/**
 * Returns a new object with vals mapped to keys
 * @param {Array} keys
 * @param {Array} vals
 * @return {Object}
 */
export function zipMap(keys, vals){
    return Object.assign({}, ...keys.map((key, index) => ({[key]: vals[index]})));
}

export function trimWhitespaceAndNewlines(str){
    return str.trim().replace(new RegExp('\s?\r?\n','g'), '')
}

export function hasValidDecimalPlaces(str, maxDecimalPlaces){
    if(str === null){
        return true;
    }

    //Ensure it is a string
    var ensureStr = '' + str;

    var decimalSplit = ensureStr.split('.');

    if(decimalSplit.length > 0){
        var decimals = decimalSplit[decimalSplit.length - 1];

        return (decimals.length <= maxDecimalPlaces);
    }
    return true;
}

export function downloadFile(filename, contents){
    let element = document.createElement('a');

    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(contents));
    element.setAttribute('download', filename);
    element.style.display = 'none';

    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

export function copyToClipboard(str){
    //https://gist.githubusercontent.com/Chalarangelo/4ff1e8c0ec03d9294628efbae49216db/raw/cbd2d8877d4c5f2678ae1e6bb7cb903205e5eacc/copyToClipboard.js

    const el = document.createElement('textarea');  // Create a <textarea> element
    el.value = str;                                 // Set its value to the string that you want copied
    el.setAttribute('readonly', '');                // Make it readonly to be tamper-proof
    el.style.position = 'absolute';
    el.style.left = '-9999px';                      // Move outside the screen to make it invisible
    document.body.appendChild(el);                  // Append the <textarea> element to the HTML document
    const selected =
        document.getSelection().rangeCount > 0        // Check if there is any content selected previously
            ? document.getSelection().getRangeAt(0)     // Store selection if found
            : false;                                    // Mark as false to know no selection existed before
    el.select();                                    // Select the <textarea> content
    document.execCommand('copy');                   // Copy - only works as a result of a user action (e.g. click events)
    document.body.removeChild(el);                  // Remove the <textarea> element
    if (selected) {                                 // If a selection existed before copying
        document.getSelection().removeAllRanges();    // Unselect everything on the HTML document
        document.getSelection().addRange(selected);   // Restore the original selection
    }
}

export function onLine(){
    let online = true;

    try {
        online = window.navigator.onLine;
    }
    catch (e) {
        online = true;
    }

    return online;
}

export const truncate = (hash = '', length= 4) => {
    return hash.slice(0, (length + 2)) + '...' + hash.slice((length * -1));
};

export function legacyTruncate(fullStr, strLen, separator) {
    if(!fullStr){
        return fullStr;
    }

    if (fullStr.length <= strLen) return fullStr;

    separator = separator || '...';

    var sepLen = separator.length,
        charsToShow = strLen - sepLen,
        frontChars = Math.ceil(charsToShow/2),
        backChars = Math.floor(charsToShow/2);

    return fullStr.substr(0, frontChars) +
        separator +
        fullStr.substr(fullStr.length - backChars);
}

export function numberWithCommas(x) {
    var parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
}

export function getQueryParameters(str) {
    const searchStr = (str || document.location.search);

    if(_.isNil(searchStr) || searchStr.length === 0){
        return {};
    }
    else{
        return searchStr.replace(/(^\?)/,'').split("&").map(function(n){return n = n.split("="),this[n[0]] = n[1],this}.bind({}))[0];
    }
}

export function chainIDStringToNumber(chainIDstr) {
    switch(chainIDstr) {
        case Networks.THETA_MAINNET:
            return 361;
        case Networks.THETA_PRIVATENET:
            return 366;
        case Networks.THETA_TESTNET:
            return 365;
    }
    return 0;
}





export const formatTNT20TokenAmountToLargestUnit = (number, decimals ) => {
    const bn = new BigNumber(number);
    const DecimalsBN = (new BigNumber(10)).pow(decimals);
    // Round down
    const fixed = bn.dividedBy(DecimalsBN).toString(10);

    return numberWithCommas(fixed);
};

export const formatNativeTokenAmountToLargestUnit = (number ) => {
    const bn = new BigNumber(number);
    const fixed = bn.dividedBy(Ten18).toString(10);

    return numberWithCommas(fixed);
};

export const toTNT20TokenSmallestUnit = (number, decimals ) => {
    const bn = new BigNumber(number);
    const DecimalsBN = (new BigNumber(10)).pow(decimals);
    return bn.multipliedBy(DecimalsBN);
};

export const toNativeTokenSmallestUnit = (number ) => {
    const bn = new BigNumber(number);
    return bn.multipliedBy(Ten18);
};

export const toTNT20TokenLargestUnit = (number, decimals ) => {
    const bn = new BigNumber(number);
    const DecimalsBN = (new BigNumber(10)).pow(decimals);
    return bn.dividedBy(DecimalsBN);
};

export const toNativeTokenLargestUnit = (number ) => {
    const bn = new BigNumber(number);
    return bn.dividedBy(Ten18);
};

export const isValidAmount = (selectedAccount, asset, amount) => {
    let amountBN = null;
    let balanceBN = null;

    if(_.isNil(asset)){
        // Return as valid so we don't show errors before asset is picked.
        return true;
    }

    if(asset.name === 'Theta'){
        amountBN = toNativeTokenSmallestUnit('' + amount);
        balanceBN = new BigNumber(selectedAccount.balances['thetawei']);
    }
    else if(asset.name === 'Theta Fuel'){
        amountBN = toNativeTokenSmallestUnit('' + amount);
        balanceBN = new BigNumber(selectedAccount.balances['tfuelwei']);
    }
    else{
        // TNT-20 token
        amountBN = toTNT20TokenSmallestUnit('' + amount, asset.decimals);
        balanceBN = new BigNumber(selectedAccount.balances[asset.contractAddress]);
    }

    return amountBN.lte(balanceBN);
};

export const getAssetBalance = (selectedAccount, asset) => {
    if(asset.name === 'Theta'){
        return formatNativeTokenAmountToLargestUnit(selectedAccount.balances['thetawei']);
    }
    if(asset.name === 'Theta Fuel'){
        return formatNativeTokenAmountToLargestUnit(selectedAccount.balances['tfuelwei']);
    }

    const balance = selectedAccount.balances[asset.contractAddress] || '0';
    return formatTNT20TokenAmountToLargestUnit(balance, asset.decimals);
};


export const formDataToTransaction = async (transactionType, txFormData, thetaWalletState) => {
    const accounts = thetaWalletState.accounts;
    const selectedAddress = thetaWalletState.selectedAddress;
    const selectedAccount = accounts[selectedAddress];
    const tokens = thetaWalletState.tokens;
    const chainId = thetaWalletState.network.chainId;
    const assets = getAllAssets(chainId, tokens);

    if (transactionType === 'send') {
        const {to, assetId, amount} = txFormData;
        const asset = _.find(assets, function (a) {
            return a.id === assetId;
        });

        if (asset.contractAddress) {
            // TNT20 token
            // TODO ensure they have the balance
            const tnt20Contract = new thetajs.Contract(asset.contractAddress, TNT20ABI, null);
            const amountBN = toTNT20TokenSmallestUnit(amount, asset.decimals);
            return await tnt20Contract.populateTransaction.transfer(to, amountBN.toString());
        }
        else {
            // Native token
            const txData = {
                from: selectedAddress,
                outputs: [
                    {
                        address: to,
                        thetaWei: (assetId === 'theta' ? thetajs.utils.toWei(amount) : '0'),
                        tfuelWei: (assetId === 'tfuel' ? thetajs.utils.toWei(amount) : '0')
                    }
                ]
            };

            return new thetajs.transactions.SendTransaction(txData);
        }
    }
    if(transactionType === 'withdraw-stake'){
        const {holder, purpose, amount} = txFormData;
        const purposeInt = parseInt(purpose);

        if(purposeInt === StakePurposeForTDROP){
            const tDropStakingAddress = TDropStakingAddressByChainId[chainId];
            const tdropStakingContract = new thetajs.Contract(tDropStakingAddress, TDropStakingABI, null);
            const percentageToUnstake = parseFloat(amount) / 100;
            const tnt20stakes = _.get(selectedAccount, ['tnt20Stakes'], {});
            const balanceStr = _.get(tnt20stakes, 'tdrop.balance', '0');
            const balanceBN = new BigNumber(balanceStr);
            const amountBN = balanceBN.multipliedBy(percentageToUnstake).integerValue();
            const unstakeTx = await tdropStakingContract.populateTransaction.unstake(amountBN.toString());

            return unstakeTx;
        }
        else{
            const txData = {
                holder: holder,
                purpose: purpose
            };

            return new thetajs.transactions.WithdrawStakeTransaction(txData);
        }
    }
    if(transactionType === 'deposit-stake'){
        const {holder, holderSummary, purpose, amount} = txFormData;
        const purposeInt = parseInt(purpose);

        if(purposeInt === thetajs.constants.StakePurpose.StakeForValidator){
            const txData = {
                holder: holder,
                purpose: purposeInt,
                amount: thetajs.utils.toWei(amount),
            };

            return new thetajs.transactions.DepositStakeTransaction(txData);
        }
        else if(purposeInt === thetajs.constants.StakePurpose.StakeForGuardian){
            const txData = {
                holderSummary: holderSummary,
                purpose: purposeInt,
                amount: thetajs.utils.toWei(amount),
            };

            return new thetajs.transactions.DepositStakeV2Transaction(txData);
        }
        else if(purposeInt === thetajs.constants.StakePurpose.StakeForEliteEdge){
            const txData = {
                holderSummary: holderSummary,
                purpose: purposeInt,
                amount: thetajs.utils.toWei(amount),
            };

            return new thetajs.transactions.DepositStakeV2Transaction(txData);
        }
        else if(purposeInt === StakePurposeForTDROP){
            const tDropAddress = TDropAddressByChainId[chainId];
            const tDropStakingAddress = TDropStakingAddressByChainId[chainId];
            const tdropContract = new thetajs.Contract(tDropAddress, TNT20ABI, null);
            const tdropStakingContract = new thetajs.Contract(tDropStakingAddress, TDropStakingABI, null);
            const assetsById = _.keyBy(assets, 'id');
            const tDropAsset = assetsById[tDropAddress];
            const amountBN = toTNT20TokenSmallestUnit(amount, tDropAsset.decimals);
            const approveTx = await tdropContract.populateTransaction.approve(tDropStakingAddress,amountBN.toString());
            const stakeTx = await tdropStakingContract.populateTransaction.stake(amountBN.toString());
            // We are sending the approve TX in the background which fails because the amount hasn't been approved yet...so we will hardcode this gas limit for now
            stakeTx.gasLimit = 150000;
            stakeTx.dependencies = [
                approveTx
            ];

            return stakeTx;
        }
    }
    else if(transactionType === 'delegate-tdrop-vote'){
        const {address} = txFormData;
        const tDropStakingAddress = TDropStakingAddressByChainId[chainId];
        const tdropStakingContract = new thetajs.Contract(tDropStakingAddress, TDropStakingABI, null);
        const delegateTx = await tdropStakingContract.populateTransaction.delegate(address);

        return delegateTx;
    }
};

export const transactionTypeToName = (txType) => {
    if(_.isNil(txType)){
        return  null;
    }

    switch (txType) {
        case thetajs.constants.TxType.Send:
            return 'Send';
        case thetajs.constants.TxType.SmartContract:
            return 'Call Contract';
        case thetajs.constants.TxType.DepositStake:
            return 'Deposit Stake';
        case thetajs.constants.TxType.DepositStakeV2:
            return 'Deposit Stake';
        case thetajs.constants.TxType.WithdrawStake:
            return 'Withdraw Stake';
        default:
            return 'Unknown type';
    }
};

export const transactionRequestToTransactionType = (transactionRequest) => {
    const txType = _.get(transactionRequest, 'txType');
    const txData = _.get(transactionRequest, 'txData');

    try {
        if(txType === thetajs.constants.TxType.SmartContract && _.isNil(_.get(txData, 'to'))){
            return 'Deploy Contract';
        }

        const contractData = _.get(txData, 'data');
        const tnt20Contract = new thetajs.Contract(null, TNT20ABI, null);
        const data = tnt20Contract.interface.decodeFunctionData('transfer(address,uint256)',contractData);
        return 'Transfer Token';
    }
    catch (e) {

    }

    return transactionTypeToName(txType);
};

export const isHolderSummary = (holderSummary) => {
    if(holderSummary){
        let expectedLen = 458;

        if(holderSummary.startsWith('0x')){
            expectedLen = expectedLen + 2;
        }

        return (holderSummary.length === expectedLen);
    }
    else{
        return false;
    }
};

export function trimDecimalPlaces(x, maxDecimals) {
    let parts = x.split('.');
    let newFractional = '';
    let foundNonZero = false;

    _.map(parts[1], (char, idx) => {
        if(foundNonZero){
            return;
        }
        if((idx + 1) > maxDecimals){
            return;
        }

        if(char !== '0'){
            foundNonZero = true;
        }
        newFractional = newFractional + char;
    });

    parts[1] = newFractional;

    return parts.join('.');
}

export const sleep = (ms) => {
    return new Promise(r => setTimeout(r, ms));
};
