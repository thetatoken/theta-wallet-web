import Theta from './services/Theta';
import Networks from './constants/Networks';

export function isStakingAvailable(){
    return true;
}

export function canStakeFromHardwareWallet(){
    const chainId = Theta.getChainID();

    //Block guardian node staking on amber testnet
    return true;//(chainId !== Networks.THETA_TESTNET_AMBER);
}
