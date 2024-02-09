import React from 'react'
import './Modals.css';
import {connect} from 'react-redux'
import ReactModal from 'react-modal';
import _ from 'lodash';
import {hideModal} from "../state/actions/ui";
import ModalTypes from "../constants/ModalTypes";
import ReceiveModal from "../modals/ReceiveModal";
import PrivateKeyModal from "../modals/PrivateKeyModal";
import NetworkSelectorModal from "../modals/NetworkSelectorModal";
import ConfirmTransactionModal from "../modals/ConfirmTransactionModal";
import CreateTransactionModal from "../modals/CreateTransactionModal";
import DelegatedNodeSelectorModal from "../modals/DelegatedNodeSelectorModal";
import TrackTokenModal from "../modals/TrackTokenModal";
import CollectiblesModal from "../modals/CollectiblesModal";
import TrackCollectibleModal from "../modals/TrackCollectibleModal";
import DAppModal from "../modals/DAppModal";

const ModalComponentByType = {
    [ModalTypes.RECEIVE]: ReceiveModal,
    [ModalTypes.PRIVATE_KEY]: PrivateKeyModal,
    [ModalTypes.NETWORK_SELECTOR]: NetworkSelectorModal,
    [ModalTypes.CREATE_TRANSACTION]: CreateTransactionModal,
    [ModalTypes.CONFIRM_TRANSACTION]: ConfirmTransactionModal,
    [ModalTypes.DELEGATED_NODE_SELECTOR]: DelegatedNodeSelectorModal,
    [ModalTypes.TRACK_TOKEN]: TrackTokenModal,
    [ModalTypes.COLLECTIBLES]: CollectiblesModal,
    [ModalTypes.TRACK_COLLECTIBLE]: TrackCollectibleModal,
    [ModalTypes.DAPP]: DAppModal
};

class ModalContainer extends React.Component {
    render() {
        let modal = this.props.modal;
        let ModalComponent = (modal ? modal.component : null);
        let closeable = (modal?.props?.closeable !== false);

        return (
            <ReactModal
                isOpen={modal !== null}
                onRequestClose={this.props.closeModal}
                ariaHideApp={false}
                shouldCloseOnOverlayClick={closeable}
                shouldCloseOnEsc={closeable}
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
        let modal3 = this.getModal(2);

        return (
            <div>
                <ModalContainer modal={modal1}
                                closeModal={this.closeModal}/>
                <ModalContainer modal={modal2}
                                closeModal={this.closeModal}/>
                <ModalContainer modal={modal3}
                                closeModal={this.closeModal}/>
            </div>
        )
    }
}

const mapStateToProps = state => ({
    modals: state.ui.modals
});

export default connect(mapStateToProps, null)(Modals)
