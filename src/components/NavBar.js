import _ from 'lodash';
import {connect} from 'react-redux'
import React, { useState, useEffect } from "react";
import './NavBar.css';
import Wallet from "../services/Wallet";
import { store } from '../state';
import {logout} from "../state/actions/Wallet";
import {copyToClipboard} from "../utils/Utils";
import Alerts from "../services/Alerts";
import {showModal} from "../state/actions/ui";
import ModalTypes from "../constants/ModalTypes";
import {getNetworkName} from "../constants/Networks";
import NetworkSelector from "./NetworkSelector";
import {NavLink} from "react-router-dom";
import config from "../Config";
import tns from "../libs/tns"
import { useSettings } from "./SettingContext";

const classNames = require('classnames');

const NavBar = () => {
    const { tnsEnable } = useSettings(); // Access tnsEnable from useSettings
    const [tnsName, setTnsName] = useState(false);

    useEffect(() => {
        const fetchTnsName = async () => {
          let address = Wallet.getWalletAddress();
          if (address) {
            const name = await tns.getDomainName(address);
            setTnsName(name);
          }
        };
    
        fetchTnsName();
    }, [tnsEnable]); // Update tnsName when tnsEnable changes

    const logout = () => {
        store.dispatch(logout());
    }

    const copyAddress = () => {
        let address = Wallet.getWalletAddress();

        copyToClipboard(address);

        Alerts.showSuccess("Your address has been copied");
    }

    const onNetworkBadgeClick = () => {
        let address = Wallet.getWalletAddress();

        if(address){
            alert("You cannot change networks while a wallet is unlocked.")
        }
        else{
            store.dispatch(showModal({
                type: ModalTypes.NETWORK_SELECTOR,
            }));
        }
    };

    const renderAccountIfNeeded = () => {
        let address = Wallet.getWalletAddress();

        if(address && !config.isEmbedMode){
            return (
                <div className="NavBar__account">
                    <div className="NavBar__wallet">
                        <div className="NavBar__wallet-title">
                            My Wallet:
                        </div>
                        <div className="NavBar__wallet-address">
                            {tnsEnable ? <TNS addr={address} tnsName={tnsName} /> : address}
                        </div>
                        <a className="NavBar__wallet-copy-address-icon"
                           onClick={copyAddress}
                        >
                            <img src="/img/icons/copy@2x.png"/>
                        </a>
                    </div>
                    <div>
                        <a className="NavBar__support"
                           href="https://support.thetanetwork.org/hc/en-us"
                           target={'_blank'}
                        >
                            Support
                        </a>
                        <NavLink className="NavBar__settings"
                           to="/wallet/settings"
                        >
                            Settings
                        </NavLink>
                        <a className="NavBar__logout"
                           onClick={logout}>
                            Log out
                        </a>
                    </div>

                </div>
            );
        }
        else{
            return null;
        }
    }

    return (
        <div className={classNames("NavBar")}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <img className="NavBar__logo" src={"/img/logo/theta_wallet_logo@2x.png"} />
                <NetworkSelector />
            </div>
            {renderAccountIfNeeded()}
        </div>
    );
};
        
const TNS = ({addr, tnsName}) => {
    return (
        <div className="value tooltip">
            {tnsName &&
            <div className="tooltip--text">
                <p>
                    {tnsName}<br/>
                    ({addr})
                </p>
            </div>}
            {tnsName ? tnsName : addr ? addr : ''}
        </div>)
};

const mapStateToProps = (state, ownProps) => {
    return {
        network: state.wallet.network
    };
};

export default connect(mapStateToProps)(NavBar);
