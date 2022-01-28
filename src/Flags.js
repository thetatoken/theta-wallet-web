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
    if(purpose === ThetaJS.StakePurposes.StakeForValidator){
        return 2000000.0;
    }
    else if(purpose === ThetaJS.StakePurposes.StakeForGuardian){
        return 1000.0;
    }
    else if(purpose === ThetaJS.StakePurposes.StakeForEliteEdge){
        return 10000.0;
    }

    //Unknown
    return 0.0;
}

export function getMaxStakeAmount(purpose){
    if(purpose === ThetaJS.StakePurposes.StakeForEliteEdge){
        return 500000.0;
    }

    //No max
    return 100000000000.0;
}

export function getMaxDelegatedStakeAmount(purpose){
    if(purpose === ThetaJS.StakePurposes.StakeForGuardian){
        return 10000.0;
    }

    //Unknown
    return 0.0;
}
