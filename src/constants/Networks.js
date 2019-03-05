const Networks =  {
    ETHEREUM: 'ethereum',
    THETA_TESTNET: 'testnet',
    THETA_MAINNET: 'mainnet',
};

export function isEthereumNetwork(network) {
    return (network === Networks.ETHEREUM);
}

export function isThetaNetwork(network) {
    return (network === Networks.THETA_MAINNET || network === Networks.THETA_TESTNET);
}

export default Networks;