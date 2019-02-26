import React from 'react'
import './ReceiveModal.css';
import Modal from '../components/Modal'
import Wallet from '../services/Wallet'
import GhostButton from '../components/buttons/GhostButton'
import {copyToClipboard} from "../utils/Utils";

export default class ReceiveModal extends React.Component {
    constructor(){
        super();

        this.handleCopyAddressClick = this.handleCopyAddressClick.bind(this);
    }

    handleCopyAddressClick(){
        let address = Wallet.getWalletAddress();

        copyToClipboard(address);
    }

    render() {
        let address = Wallet.getWalletAddress();
        let qrCodeURL = `https://chart.googleapis.com/chart?chs=160x160&cht=qr&chl=${address}&choe=UTF-8&chld=L|0`;

        return (
            <Modal>
                <div className="ReceiveModal">
                    <div className="ReceiveModal__title">
                        Receive
                    </div>
                    <div className="ReceiveModal__public-address-title">
                        My Public Address
                    </div>
                    <div className="ReceiveModal__public-address">
                        {address}
                    </div>
                    <div className="ReceiveModal__buttons">
                        <GhostButton title="Copy"
                                     iconUrl="/img/icons/copy@2x.png"
                                     onClick={this.handleCopyAddressClick}
                        />
                    </div>

                    <img src={qrCodeURL}
                         className="ReceiveModal__qr"
                    />
                </div>
            </Modal>
        )
    }
}