import React from 'react'
import './NetworkSelectorModal.css';
import Modal from '../components/Modal';
import {store} from "../state";
import {hideModal} from "../state/actions/Modals";
import {NetworksWithDescriptions} from '../constants/Networks';

export class NetworkRow extends React.Component {
    render() {
        let {network, onClick} = this.props;
        let { name, description } = network;

        return (
            <a className="NetworkSelectorModal__row"
               onClick={onClick} >
                <div className="NetworkSelectorModal__row-name">
                    {name}
                </div>

                <div className="NetworkSelectorModal__row-description">
                    {description}
                </div>
            </a>
        )
    }
}

export default class NetworkSelectorModal extends React.Component {
    handleNetworkClick(address){
        store.dispatch(hideModal());
    }

    render() {
        let renderDataRow = (network) => {
            return (
                <NetworkRow key={network.id}
                            network={network}
                            onClick={() => {this.handleNetworkClick(network)}}>
                </NetworkRow>
            );
        };

        let rows = [];
        for(var i = 0; i < NetworksWithDescriptions.length; i++){
            let network = NetworksWithDescriptions[i];
            rows.push( renderDataRow(network) );
        }

        return (
            <Modal>
                <div className="NetworkSelectorModal">
                    <div className="NetworkSelectorModal__title">
                        Select a Network
                    </div>
                    <div className="NetworkSelectorModal__rows">
                        { rows }
                    </div>
                </div>
            </Modal>
        )
    }
}
