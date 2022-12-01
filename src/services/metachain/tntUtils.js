const thetajs = require("@thetalabs/theta-js");
const {BigNumber} = require("@ethersproject/bignumber");
const {cfg} = require("./configs.js");

const {TNT20TokenBankContract, TNT721TokenBankContract, TNT1155TokenBankContract, TokenType, DontCare, 
    createProvider, createWallet, getWallet, getContextFromTargetChainID, printSenderReceiverBalances, 
    detectTargetChainReceiverBalanceChanges, expandTo18Decimals, buildDenom, extractOriginChainIDFromDenom, 
    extractContractAddressFromDenom,is0x0} = require("./common.js")

const {TNT20ABI, TNT721ABI} = require("../../constants/contracts");
const {store} = require("../../state");
const {showLoader} = require("../../state/actions/ui");
const {addToken} = require("../../state/actions/Wallet");
const _ = require("lodash");
const {getAllAssets} = require("../../constants/assets");
const Alerts = require("../Alerts").default;
const MockTNT20Contract = {abi: TNT20ABI};
const MockTNT721Contract = {abi: TNT721ABI};
const MockTNT1155Contract = null;

const Wallet = require("../Wallet").default;



// Note: a voucher is also a TNT token itself, so we can use the following function to retrieve
//       the voucher balance of an address
async function getTNTTokenBalance(tokenType, chainIDStr, rpc, tokenContractAddress, tokenID, queriedAddress) {
    const provider = createProvider(chainIDStr, rpc);
    if (is0x0(tokenContractAddress)) { // in case the token or voucher contract does not exist yet
        return BigNumber.from(0);
    }


    let tokenBalance, tokenOwner;
    if (tokenType === TokenType.TNT20) {
        const tnt20Contract = new thetajs.Contract(tokenContractAddress, MockTNT20Contract.abi, provider);
        tokenBalance = await tnt20Contract.balanceOf(queriedAddress);
    } else if (tokenType === TokenType.TNT721) {
        const tnt721Contract = new thetajs.Contract(tokenContractAddress, MockTNT721Contract.abi, provider);
        try {
            tokenOwner = await tnt721Contract.ownerOf(tokenID);
        } catch { // TNT721 contract asserts if the NFT with tokenID has already burned
            tokenOwner = 0x0;
        }
        tokenBalance = (tokenOwner === queriedAddress) ? 1 : 0;
    } else if (tokenType === TokenType.TNT1155) {
        const tnt1155Contract = new thetajs.Contract(tokenContractAddress, MockTNT1155Contract.abi, provider);
        tokenBalance = await tnt1155Contract.balanceOf(queriedAddress, tokenID);
    } else {
        throw new Error ("getTNTTokenBalance: Invalid tokenType")
    }

    return tokenBalance;
}

// Note: a voucher is also a TNT token itself, so we can use the following function to approve
//       voucher access
async function approveTokenAccess(tokenType, from, sourceChainIDStr, sourceChainRPC, tokenContractAddress, spenderAddr, tokenID, amountInWei) {
    const keyringController = Wallet.controller.keyringController;
    const transactionController = Wallet.controller.transactionsController;
    const signAndSendTransaction = keyringController.signAndSendTransaction.bind(keyringController);
    const provider = createProvider(sourceChainIDStr, sourceChainRPC);

    let approveTx;
    if (tokenType === TokenType.TNT20) {
        const tnt20Contract = new thetajs.Contract(tokenContractAddress, MockTNT20Contract.abi, null);
        approveTx = await tnt20Contract.populateTransaction.approve(spenderAddr, amountInWei);
    } else if (tokenType === TokenType.TNT721) {
        const tnt721Contract = new thetajs.Contract(tokenContractAddress, MockTNT721Contract.abi, null);
        approveTx = await tnt721Contract.populateTransaction.approve(spenderAddr, tokenID);
    } else if (tokenType === TokenType.TNT1155) {
        const tnt1155Contract = new thetajs.Contract(tokenContractAddress, MockTNT1155Contract.abi, null);
        approveTx = await tnt1155Contract.populateTransaction.setApprovalForAll(spenderAddr, true);
    } else {
        throw new Error("getTNTTokenBalance: Invalid tokenType")
    }

    approveTx.setFrom(from);
    let gasData = await transactionController.getEstimatedGasData(approveTx);
    approveTx.gasLimit = gasData.gasLimit;


    const result = await signAndSendTransaction(from, approveTx, provider);

    console.log("approve tx:", result.hash);
    return result;
}

