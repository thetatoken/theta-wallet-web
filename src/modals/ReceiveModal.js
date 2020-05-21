import React from 'react'
import './ReceiveModal.css';
import Modal from '../components/Modal'
import Wallet from '../services/Wallet'
import GhostButton from '../components/buttons/GhostButton'
import {copyToClipboard} from "../utils/Utils";
import Alerts from '../services/Alerts'
import {getNetworkName} from "../constants/Networks";
import Theta from "../services/Theta";
import Api from "../services/Api";
import _ from 'lodash';

export default class ReceiveModal extends React.Component {
    constructor(props){
        super(props);

        this.state = {
            isLoading: false
        };
    }

    handleCopyAddressClick = () => {
        let address = Wallet.getWalletAddress();

        copyToClipboard(address);

        Alerts.showSuccess("Your address has been copied");
    };

    handleFaucetClick = async () => {
        this.setState({
            isLoading: true
        });

        try {
            const response = await Api.callFaucet(Wallet.getWalletAddress(), Theta.getChainID());
            const responseJSON = await response.json();

            console.log("responseJSON == ");
            console.log(responseJSON);
            if(_.get(responseJSON, 'tx')){
                Alerts.showSuccess("Your TFUEL has been sent.");
            }
        }
        catch (e) {
            Alerts.showError("You have exceeded the faucet limit");
        }
        finally {
            this.setState({
                isLoading: false
            });
        }
    };

    render() {
        const {isLoading} = this.state;
        let address = Wallet.getWalletAddress();
        let qrCodeURL = `https://chart.googleapis.com/chart?chs=160x160&cht=qr&chl=${address}&choe=UTF-8&chld=L|0`;

        console.log("isLoading == " + isLoading);

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

                    <div className="ReceiveModal__faucet">
                        <GhostButton title="Faucet"
                                     disabled={isLoading}
                                     loading={isLoading}
                                     className={"ReceiveModal__faucet-button"}
                                     iconUrl="/img/tab-bar/receive@2x.png"
                                     onClick={this.handleFaucetClick}
                        />
                        <div className="ReceiveModal__faucet-message">
                            Receive a small amount of TFUEL on { getNetworkName(Theta.getChainID()) }
                        </div>
                    </div>
                </div>
            </Modal>
        )
    }
}
