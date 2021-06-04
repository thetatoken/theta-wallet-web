import React from 'react'
import './Modals.css';
import {connect} from 'react-redux'
import ReactModal from 'react-modal';
import _ from 'lodash';
import {hideModal} from "../state/actions/Modals";
import ModalTypes from "../constants/ModalTypes";
import ReceiveModal from "../modals/ReceiveModal";
import SendModal from "../modals/SendModal";
import PrivateKeyModal from "../modals/PrivateKeyModal";
import SendConfirmationModal from "../modals/SendConfirmationModal";
import ColdWalletSelectorModal from "../modals/ColdWalletSelectorModal";
import DepositStakeModal from "../modals/DepositStakeModal";
import DepositStakeConfirmationModal from "../modals/DepositStakeConfirmationModal";
import WithdrawStakeModal from "../modals/WithdrawStakeModal";
import WithdrawStakeConfirmationModal from "../modals/WithdrawStakeConfirmationModal";
import SmartContractConfirmationModal from "../modals/SmartContractConfirmationModal";
import NetworkSelectorModal from "../modals/NetworkSelectorModal";
import GuardianNodeDelegatesModal from "../modals/GuardianNodeDelegatesModal";

const ModalComponentByType = {
    [ModalTypes.RECEIVE]: ReceiveModal,
    [ModalTypes.SEND]: SendModal,
    [ModalTypes.SEND_CONFIRMATION]: SendConfirmationModal,
    [ModalTypes.PRIVATE_KEY]: PrivateKeyModal,
    [ModalTypes.COLD_WALLET_SELECTOR]: ColdWalletSelectorModal,
    [ModalTypes.DEPOSIT_STAKE]: DepositStakeModal,
    [ModalTypes.DEPOSIT_STAKE_CONFIRMATION]: DepositStakeConfirmationModal,
    [ModalTypes.WITHDRAW_STAKE]: WithdrawStakeModal,
    [ModalTypes.WITHDRAW_STAKE_CONFIRMATION]: WithdrawStakeConfirmationModal,
    [ModalTypes.SMART_CONTRACT_CONFIRMATION]: SmartContractConfirmationModal,
    [ModalTypes.NETWORK_SELECTOR]: NetworkSelectorModal,
    [ModalTypes.GUARDIAN_NODE_DELEGATE_SELECTOR]: GuardianNodeDelegatesModal
};

class ModalContainer extends React.Component {
    render() {
        let modal = this.props.modal;
        let ModalComponent = (modal ? modal.component : null);

        return (
            <ReactModal
                isOpen={modal !== null}
                onRequestClose={this.props.closeModal}
                ariaHideApp={false}
                overlayClassName="ModalOverlay"
                className="Modal">
                {
                    modal &&
                    <ModalComponent
                        closeModal={this.props.closeModal}
                        {...modal.props}
                    />
                }
            </ReactModal>
        )
    }
}

class Modals extends React.Component {
    constructor() {
        super();

        this.closeModal = this.closeModal.bind(this);
    }

    closeModal() {
        this.props.dispatch(hideModal());
    }

    getModal(idx) {
        let modalData = _.get(this.props.modals, [idx], null);
        if (modalData) {
            modalData = Object.assign({}, modalData, {
                component: ModalComponentByType[modalData.type]
            });
        }

        return modalData;
    }

    render() {
        let modal1 = this.getModal(0);
        let modal2 = this.getModal(1);

        return (
            <div>
                <ModalContainer modal={modal1}
                                closeModal={this.closeModal}/>
                <ModalContainer modal={modal2}
                                closeModal={this.closeModal}/>
            </div>
        )
    }
}

const mapStateToProps = state => ({
    modals: state.modals.modals
});

export default connect(mapStateToProps, null)(Modals)
