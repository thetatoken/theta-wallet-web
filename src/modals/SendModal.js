import _ from 'lodash';
import React from 'react'
import './SendModal.css';
import Modal from '../components/Modal'
import SendTxForm from '../components/transactions/SendTxForm'
import Warning from "../components/Warning";
import {Urls} from "../constants/Urls";
import {formDataToTransaction} from "../utils/Utils";
import Wallet from "../services/Wallet";
import {store} from "../state";
import {showModal} from "../state/actions/ui";
import ModalTypes from "../constants/ModalTypes";
import Theta from "../services/Theta";
import {createTransactionRequest} from "../state/actions/Transactions";

export default class SendModal extends React.Component {
    onSubmit = async (formData) => {
        const tx = await formDataToTransaction('send', formData, Wallet.controller.getState());
        const deps = tx.dependencies || [];
        const depTx = deps[0];
        const transactionRequest = tx.toJson();
        if(depTx){
            transactionRequest.dependencies = [
                depTx.toJson()
            ];
        }
        console.log('transactionRequest == ');
        console.log(transactionRequest);

        store.dispatch(createTransactionRequest(transactionRequest));
    }

    render() {
        return (
            <Modal>
                <div className="SendModal">
                    <div className="ModalTitle">
                        Send
                    </div>

                    <Warning message={'Do not send to Ethereum/ERC20 addresses.'}
                             learnMoreHref={Urls.PreventingLostTokens}
                             style={{marginBottom: 20}}
                    />

                    <SendTxForm onSubmit={this.onSubmit}
                    />

                </div>
            </Modal>
        )
    }
}

