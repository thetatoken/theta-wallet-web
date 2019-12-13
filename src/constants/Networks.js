const Networks =  {
    __deprecated__ETHEREUM: 'ethereum',
    THETA_TESTNET: 'testnet',
    THETA_TESTNET_AMBER: 'testnet_amber',
    THETA_MAINNET: 'mainnet',
};

export const NetworksWithDescriptions = [
    {
        id: Networks.THETA_MAINNET,
        name: "Mainnet (Default)",
        description: "THETA mainnet"
    },
    {
        id: Networks.THETA_TESTNET,
        name: "Testnet",
        description: "THETA testnet"
    },
    {
        id: Networks.THETA_TESTNET_AMBER,
        name: "Testnet_Amber",
        description: "THETA testnet for gaurdian nodes"
    }
];

export function isEthereumNetwork(network) {
    return (network === Networks.__deprecated__ETHEREUM);
}

export function isThetaNetwork(network) {
    return (network === Networks.THETA_MAINNET || network === Networks.THETA_TESTNET);
}

export default Networks;
