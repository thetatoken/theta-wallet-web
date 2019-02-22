import React from 'react'
import './ReceiveModal.css';
import _ from 'lodash';
import Modal from '../components/Modal'
import Wallet from '../services/Wallet'
import GhostButton from '../components/buttons/GhostButton'

export default class ReceiveModal extends React.Component {
    render() {
        let address = _.get(Wallet.getWallet(), ['address'], "0x");
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