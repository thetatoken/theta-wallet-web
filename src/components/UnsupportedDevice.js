import React from "react";
import './UnsupportedDevice.css';

class UnsupportedDevice extends React.Component {
    render() {
        return (
            <div className="UnsupportedDevice">
                <div className="UnsupportedDevice__content">
                    <img className="UnsupportedDevice__logo" src={'/img/logo/theta_wallet_logo@2x.png'}/>
                    <div className="UnsupportedDevice__title">
                        This wallet is designed for desktop. Try our mobile wallets!
                    </div>
                    <a className="UnsupportedDevice__app-store-badge"
                       href="https://itunes.apple.com/app/theta-wallet/id1451094550?mt=8"
                       target="_blank"
                    >
                        <img src="/img/badges/app-store@2x.png"/>
                    </a>
                    <a className="UnsupportedDevice__app-store-badge"
                       href="https://play.google.com/store/apps/details?id=org.theta.wallet"
                       target="_blank"
                    >
                        <img src="/img/badges/google-play@2x.png"/>
                    </a>
                </div>
            </div>
        );
    }
}

export default UnsupportedDevice;
