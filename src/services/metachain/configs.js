const _ = require('lodash');
const walletMetadata = require('@thetalabs/wallet-metadata');

let _cfg = null;

function setMetachainCfg(chainIdStr, subchain) {
    let mainchainConfig = walletMetadata.getMetachain(chainIdStr);

    // This subchain is overriding the default mainchain token banks
    if(subchain.mainchainTFuelTokenBankAddr){
        mainchainConfig = _.cloneDeep(mainchainConfig);
        mainchainConfig.mainchainTFuelTokenBankAddr = subchain.mainchainTFuelTokenBankAddr;
        mainchainConfig.mainchainTNT20TokenBankAddr = subchain.mainchainTNT20TokenBankAddr;
        mainchainConfig.mainchainTNT721TokenBankAddr = subchain.mainchainTNT721TokenBankAddr;
        mainchainConfig.mainchainTNT1155TokenBankAddr = subchain.mainchainTNT1155TokenBankAddr;
    }

    _cfg = Object.assign({}, mainchainConfig, subchain);
}

function cfg() {
    return _cfg;
}

export {
    cfg,
    setMetachainCfg
}