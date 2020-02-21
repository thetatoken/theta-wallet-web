const Networks =  {
    __deprecated__ETHEREUM: 'ethereum',
    THETA_TESTNET: 'testnet',
    THETA_TESTNET_AMBER: 'testnet_amber',
    THETA_TESTNET_SAPPHIRE: 'testnet_sapphire',
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
    // {
    //     id: Networks.THETA_TESTNET_AMBER,
    //     name: "Testnet_Amber",
    //     description: "THETA testnet for guardian nodes (Dec 2019)"
    // },
    {
        id: Networks.THETA_TESTNET_SAPPHIRE,
        name: "Testnet_Sapphire",
        description: "THETA testnet for guardian nodes (Feb 2020)"
    }
];

export const NetworkExplorerUrls = {
    [Networks.THETA_MAINNET]: 'https://explorer.thetatoken.org',
    [Networks.THETA_TESTNET]: 'https://beta-explorer.thetatoken.org',
    [Networks.THETA_TESTNET_AMBER]: 'https://guardian-testnet-explorer.thetatoken.org',
    [Networks.THETA_TESTNET_SAPPHIRE]: 'https://guardian-testnet-explorer-sapphire.thetatoken.org'
};

export function isEthereumNetwork(network) {
    return (network === Networks.__deprecated__ETHEREUM);
}

export function isThetaNetwork(network) {
    return (network !== Networks.__deprecated__ETHEREUM);
}

export function canGuardianNodeStake(network) {
    return (network === Networks.THETA_TESTNET_AMBER || network === Networks.THETA_TESTNET_SAPPHIRE);
}

export default Networks;
