import React from 'react'
import './SendModal.css';
import Modal from '../components/Modal'
import EthereumNetworkTxForm from '../components/EthereumNetworkTxForm'
import ThetaNetworkTxForm from '../components/ThetaNetworkTxForm'
import Config from '../Config'
import TokenTypes from "../constants/TokenTypes";

export default class SendModal extends React.Component {
    render() {
        let tokenType = (this.props.tokenType || (Config.isThetaNetworkLive ? TokenTypes.THETA : TokenTypes.ERC20_THETA));
        let showThetaForm = (tokenType === TokenTypes.THETA || tokenType === TokenTypes.THETA_FUEL);
        let form = null;

        if(showThetaForm){
            form = <ThetaNetworkTxForm defaultTokenType={tokenType}/>;
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

                    { form }

                </div>
            </Modal>
        )
    }
}