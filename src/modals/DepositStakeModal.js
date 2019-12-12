import React from 'react'
import './DepositStakeModal.css';
import Modal from '../components/Modal'
import DepositStakeTxForm from '../components/transactions/DepositStakeTxForm'

export default class DepositStakeModal extends React.Component {
    render() {
        return (
            <Modal>
                <div className="DepositStakeModal">
                    <div className="DepositStakeModal__title">
                        Deposit Stake
                    </div>
                    <DepositStakeTxForm/>
                </div>
            </Modal>
        )
    }
}
