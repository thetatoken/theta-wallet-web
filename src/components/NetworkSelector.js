import _ from 'lodash';
import React from 'react';
import {FaAngleDown} from 'react-icons/fa';
import {getNetworkForChainId} from '@thetalabs/theta-js/src/networks';
import {connect} from 'react-redux';
import * as thetajs from '@thetalabs/theta-js';
import {showModal} from "../state/actions/ui";
import ModalTypes from "../constants/ModalTypes";

export class NetworkSelector extends React.Component {
    constructor(){
        super();
    }

    onClick = () => {
        this.props.dispatch(showModal({
            type: ModalTypes.NETWORK_SELECTOR
        }));
    }

    render() {
        const {selectedNetwork} = this.props;

        return (
            <div className='NetworkSelector' onClick={this.onClick}>
                <div className='NetworkSelector__color'
                     style={{backgroundColor: selectedNetwork.color}}
                />
                <div className='NetworkSelector__name'>
                    {
                        selectedNetwork.name
                    }
                </div>
                <div className='NetworkSelector__arrow'>
                    <FaAngleDown/>
                </div>
            </div>
        );
    }
}

const mapStateToProps = (state, ownProps) => {
    const selectedChainId = _.get(state, 'thetaWallet.network.chainId', thetajs.networks.ChainIds.Mainnet);
    const selectedNetwork = getNetworkForChainId(selectedChainId) || {
        chainId: selectedChainId,
        name: selectedChainId,
        color: '#000000'
    };

    return {
        selectedNetwork: selectedNetwork
    };
};

export default connect(mapStateToProps)(NetworkSelector);
