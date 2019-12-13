import React from "react";
import './NavBar.css';
import Wallet from "../services/Wallet";
import { store } from '../state';
import {logout} from "../state/actions/Wallet";
import {copyToClipboard} from "../utils/Utils";
import Alerts from "../services/Alerts";
import {showModal} from "../state/actions/Modals";
import ModalTypes from "../constants/ModalTypes";

const classNames = require('classnames');

class NavBar extends React.Component {
    constructor(){
        super();

        this.logout = this.logout.bind(this);
        this.copyAddress = this.copyAddress.bind(this);
    }

    logout(){
        store.dispatch(logout());
    }

    copyAddress(){
        let address = Wallet.getWalletAddress();

        copyToClipboard(address);

        Alerts.showSuccess("Your address has been copied");
    }

    onNetworkBadgeClick = () => {
        store.dispatch(showModal({
            type: ModalTypes.NETWORK_SELECTOR,
        }));
    };

    renderAccountIfNeeded(){
        let address = Wallet.getWalletAddress();

        if(address){
            return (
                <div className="NavBar__account">
                    <div className="NavBar__wallet">
                        <div className="NavBar__wallet-title">
                            My Wallet:
                        </div>
                        <div className="NavBar__wallet-address">
                            {address}
                        </div>
                        <a className="NavBar__wallet-copy-address-icon"
                           onClick={this.copyAddress}
                        >
                            <img src="/img/icons/copy@2x.png"/>
                        </a>
                    </div>
                    <a className="NavBar__logout"
                       onClick={this.logout}>
                        Log out
                    </a>
                </div>
            );
        }
        else{
            return null;
        }
    }

    render() {
        return (
            <div className={classNames("NavBar", { 'NavBar--is-centered': this.props.centered })}>
                <div style={{display: 'flex', flexDirection: 'column'}}>
                    <img className="NavBar__logo" src={'/img/logo/theta_wallet_logo@2x.png'}/>
                    <a className={"NavBar__network-badge"}
                       onClick={this.onNetworkBadgeClick}
                    >Mainnet</a>
                </div>

                { this.renderAccountIfNeeded() }
            </div>
        );
    }
}

export default NavBar;
