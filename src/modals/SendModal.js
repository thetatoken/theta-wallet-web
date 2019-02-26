import React from 'react'
import './SendModal.css';
import _ from 'lodash';
import {connect} from 'react-redux'
import Modal from '../components/Modal'
import Wallet from '../services/Wallet'
import GhostButton from '../components/buttons/GhostButton'
import TokenTypes from "../constants/TokenTypes";
import EthereumNetworkTxForm from '../components/EthereumNetworkTxForm'

export default class SendModal extends React.Component {
    render() {
        return (
            <Modal>
                <div className="SendModal">
                    <div className="SendModal__title">
                        Send
                    </div>
                    <EthereumNetworkTxForm />
                </div>
            </Modal>
        )
    }
}