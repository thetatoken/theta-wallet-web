import _ from 'lodash';
import * as thetajs from '@thetalabs/theta-js';
import {TDropAddressByChainId} from './index';

const {tokensByChainId} = require('@thetalabs/tnt20-contract-metadata');

const getTokenIconUrl = (fileName) => {
    if(_.isEmpty(fileName)){
        return null;
    }
    return `https://s3.us-east-2.amazonaws.com/assets.thetatoken.org/tokens/${fileName}`;
};

const ThetaAsset = {
    id: 'theta',
    name: 'Theta',
    symbol: 'THETA',
    contractAddress: null,
    decimals: 18,
    iconUrl: '/img/tokens/theta_large@2x.png',
};

const TFuelAsset = {
    id: 'tfuel',
    name: 'Theta Fuel',
    symbol: 'TFUEL',
    contractAddress: null,
    decimals: 18,
    iconUrl: '/img/tokens/tfuel_large@2x.png',
};

const NativeAssets = [
    ThetaAsset,
    TFuelAsset
];

const TDropAsset = (chainId) => {
    const tdropAddress = TDropAddressByChainId[chainId];
    let TNT20Asset = null;

    if(tdropAddress){
        TNT20Asset = {
            id: tdropAddress,
            name: 'TDROP',
            symbol: 'TDROP',
            contractAddress: tdropAddress,
            address: tdropAddress,
            decimals: 18,
            iconUrl: getTokenIconUrl(_.get(tokensByChainId, [chainId, tdropAddress, 'logo'])),
        };
    }

    return TNT20Asset;
};

const DefaultAssets = (chainId) => {
    const tdropAddress = TDropAddressByChainId[chainId];
    let TNT20Assets = [];
    let tdropAsset = TDropAsset(chainId);

    if(tdropAddress){
        TNT20Assets.push(tdropAsset);
    }

    return _.concat(NativeAssets, TNT20Assets);
};

const tokenToAsset = (token) => {
    const knownToken = (tokensByChainId[thetajs.networks.ChainIds.Mainnet][token.address] || tokensByChainId[thetajs.networks.ChainIds.Testnet][token.address]);

    return {
        id: token.address,
        name: token.symbol,
        symbol: token.symbol,
        contractAddress: token.address,
        decimals: token.decimals,
        iconUrl: (knownToken ? getTokenIconUrl(knownToken.logo) : null),
    };
};

export {
    DefaultAssets,

    ThetaAsset,
    TFuelAsset,
    TDropAsset,

    tokenToAsset
};
