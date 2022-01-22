import React from 'react'
import './ReceiveModal.css';
import Modal from '../components/Modal'
import Wallet from '../services/Wallet'
import GhostButton from '../components/buttons/GhostButton'
import {copyToClipboard} from "../utils/Utils";
import Alerts from '../services/Alerts'
import {getNetworkFaucetId, getNetworkName} from "../constants/Networks";
import Theta from "../services/Theta";
import Api from "../services/Api";
import _ from 'lodash';
import Warning from "../components/Warning";
import {Urls} from "../constants/Urls";
import Config from '../Config';
import TransportWebUSB from "@ledgerhq/hw-transport-webusb";
import TransportU2F from "@ledgerhq/hw-transport-u2f";
import Eth from "@ledgerhq/hw-app-eth";

export default class ReceiveModal extends React.Component {
    constructor(props) {
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

    handleDisplayOnLedgerClick = async () => {
        try {
            Alerts.showSuccess("Your address will be displayed on Ledger device");
            let transport;
            if(navigator.userAgent.toLowerCase().indexOf('firefox') > -1){
                transport = await TransportU2F.create();
            }
            else {
                transport = await TransportWebUSB.create();
            }
            var eth = new Eth(transport);
            await eth.getAddress(Wallet.getWalletPath(), true, false);
        } catch(e) {
            Alerts.showSuccess("Rejected, please refresh to change address");
        }
    };

    handleFaucetClick = async () => {
        this.setState({
            isLoading: true
        });

        try {
            const response = await Api.callFaucet(Wallet.getWalletAddress(), getNetworkFaucetId(Theta.getChainID()));
            const responseJSON = await response.json();

            if (_.get(responseJSON, 'message')) {
                Alerts.showSuccess("Your TFUEL has been sent.");
            }
        } catch (e) {
            Alerts.showError("You have exceeded the faucet limit");
        } finally {
            this.setState({
                isLoading: false
            });
        }
    };

    render() {
        const {isLoading} = this.state;
        let address = Wallet.getWalletAddress();
        let qrCodeURL = `https://chart.googleapis.com/chart?chs=160x160&cht=qr&chl=${address}&choe=UTF-8&chld=L|0`;
        let hasFaucet = (_.isNil(getNetworkFaucetId(Theta.getChainID())) === false);

        return (
            <Modal>
                <div className="ReceiveModal">
                    <div className="ModalTitle">
                        Receive
                    </div>
                    <Warning message={'Do not send ETH or ERC20 tokens to this address.'}
                             learnMoreHref={Urls.PreventingLostTokens}
                             style={{marginBottom: 30}}
                    />
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
                    {Wallet.getWalletHardware() ==='ledger' &&
                    <div className="ReceiveModal__buttons">
                        <GhostButton title="Display on Ledger"
                                     onClick={this.handleDisplayOnLedgerClick}
                        />
                    </div>
                     }
                    <img src={qrCodeURL}
                         className="ReceiveModal__qr"
                    />

                    {
                        hasFaucet && Config.faucetAvailable &&
                        <div className="ReceiveModal__faucet">
                            <GhostButton title="Faucet"
                                         disabled={isLoading}
                                         loading={isLoading}
                                         className={"ReceiveModal__faucet-button"}
                                         iconUrl="/img/tab-bar/receive@2x.png"
                                         onClick={this.handleFaucetClick}
                            />
                            <div className="ReceiveModal__faucet-message">
                                Receive a small amount of TFUEL on {getNetworkName(Theta.getChainID())}
                            </div>
                        </div>
                    }
                </div>
            </Modal>
        )
    }
}
