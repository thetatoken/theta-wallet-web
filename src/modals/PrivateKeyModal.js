import React from 'react'
import './PrivateKeyModal.css';
import Modal from '../components/Modal'
import GradientButton from '../components/buttons/GradientButton'
import {store} from "../state";
import {hideModal} from "../state/actions/ui";

export default class PrivateKeyModal extends React.Component {
    constructor(){
        super();

        this.close = this.close.bind(this);
    }

    close(){
        store.dispatch(hideModal());
    }

    render() {
        return (
            <Modal>
                <div className="PrivateKeyModal">
                    <div className="PrivateKeyModal__title">
                        Your Private Key
                    </div>
                    <div className="PrivateKeyModal__instructions">
                        Backup the text below on paper or digitally and keep it somewhere safe and secure.
                    </div>
                    <textarea className="PrivateKeyModal__private-key"
                              value={this.props.privateKey}
                              readOnly={true}
                    />
                    <GradientButton title="Close"
                                    onClick={this.close}
                    />
                </div>
            </Modal>
        )
    }
}
