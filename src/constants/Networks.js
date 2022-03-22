import _ from 'lodash';
import {zipMap} from "../utils/Utils";

const Networks =  {
    __deprecated__ETHEREUM: 'ethereum',
    THETA_TESTNET: 'testnet',
    THETA_TESTNET_AMBER: 'testnet_amber',
    THETA_TESTNET_SAPPHIRE: 'testnet_sapphire',
    THETA_MAINNET: 'mainnet',
    THETA_PRIVATENET: 'privatenet',
};

export const NetworksWithDescriptions = [
    {
        id: Networks.THETA_MAINNET,
        name: "Mainnet",
        description: "THETA mainnet (Default)",
        // faucetId: "mainnet"
    },
    {
        id: Networks.THETA_TESTNET,
        name: "Testnet",
        description: "THETA testnet",
        faucetId: "testnet"
    },
    {
        id: Networks.THETA_TESTNET_AMBER,
        name: "Testnet_Amber",
        description: "THETA testnet for elite edge nodes (Apr 2021)"
    },
    {
        id: Networks.THETA_TESTNET_SAPPHIRE,
        name: "Testnet (Sapphire)",
        description: "THETA testnet for guardian nodes (Feb 2020)",
        // faucetId: "sapphire"
    },
    {
        id: Networks.THETA_PRIVATENET,
        name: "Smart Contracts Sandbox",
        description: "THETA testnet for Smart Contracts (ALPHA)",
        faucetId: "smart_contract"
    }
];

export const NetworksById = zipMap(NetworksWithDescriptions.map(({ id }) => id), NetworksWithDescriptions);

export const NetworkExplorerUrls = {
    [Networks.THETA_MAINNET]: 'https://explorer.thetatoken.org',
    [Networks.THETA_TESTNET]: 'https://beta-explorer.thetatoken.org',
    [Networks.THETA_TESTNET_AMBER]: 'https://elite-edge-testnet-explorer.thetatoken.org',
    [Networks.THETA_TESTNET_SAPPHIRE]: 'https://guardian-testnet-explorer.thetatoken.org',
    [Networks.THETA_PRIVATENET]: 'https://smart-contracts-sandbox-explorer.thetatoken.org'
};

export function isEthereumNetwork(network) {
    return (network === Networks.__deprecated__ETHEREUM);
}

export function isThetaNetwork(network) {
    return (network !== Networks.__deprecated__ETHEREUM);
}

export function canEdgeNodeStake(network) {
    return true;
    return (network === Networks.THETA_TESTNET_AMBER);
}

export function canGuardianNodeStake(network) {
    return true;
}

export function canViewSmartContracts(network) {
    return true;
}

export function getNetworkName(networkId){
    return _.get(NetworksById, [networkId, 'name']);
}

export function getNetworkFaucetId(networkId){
    return _.get(NetworksById, [networkId, 'faucetId']);
}

export default Networks;
