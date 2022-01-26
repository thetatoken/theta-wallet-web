import * as thetajs from '@thetalabs/theta-js';

export const SingleCallTokenBalancesAddressByChainId = {
    [thetajs.networks.ChainIds.Mainnet]: '0xb6ecbc094abd0ff7cf030ec9e81f6ca8045b87f9',
    [thetajs.networks.ChainIds.Testnet]: '0xf0cfe34a7e053520f08bf0a982391810ece9c582',
    [thetajs.networks.ChainIds.Privatenet]: '0xedba30e32e11ae95ca9c000b8de97c7af087c7de'
};

export const TDropStakingAddressByChainId = {
    [thetajs.networks.ChainIds.Mainnet]: '0xA89c744Db76266ecA60e2b0F62Afcd1f8581b7ed',
    [thetajs.networks.ChainIds.Testnet]: '0xA8bfA60203E55f86Dc7013CBf3d8fF85bb1d3cC7',
};

export const TDropAddressByChainId = {
    [thetajs.networks.ChainIds.Mainnet]: '0x1336739B05C7Ab8a526D40DCC0d04a826b5f8B03',
    [thetajs.networks.ChainIds.Testnet]: '0x08a0c0e8EFd07A98db11d79165063B6Bc2469ADF',
};

export const StakePurposeForTDROP = 1000;

export const Urls = {
    PreventingLostTokens: 'https://docs.thetatoken.org/docs/preventing-lost-eth-erc20-tokens'
};

export const FaucetAvailable = false;