async function isVoucherContract(tokenType, sourceChainIDStr, sourceChainRPC, tokenOrVoucherContractAddr) {
    const provider = createProvider(sourceChainIDStr, sourceChainRPC);

    let tokenBankContract;
    if (sourceChainIDStr === cfg().mainchainIDStr) {
        if (tokenType === TokenType.TNT20) {
            tokenBankContract = new thetajs.Contract(cfg().mainchainTNT20TokenBankAddr, TNT20TokenBankContract.abi, provider);
        } else if (tokenType === TokenType.TNT721) {
            tokenBankContract = new thetajs.Contract(cfg().mainchainTNT721TokenBankAddr, TNT721TokenBankContract.abi, provider);
        } else if (tokenType === TokenType.TNT1155) {
            tokenBankContract = new thetajs.Contract(cfg().mainchainTNT1155TokenBankAddr, TNT1155TokenBankContract.abi, provider);
        } else {
            throw new Error("isVoucherContract: Invalid tokenType (mainchain)")
        }
    } else if (sourceChainIDStr === cfg().subchainIDStr) {
        if (tokenType === TokenType.TNT20) {
            tokenBankContract = new thetajs.Contract(cfg().subchainTNT20TokenBankAddr, TNT20TokenBankContract.abi, provider);
        } else if (tokenType === TokenType.TNT721) {
            tokenBankContract = new thetajs.Contract(cfg().subchainTNT721TokenBankAddr, TNT721TokenBankContract.abi, provider);
        } else if (tokenType === TokenType.TNT1155) {
            tokenBankContract = new thetajs.Contract(cfg().subchainTNT1155TokenBankAddr, TNT1155TokenBankContract.abi, provider);
        } else {
            throw new Error("isVoucherContract: Invalid tokenType (subchain)")
        }
    } else {
        throw new Error("Invalid sourceChainIDStr")
    }

    let voucherExists = tokenBankContract.functions["exists(address)"] // the TokenBank contract overloads the "exists()" function
    let results = await voucherExists(tokenOrVoucherContractAddr);
    let isVoucher = results[0]

    return isVoucher;
}

function getSourceAndTargetChainTokenBank(tokenType, targetChainID) {
    let mainchainProvider = createProvider(cfg().mainchainIDStr, cfg().mainchainRPC)
    let subchainProvider = createProvider(cfg().subchainIDStr, cfg().subchainRPC)

    let mainchainTokenBankContract, subchainTokenBankContract;
    if (tokenType === TokenType.TNT20) {
        mainchainTokenBankContract = new thetajs.Contract(cfg().mainchainTNT20TokenBankAddr, TNT20TokenBankContract.abi, mainchainProvider);
        subchainTokenBankContract = new thetajs.Contract(cfg().subchainTNT20TokenBankAddr, TNT20TokenBankContract.abi, subchainProvider);
    } else if (tokenType === TokenType.TNT721) {
        mainchainTokenBankContract = new thetajs.Contract(cfg().mainchainTNT721TokenBankAddr, TNT721TokenBankContract.abi, mainchainProvider);
        subchainTokenBankContract = new thetajs.Contract(cfg().subchainTNT721TokenBankAddr, TNT721TokenBankContract.abi, subchainProvider);
    } else if (tokenType === TokenType.TNT1155) {
        mainchainTokenBankContract = new thetajs.Contract(cfg().mainchainTNT1155TokenBankAddr, TNT1155TokenBankContract.abi, mainchainProvider);
        subchainTokenBankContract = new thetajs.Contract(cfg().subchainTNT1155TokenBankAddr, TNT1155TokenBankContract.abi, subchainProvider);
    } else {
        throw new Error("getSourceAndTargetChainTokenBank: Invalid tokenType")
    }

    let sourceChainTokenBankContract, targetChainTokenBankContract;
    if (targetChainID === cfg().subchainID) {
        sourceChainTokenBankContract = mainchainTokenBankContract;
        targetChainTokenBankContract = subchainTokenBankContract;
    } else {
        sourceChainTokenBankContract = subchainTokenBankContract;
        targetChainTokenBankContract = mainchainTokenBankContract;
    }

    return {sourceChainTokenBankContract, targetChainTokenBankContract}
}

