import React from 'react'
import './WithdrawStakeModal.css';
import Modal from '../components/Modal'
import WithdrawStakeTxForm from '../components/transactions/WithdrawStakeTxForm'

export default class WithdrawStakeModal extends React.Component {
    render() {
        return (
            <Modal>
                <div className="WithdrawStakeModal">
                    <div className="WithdrawStakeModal__title">
                        Withdraw Stake
                    </div>
                    <WithdrawStakeTxForm/>
                </div>
            </Modal>
        )
    }
}
