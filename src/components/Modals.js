import React from 'react'
import './Modals.css';
import { connect } from 'react-redux'
import ReactModal from 'react-modal';
import _ from 'lodash';
import {hideModal} from "../state/actions/Modals";
import ModalTypes from "../constants/ModalTypes";
import Modal from './Modal'

class ReceiveModal extends React.Component {
    render() {
        return (
            <Modal>
                <div>
                    I am the receive modal
                </div>
            </Modal>
        )
    }
}


const mapStateToProps = state => ({
    modals: state.modals.modals
});

const ModalComponentByType = {
    [ModalTypes.RECEIVE]: ReceiveModal
};

class ModalContainer extends React.Component {
    render() {
        let modal = this.props.modal;
        let ModalComponent = (modal ? modal.component : null);

        console.log("ModalContainer :: modal == ");
        console.log(modal);

        return (
            <ReactModal
                isOpen={modal !== null}
                onRequestClose={this.props.closeModal}
                ariaHideApp={false}
                overlayClassName="ModalOverlay"
                className="Modal"
            >
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
    constructor(){
        super();

        this.closeModal = this.closeModal.bind(this);
    }

    closeModal() {
        console.log("Modals :: closeModal");
        this.props.dispatch(hideModal());
    }

    getModal(idx){
        let modalData = _.get(this.props.modals, [idx], null);
        if(modalData){
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
                                closeModal={this.closeModal}
                />
                <ModalContainer modal={modal2}
                                closeModal={this.closeModal}/>
            </div>
        )
    }
}

export default connect(mapStateToProps, null)(Modals)