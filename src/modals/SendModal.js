import React from 'react'
import './SendModal.css';
import Modal from '../components/Modal'
import Networks from "../constants/Networks";
import EthereumNetworkTxForm from '../components/EthereumNetworkTxForm'
import ThetaNetworkTxForm from '../components/ThetaNetworkTxForm'

export default class SendModal extends React.Component {
    render() {
        return (
            <Modal>
                <div className="SendModal">
                    <div className="SendModal__title">
                        Send
                    </div>
                    <ThetaNetworkTxForm />
                    
                </div>
            </Modal>
        )
    }
}