import React from 'react';
import {connect} from 'react-redux';
import * as thetajs from '@thetalabs/theta-js';
import {hideModal, hideModals} from "../state/actions/ui";
import {setNetwork} from "../state/actions/Wallet";
import {getSubchains} from "../constants/Metachain";

const classNames = require('classnames');

const OrderedNetworks = [
    thetajs.networks.Mainnet,
    thetajs.networks.Testnet
];

export class NetworkSelectorModal extends React.Component {
    onNetworkClick = (network) => {
        this.props.dispatch(setNetwork(network));

        this.props.dispatch(hideModal());
    };

    onMainChainClick = (network) => {
        this.onNetworkClick(Object.assign({}, network, {
            name: `${network.name}  |  Main Chain`
        }));
    };

    onSubchainClick = (mainChainNetwork, subchainNetwork) => {
        this.onNetworkClick(Object.assign({}, mainChainNetwork, {
            chainId: subchainNetwork.subchainIDStr,
            rpcUrl: subchainNetwork.subchainRPC,
            explorerUrl: subchainNetwork.explorerUrl,
            mainchainChainId: mainChainNetwork.chainId,
            name: `${mainChainNetwork.name}  |  ${subchainNetwork.name}`
        }));
    };

    render() {
        const {selectedNetwork} = this.props;

        return (
            <div className={'NetworkSelectorModal'}>
                <div className='NetworkSelectorModal__header'>
                    <div className='NetworkSelectorModal__header-title'>Select Network</div>
                </div>
                <div className='NetworkSelectorModal__content'>
                    <div className='NetworkSelectorModal__message'>
                        The default network for Theta transactions is Mainnet.
                    </div>
                    <div className='NetworkSelectList'>
                        {
                            OrderedNetworks.map((network) => {
                                const classes = classNames('NetworkSelectListItem', {
                                    'NetworkSelectListItem--active': (network.chainId === selectedNetwork.chainId)
                                });
                                const subchains = getSubchains(network.chainId);

                                return (
                                    <React.Fragment key={`${network.chainId}-section`}>
                                        <div key={network.chainId}
                                             className={classes}
                                             onClick={() => {
                                                 this.onMainChainClick(network);
                                             }}
                                        >
                                            <div className='NetworkSelectListItem__color' style={{backgroundColor: network.color}}/>
                                            <div className='NetworkSelectListItem__name'
                                                 style={{fontWeight: 700}}>
                                                {network.name}
                                            </div>
                                        </div>
                                        {/*Mainchain*/}
                                        <div key={`${network.chainId}-mainchain`}
                                             className={classes}
                                             style={{paddingLeft: 42}}
                                             onClick={() => {
                                                 this.onMainChainClick(network);

                                             }}
                                        >
                                            <img className='NetworkSelectListItem__checkmark' src='/img/icons/checkmark.svg'
                                                 style={{marginLeft: -10, marginRight: 10}}
                                            />
                                            <div className='NetworkSelectListItem__name'>Main Chain</div>
                                        </div>
                                        {/*Subchains*/}
                                        <div key={'subchains'}>
                                        {
                                            subchains.map((subchain) => {
                                                const classes = classNames('NetworkSelectListItem', {
                                                    'NetworkSelectListItem--active': (subchain.subchainIDStr === selectedNetwork.chainId)
                                                });
                                                return (
                                                    <div key={subchain.chainId}
                                                         className={classes}
                                                         style={{paddingLeft: 42}}
                                                         onClick={() => {
                                                             this.onSubchainClick(network, subchain);
                                                         }}
                                                    >
                                                        <img className='NetworkSelectListItem__checkmark' src='/img/icons/checkmark.svg'
                                                        style={{marginLeft: -10, marginRight: 10}}
                                                        />
                                                        <div className='NetworkSelectListItem__name'>{subchain.name}</div>
                                                    </div>
                                                )
                                            })
                                        }
                                        </div>
                                    </React.Fragment>
                                );
                            })
                        }
                    </div>
                </div>
            </div>
        );
    }
}

const mapStateToProps = (state) => {
    const { thetaWallet } = state;
    const selectedNetwork = thetaWallet.network;

    return {
        selectedNetwork: selectedNetwork,
    };
};

export default connect(mapStateToProps)(NetworkSelectorModal);
