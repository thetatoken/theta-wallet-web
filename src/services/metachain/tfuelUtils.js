const thetajs = require("@thetalabs/theta-js");
const {cfg} = require("./configs.js")
const {TFuelTokenBankContract, TokenType, DontCare, createProvider, createWallet,
    getContextFromTargetChainID, printSenderReceiverBalances, detectTargetChainReceiverBalanceChanges, expandTo18Decimals} = require("./common.js")
const {BigNumber} = require("bignumber.js");
const {store} = require("../../state");
const {showLoader, hideLoader} = require("../../state/actions/ui");
const {updateAccountBalances} = require("../../state/actions/Wallet");
const Alerts = require("../Alerts").default;
const Wallet = require("../Wallet").default;

async function getTFuelBalance(tokenType, chainIDStr, rpc, tokenAddrPlaceHolder, tokenIDPlaceHolder, queriedAddress) {
    const provider = createProvider(chainIDStr, rpc);
    let account;
    try {
        account = await provider.getAccount(queriedAddress);
    } catch (error) {
        if (error.code === -32000) { // TODO: should check if it is the "account not found" error (which means the account has been been created yet)
            return 0;
        }
    }
    return account.coins.tfuelwei;
}

async function lockTFuelOnMainchain(from, targetChainReceiver, amountInWei) {
    const keyringController = Wallet.controller.keyringController;
    const transactionController = Wallet.controller.transactionsController;
    const signAndSendTransaction = keyringController.signAndSendTransaction.bind(keyringController);
    const provider = createProvider(cfg().mainchainIDStr, cfg().mainchainRPC);
    const mainchainTFuelTokenBank = new thetajs.Contract(cfg().mainchainTFuelTokenBankAddr, TFuelTokenBankContract.abi, null);

    amountInWei = new BigNumber(amountInWei);
    let value = amountInWei.plus(thetajs.utils.toWei(cfg().crossChainTransferFeeInTFuel));
    let tx = await mainchainTFuelTokenBank.populateTransaction.lockTokens(cfg().subchainID, targetChainReceiver, {
        value: value.toString()
    });

    tx.setFrom(from);
    let gasData = await transactionController.getEstimatedGasData(tx);
    tx.gasLimit = gasData.gasLimit;

    const result = await signAndSendTransaction(from, tx, provider);
    console.log("lock tokens tx (mainchain):", result.hash, "\n");
}

async function burnTFuelVoucherOnSubchain(from, targetChainReceiver, amountInWei) {
    const keyringController = Wallet.controller.keyringController;
    const transactionController = Wallet.controller.transactionsController;
    const signAndSendTransaction = keyringController.signAndSendTransaction.bind(keyringController);
    const provider = createProvider(cfg().subchainIDStr, cfg().subchainRPC);
    const subchainTFuelTokenBank = new thetajs.Contract(cfg().subchainTFuelTokenBankAddr, TFuelTokenBankContract.abi, null)

    amountInWei = new BigNumber(amountInWei);
    let value = amountInWei.plus(thetajs.utils.toWei(cfg().crossChainTransferFeeInTFuel));
    let tx = await subchainTFuelTokenBank.populateTransaction.burnVouchers(targetChainReceiver, {
        value: value.toString()
    });

    // Subchain -> mainchain gas estimates are a bit off...add a 6x multipler
    tx.setFrom(from);
    let gasData = await transactionController.getEstimatedGasData(tx);
    tx.gasLimit = gasData.gasLimit;

    const result = await signAndSendTransaction(from, tx, provider);
    console.log("burn vouchers tx (subchain):", result.hash, "\n");
}

export async function transferTFuel(from, targetChainID, targetChainReceiver, amountInWei) {
    try {
        if (targetChainID !== cfg().subchainID && targetChainID !== cfg().mainchainID) {
            throw new Error("transferTFuel: Invalid target chain ID");
        }

        store.dispatch(showLoader('Fetching Token Bank...'));

        let {sourceChainIDStr, sourceChainRPC, targetChainIDStr, targetChainRPC} = getContextFromTargetChainID(targetChainID);
        let sourceChainSenderAddr = from;

        //
        // Step 1. Query and print the sender/receiver balance before the cross-chain transfer
        //

        await printSenderReceiverBalances(TokenType.TFuel,
            sourceChainIDStr, sourceChainRPC, DontCare, DontCare, sourceChainSenderAddr,
            targetChainIDStr, targetChainRPC, DontCare, DontCare, targetChainReceiver, getTFuelBalance);

        let targetChainReceiverInitialBalance = await getTFuelBalance(TokenType.TFuel, targetChainIDStr, targetChainRPC, DontCare, DontCare, targetChainReceiver);

        //
        // Step 2. Lock tokens/Burn vouchers on the source chain to initiate the cross-chain transfer
        //

        store.dispatch(showLoader('Executing Transfer...'));

        if (targetChainID === cfg().subchainID) {
            await lockTFuelOnMainchain(from, targetChainReceiver, amountInWei)
        } else if (targetChainID === cfg().mainchainID) {
            await burnTFuelVoucherOnSubchain(from, targetChainReceiver, amountInWei)
        }

        store.dispatch(showLoader('Waiting For Transfer Completion...'));

        //
        // Step 3. Wait for the cross-chain transfer to complete
        //

        await detectTargetChainReceiverBalanceChanges(targetChainIDStr, targetChainRPC, TokenType.TFuel, DontCare,
            DontCare, DontCare, DontCare, targetChainReceiver, targetChainReceiverInitialBalance, getTFuelBalance);

        //
        // Step 4. Query and print the sender/receiver balance afters the cross-chain transfer
        //
        await printSenderReceiverBalances(TokenType.TFuel,
            sourceChainIDStr, sourceChainRPC, DontCare, DontCare, sourceChainSenderAddr,
            targetChainIDStr, targetChainRPC, DontCare, DontCare, targetChainReceiver, getTFuelBalance);

        store.dispatch(updateAccountBalances());

        store.dispatch(hideLoader());

        Alerts.showSuccess("Your cross chain transfer has completed.");
    }
    catch (e){
        console.log(e)
        store.dispatch(hideLoader());

        const humanizedErrorMessage = thetajs.errors.humanizeErrorMessage(e.message);
        Alerts.showError(humanizedErrorMessage);
    }
}