async function lockTNTTokens(tokenType, from, sourceChainTokenAddr, targetChainID, targetChainReceiver, tokenID, amountInWei) {
    const keyringController = Wallet.controller.keyringController;
    const transactionController = Wallet.controller.transactionsController;
    const signAndSendTransaction = keyringController.signAndSendTransaction.bind(keyringController);
    const provider = createProvider(cfg().mainchainIDStr, cfg().mainchainRPC);

    let value = expandTo18Decimals(cfg().crossChainTransferFeeInTFuel);
    let tx;

    let {sourceChainTokenBankContract} = getSourceAndTargetChainTokenBank(tokenType, targetChainID);
    if (tokenType === TokenType.TNT20) {
        tx = await sourceChainTokenBankContract.populateTransaction.lockTokens(targetChainID, sourceChainTokenAddr, targetChainReceiver, amountInWei, {value: value});
    } else if (tokenType === TokenType.TNT721) {
        tx = await sourceChainTokenBankContract.populateTransaction.lockTokens(targetChainID, sourceChainTokenAddr, targetChainReceiver, tokenID, {value: value});
    } else if (tokenType === TokenType.TNT1155) {
        tx = await sourceChainTokenBankContract.populateTransaction.lockTokens(targetChainID, sourceChainTokenAddr, targetChainReceiver, tokenID, amountInWei, {value: value});
    } else {
        throw new Error("lockTNTTokens: Invalid tokenType")
    }

    tx.setFrom(from);
    let gasData = await transactionController.getEstimatedGasData(tx);
    tx.gasLimit = gasData.gasLimit;

    return await signAndSendTransaction(from,tx, provider);
}

async function burnTNTVouchers(tokenType, from, sourceChainVoucherAddr, denom, targetChainReceiver, tokenID, amountInWei) {
    const keyringController = Wallet.controller.keyringController;
    const transactionController = Wallet.controller.transactionsController;
    const signAndSendTransaction = keyringController.signAndSendTransaction.bind(keyringController);
    const provider = createProvider(cfg().subchainIDStr, cfg().subchainRPC);

    let value = expandTo18Decimals(cfg().crossChainTransferFeeInTFuel);
    let tx;

    let originChainID = extractOriginChainIDFromDenom(denom);
    let targetChainID = originChainID; // for voucher burn, the target chain is the chain where the authentic token contract was deployed
    let {sourceChainTokenBankContract} = getSourceAndTargetChainTokenBank(tokenType, targetChainID);
    if (tokenType === TokenType.TNT20) {
        tx = await sourceChainTokenBankContract.populateTransaction.burnVouchers(sourceChainVoucherAddr, targetChainReceiver, amountInWei, {value: value});
    } else if (tokenType === TokenType.TNT721) {
        tx = await sourceChainTokenBankContract.populateTransaction.burnVouchers(sourceChainVoucherAddr, targetChainReceiver, tokenID, {value: value});
    } else if (tokenType === TokenType.TNT1155) {
        tx = await sourceChainTokenBankContract.populateTransaction.burnVouchers(sourceChainVoucherAddr, targetChainReceiver, tokenID, amountInWei, {value: value});
    } else {
        throw new Error("burnTNTVouchers: Invalid tokenType")
    }

    tx.setFrom(from);
    let gasData = await transactionController.getEstimatedGasData(tx);
    tx.gasLimit = gasData.gasLimit;

    return await signAndSendTransaction(from,tx, provider);
}

