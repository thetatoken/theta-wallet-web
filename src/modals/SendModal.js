import React from 'react'
import './SendModal.css';
import Modal from '../components/Modal'
import EthereumNetworkTxForm from '../components/EthereumNetworkTxForm'
import SendTxForm from '../components/transactions/SendTxForm'
import TokenTypes from "../constants/TokenTypes";
import Warning from "../components/Warning";
import {Urls} from "../constants/Urls";

export default class SendModal extends React.Component {
    render() {
        let tokenType = null; //this.props.tokenType;

        return (
            <Modal>
                <div className="SendModal">
                    <div className="SendModal__title">
                        Send
                    </div>

                    <Warning message={'Do not send to Ethereum/ERC20 addresses.'}
                             learnMoreHref={Urls.PreventingLostTokens}
                             style={{marginBottom: 20}}
                    />

                    <SendTxForm defaultTokenType={tokenType}/>

                </div>
            </Modal>
        )
    }
}

