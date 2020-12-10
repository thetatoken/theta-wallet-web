import Theta from './services/Theta';
import Networks, {canViewSmartContracts} from './constants/Networks';
import ThetaJS from "./libs/thetajs.esm";

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

export function getMinStakeAmount(purpose){
    const network = Theta.getChainID();

    if(purpose === ThetaJS.StakePurposes.StakeForValidator){
        return 2000000.0;
    }
    else if(purpose === ThetaJS.StakePurposes.StakeForGuardian){
        return 1000.0;
    }

    //Unknown
    return 0.0;
}
