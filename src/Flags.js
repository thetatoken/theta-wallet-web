import Theta from './services/Theta';
import Networks, {canViewSmartContracts} from './constants/Networks';

export function isStakingAvailable(){
    return true;
}

export function canStakeFromHardwareWallet(){
    return true;
}

export function areSmartContractsAvailable(){
    const network = Theta.getChainID();

    return canViewSmartContracts(network);
}
