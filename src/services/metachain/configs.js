const {getMetachainInfoForChainId} = require('@thetalabs/theta-js/src/networks')

let _cfg = null;

function setMetachainCfg(networkType, subchain) {
    let mainchainConfig = getMetachainInfoForChainId(networkType);

    // playground subchain is using legacy token banks
    if(parseInt(subchain.subchainID) === 360888){
        mainchainConfig = _.cloneDeep(mainchainConfig);
        mainchainConfig.mainchainTFuelTokenBankAddr = mainchainConfig.__LEGACY__mainchainTFuelTokenBankAddr;
        mainchainConfig.mainchainTNT20TokenBankAddr = mainchainConfig.__LEGACY__mainchainTNT20TokenBankAddr;
        mainchainConfig.mainchainTNT721TokenBankAddr = mainchainConfig.__LEGACY__mainchainTNT721TokenBankAddr;
        mainchainConfig.mainchainTNT1155TokenBankAddr = mainchainConfig.__LEGACY__mainchainTNT1155TokenBankAddr;
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