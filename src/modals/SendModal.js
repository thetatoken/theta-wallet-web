import React from 'react'
import './SendModal.css';
import _ from 'lodash';
import Modal from '../components/Modal'
import Wallet from '../services/Wallet'
import GhostButton from '../components/buttons/GhostButton'

export default class SendModal extends React.Component {
    render() {
        return (
            <Modal>
                <div className="SendModal">
                    <div className="SendModal__title">
                        Send
                    </div>
                </div>
            </Modal>
        )
    }
}