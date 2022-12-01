const {getMetachainInfoForChainId} = require('@thetalabs/theta-js/src/networks')

let _cfg = null;

function setMetachainCfg(networkType, subchain) {
    const mainchainConfig = getMetachainInfoForChainId(networkType);

    _cfg = Object.assign({}, mainchainConfig, subchain);
}

function cfg() {
    return _cfg;
}

export {
    cfg,
    setMetachainCfg
}