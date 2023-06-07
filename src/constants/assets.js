import _ from 'lodash';
import * as thetajs from '@thetalabs/theta-js';
import {TDropAddressByChainId, WThetaAddressByChainId} from './index';

const {getKnownToken} = require('@thetalabs/wallet-metadata');

// TOKEN STANDARDS
const ERC721 = 'ERC721';
const ERC1155 = 'ERC1155';
const ERC20 = 'ERC20';

const getTokenIconUrl = (fileName) => {
    if(_.isEmpty(fileName)){
        return null;
    }
    return `https://assets.thetatoken.org/tokens/${fileName}`;
};

const ThetaAsset = {
    id: 'theta',
    name: 'Theta',
    symbol: 'THETA',
    contractAddress: null,
    decimals: 18,
    iconUrl: getTokenIconUrl('theta.png'),
    balanceKey: 'thetawei'
};

const TFuelAsset = {
    id: 'tfuel',
    name: 'Theta Fuel',
    symbol: 'TFUEL',
    contractAddress: null,
    decimals: 18,
    iconUrl: getTokenIconUrl('tfuel.png'),
    balanceKey: 'tfuelwei'
};

const NativeAssets = [
    ThetaAsset,
    TFuelAsset
];

const NativeAssetsForSubchain = [
    Object.assign({}, TFuelAsset, {
        symbol: `v${TFuelAsset.symbol}`
    })
];

const TDropAsset = (chainId) => {
    const address = TDropAddressByChainId[chainId];
    let TNT20Asset = null;
    const knownToken = getKnownToken(chainId, address);

    if(address){
        TNT20Asset = {
            id: address,
            name: 'TDROP',
            symbol: 'TDROP',
            contractAddress: address,
            address: address,
            decimals: 18,
            iconUrl:  knownToken?.logoUrl,
            balanceKey: address
        };
    }

    return TNT20Asset;
};

const WThetaAsset = (chainId) => {
    const address = WThetaAddressByChainId[chainId];
    let TNT20Asset = null;
    const knownToken = getKnownToken(chainId, address);

    if(address){
        TNT20Asset = {
            id: address,
            name: 'wTHETA',
            symbol: 'wTHETA',
            contractAddress: address,
            address: address,
            decimals: 18,
            iconUrl:  knownToken?.logoUrl,
            balanceKey: address
        };
    }

    return TNT20Asset;
};

const DefaultAssets = (chainId) => {
    let TNT20Assets = [];
    let tdropAsset = TDropAsset(chainId);
    let wThetaAsset = WThetaAsset(chainId);

    if(tdropAsset){
        TNT20Assets.push(tdropAsset);
    }
    if(wThetaAsset){
        TNT20Assets.push(wThetaAsset);
    }

    return _.concat((_.startsWith(chainId, 'tsub') ? NativeAssetsForSubchain : NativeAssets), TNT20Assets);
};

const getAllAssets = (chainId, tokens) => {
    const tdropAddress = TDropAddressByChainId[chainId]?.toLowerCase();
    const wThetaAddress = WThetaAddressByChainId[chainId]?.toLowerCase();
    const tokenAssets = tokens.map(tokenToAsset);
    const tokenAssetsWithoutDefaultTNT20s = _.filter(tokenAssets, (asset) => {
        const address = asset.contractAddress?.toLowerCase();
        return (address !== tdropAddress && address !== wThetaAddress);
    });

    return _.concat(DefaultAssets(chainId), tokenAssetsWithoutDefaultTNT20s);
};

const tokenToAsset = (token) => {
    const knownToken = (
        getKnownToken(thetajs.networks.ChainIds.Mainnet, token.address) ||
        getKnownToken(thetajs.networks.ChainIds.Testnet, token.address)
    );

    return {
        id: token.address,
        name: token.symbol,
        symbol: token.symbol,
        contractAddress: token.address,
        decimals: token.decimals,
        iconUrl: (knownToken ? knownToken.logoUrl : null),
        balanceKey: token.address
    };
};

export {
    DefaultAssets,

    ThetaAsset,
    TFuelAsset,
    TDropAsset,
    WThetaAsset,

    tokenToAsset,

    getAllAssets,

    ERC721,
    ERC1155,
    ERC20
};
