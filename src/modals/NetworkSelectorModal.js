import React from 'react';
import {connect} from 'react-redux';
import * as thetajs from '@thetalabs/theta-js';
import {hideModal, hideModals} from "../state/actions/ui";
import {setNetwork} from "../state/actions/Wallet";

const classNames = require('classnames');

const OrderedNetworks = [
    thetajs.networks.Mainnet,
    thetajs.networks.Testnet,
    thetajs.networks.Privatenet,
    thetajs.networks.EliteEdgeTestnet,
];

export class NetworkSelectorModal extends React.Component {
    onNetworkClick = (network) => {
        this.props.dispatch(setNetwork(network.chainId));

        this.props.dispatch(hideModal());
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
                                const classes = classNames('NetworkSelectListItem', { 'NetworkSelectListItem--active': (network.chainId === selectedNetwork.chainId)});

                                return (
                                    <div key={network.chainId}
                                         className={classes}
                                         onClick={() => {
                                             this.onNetworkClick(network);
                                         }}
                                    >
                                        <img className='NetworkSelectListItem__checkmark' src='/img/icons/checkmark.svg'/>
                                        <div className='NetworkSelectListItem__color' style={{backgroundColor: network.color}}/>
                                        <div className='NetworkSelectListItem__name'>{network.name}</div>
                                    </div>
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


// import React from 'react'
// import './NetworkSelectorModal.css';
// import Modal from '../components/Modal';
// import {store} from "../state";
// import {hideModal} from "../state/actions/ui";
// import {setNetwork} from "../state/actions/Wallet";
// import {NetworksWithDescriptions} from '../constants/Networks';
//
// export class NetworkRow extends React.Component {
//     render() {
//         let {network, onClick} = this.props;
//         let { name, description } = network;
//
//         return (
//             <a className="NetworkSelectorModal__row"
//                onClick={onClick} >
//                 <div className="NetworkSelectorModal__row-name">
//                     {name}
//                 </div>
//
//                 <div className="NetworkSelectorModal__row-description">
//                     {description}
//                 </div>
//             </a>
//         )
//     }
// }
//
// export default class NetworkSelectorModal extends React.Component {
//     handleNetworkClick(network){
//         store.dispatch(hideModal());
//
//         store.dispatch(setNetwork(network.id));
//     }
//
//     render() {
//         let renderDataRow = (network) => {
//             return (
//                 <NetworkRow key={network.id}
//                             network={network}
//                             onClick={() => {this.handleNetworkClick(network)}}>
//                 </NetworkRow>
//             );
//         };
//
//         let rows = [];
//         for(var i = 0; i < NetworksWithDescriptions.length; i++){
//             let network = NetworksWithDescriptions[i];
//             rows.push( renderDataRow(network) );
//         }
//
//         return (
//             <Modal>
//                 <div className="NetworkSelectorModal">
//                     <div className="NetworkSelectorModal__title">
//                         Select a Network
//                     </div>
//                     <div className="NetworkSelectorModal__rows">
//                         { rows }
//                     </div>
//                 </div>
//             </Modal>
//         )
//     }
// }
