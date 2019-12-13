const Networks =  {
    ETHEREUM: 'ethereum',
    THETA_TESTNET: 'testnet',
    THETA_MAINNET: 'mainnet',
};

export const NetworksWithDescriptions = [
    {
        id: "mainnet",
        name: "Mainnet (Default)",
        description: "THETA mainnet"
    },
    {
        id: "testnet",
        name: "Testnet",
        description: "THETA testnet"
    },
    {
        id: "testnet_amber",
        name: "Testnet_Amber",
        description: "THETA testnet for gaurdian nodes"
    }
];

export function isEthereumNetwork(network) {
    return (network === Networks.ETHEREUM);
}

export function isThetaNetwork(network) {
    return (network === Networks.THETA_MAINNET || network === Networks.THETA_TESTNET);
}

export default Networks;
