const {TokenType, DontCare, getContextFromTargetChainID, getTokenBank} = require("./common.js")
const {mintMockTNTTokensIfNeeded} = require("./mintUtils")
const {approveTokenAccess, transferTNT} = require("./tntUtils")

async function transferTNT721(senderKeyPath, senderKeyPassword, sourceChainTokenOrVoucherContractAddr, targetChainID, targetChainReceiver, tokenID) {
    // Mint mock TNT tokens if sourceChainTokenOrVoucherContractAddr is not a voucher contract
    await mintMockTNTTokensIfNeeded(TokenType.TNT721, sourceChainTokenOrVoucherContractAddr, targetChainID, targetChainReceiver, tokenID, DontCare, senderKeyPath, senderKeyPassword);

    // Approve the TokenBank contract as the spender of the TNT token
    let {sourceChainID, sourceChainIDStr, sourceChainRPC} = getContextFromTargetChainID(targetChainID);
    let spender = getTokenBank(TokenType.TNT721, sourceChainID, DontCare, DontCare);
    await approveTokenAccess(TokenType.TNT721, sourceChainIDStr, sourceChainRPC, sourceChainTokenOrVoucherContractAddr, spender.address, tokenID, DontCare, senderKeyPath, senderKeyPassword)

    // Transfer the tokens/vouchers
    await transferTNT(TokenType.TNT721, senderKeyPath, senderKeyPassword, sourceChainTokenOrVoucherContractAddr, targetChainID, targetChainReceiver, tokenID, DontCare);
}

export {
    transferTNT721
}