async function transferTNT(tokenType, from, sourceChainTokenOrVoucherContractAddr, targetChainID, targetChainReceiver, tokenID, amountInWei) {
    if (targetChainID !== cfg().subchainID && targetChainID !== cfg().mainchainID) {
        throw new Error("transferTNT: Invalid target chain ID");
    }

    //
    // Step 1. Check if sourceChainTokenOrVoucherContractAddr is a token address ors a voucher address
    //
    store.dispatch(showLoader('Fetching Transfer Info...'));

    let {sourceChainID, sourceChainIDStr, sourceChainRPC, targetChainIDStr, targetChainRPC} = getContextFromTargetChainID(targetChainID);
    let {sourceChainTokenBankContract, targetChainTokenBankContract} = getSourceAndTargetChainTokenBank(tokenType, targetChainID);
    let targetChainTokenOrVoucherContractAddr, denom;
    let voucherExists = sourceChainTokenBankContract.functions["exists(address)"] // the TokenBank contract overloads the "exists()" function
    let results = await voucherExists(sourceChainTokenOrVoucherContractAddr);
    let isVoucher = results[0];

    if (isVoucher) { // sourceChainTokenOrVoucherContractAddr is a voucher contract address
        denom = await sourceChainTokenBankContract.getDenom(sourceChainTokenOrVoucherContractAddr);
        targetChainTokenOrVoucherContractAddr = extractContractAddressFromDenom(denom);
    } else { // sourceChainTokenOrVoucherContractAddr is a token contract address
        denom = buildDenom(sourceChainID, tokenType, sourceChainTokenOrVoucherContractAddr);
        targetChainTokenOrVoucherContractAddr = await targetChainTokenBankContract.getVoucher(denom); // should return 0x0 if the voucher contract has not been deployed yet, e.g. before the first transfer of the TNT token
    }

    //
    // Step 2. Query and print the sender/receiver balance before the cross-chain transfer
    //

    let sourceChainSenderAddr = from;
    await printSenderReceiverBalances(tokenType,
        sourceChainIDStr, sourceChainRPC, sourceChainTokenOrVoucherContractAddr, tokenID, sourceChainSenderAddr, 
        targetChainIDStr, targetChainRPC, targetChainTokenOrVoucherContractAddr, tokenID, targetChainReceiver, getTNTTokenBalance);

    let targetChainReceiverInitialBalance = await getTNTTokenBalance(tokenType, targetChainIDStr, targetChainRPC, targetChainTokenOrVoucherContractAddr, tokenID, targetChainReceiver);

    //
    // Step 3. Lock tokens/Burn vouchers on the source chain to initiate the cross-chain transfer
    //
    store.dispatch(showLoader('Executing Transfer...'));

    if (!isVoucher) { // sourceChainTokenOrVoucherContractAddr is a token contract address
        let lockTx = await lockTNTTokens(tokenType, from, sourceChainTokenOrVoucherContractAddr, targetChainID, targetChainReceiver, tokenID, amountInWei);
        console.log(`lock tokens tx (on chain ${sourceChainID}):`, lockTx.hash, "\n");
    } else { // sourceChainTokenOrVoucherContractAddr is a voucher contract address
        let burnTx = await burnTNTVouchers(tokenType, from, sourceChainTokenOrVoucherContractAddr, denom, targetChainReceiver, tokenID, amountInWei);
        console.log(`burn vouchers tx (on chain ${sourceChainID}):`, burnTx.hash, "\n");
    }

    store.dispatch(showLoader('Waiting For Transfer Completion...'));

    //
    // Step 4. Wait for the cross-chain transfer to complete
    //

    await detectTargetChainReceiverBalanceChanges(targetChainIDStr, targetChainRPC, tokenType, denom, 
        targetChainTokenBankContract, targetChainTokenOrVoucherContractAddr, tokenID, targetChainReceiver, targetChainReceiverInitialBalance, getTNTTokenBalance);
    
    //
    // Step 5. Query and print the sender/receiver balance after the cross-chain transfer
    //
    
    if (is0x0(targetChainTokenOrVoucherContractAddr)) { // the first transfer
        targetChainTokenOrVoucherContractAddr = await targetChainTokenBankContract.getVoucher(denom)
    }

    await printSenderReceiverBalances(tokenType,
        sourceChainIDStr, sourceChainRPC, sourceChainTokenOrVoucherContractAddr, tokenID, sourceChainSenderAddr, 
        targetChainIDStr, targetChainRPC, targetChainTokenOrVoucherContractAddr, tokenID, targetChainReceiver, getTNTTokenBalance);

    // Track the token / voucher on the target chain
    if(tokenType === TokenType.TNT20){
        // Get the token data...
        const {thetaWallet} = store.getState();
        const {tokens} = thetaWallet;
        const assets = getAllAssets(sourceChainIDStr, tokens);
        const asset = _.find(assets, function (a) {
            return a.id === sourceChainTokenOrVoucherContractAddr;
        });

        // Take the attributes from the source token but change the address
        await store.dispatch(addToken({
            address: _.trim(targetChainTokenOrVoucherContractAddr),
            name: asset.name,
            symbol: `v${asset.symbol}`,
            decimals: asset.decimals
        }, targetChainIDStr));
    }

    Alerts.showSuccess("Your cross chain transfer has completed.");
}

export {
    isVoucherContract,
    approveTokenAccess,
    transferTNT
}