import _ from 'lodash';
import Theta from './services/Theta';
import Networks, {canViewSmartContracts} from './constants/Networks';
import ThetaJS from "./libs/thetajs.esm";
import {getMetachainConfig} from "./constants/Metachain";

export const DAPPS_ENABLED = true;

export function isStakingAvailable(){
    const network = Theta.getChainID();

    return !network.startsWith('tsub');
}

export function canStakeFromHardwareWallet(){
    return true;
}

export function areSmartContractsAvailable(){
    const network = Theta.getChainID();

    return canViewSmartContracts(network);
}

export function areCrossChainTransactionsAvailable(){
    const network = Theta.getChainID();
    let config = getMetachainConfig(network);

    return (network.startsWith('tsub') || !_.isNil(config));
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
