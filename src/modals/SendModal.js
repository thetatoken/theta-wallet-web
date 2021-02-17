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
        let tokenType = (this.props.tokenType || TokenTypes.THETA);
        let showThetaForm = (tokenType === TokenTypes.THETA || tokenType === TokenTypes.THETA_FUEL);
        let form = null;

        if(showThetaForm){
            form = <SendTxForm defaultTokenType={tokenType}/>;
        }
        else{
            form = <EthereumNetworkTxForm defaultTokenType={tokenType}/>;
        }

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

                    { form }

                </div>
            </Modal>
        )
    }
}

