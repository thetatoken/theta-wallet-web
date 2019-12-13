import Theta from './services/Theta';
import Networks from './constants/Networks';

export function isStakingAvailable(){
    const chainId = Theta.getChainID();

    return (chainId === Networks.THETA_TESTNET_AMBER);
}
