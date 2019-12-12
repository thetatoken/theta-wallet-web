import React from 'react'
import './DepositStakeModal.css';
import Modal from '../components/Modal'
import ThetaNetworkTxForm from '../components/ThetaNetworkTxForm'

export default class DepositStakeModal extends React.Component {
    render() {
        return (
            <Modal>
                <div className="DepositStakeModal">
                    <div className="DepositStakeModal__title">
                        Deposit Stake
                    </div>
                    <ThetaNetworkTxForm/>
                </div>
            </Modal>
        )
    }
}

