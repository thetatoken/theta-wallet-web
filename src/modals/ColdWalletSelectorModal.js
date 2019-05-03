import React from 'react'
import './ColdWalletSelectorModal.css';
import Modal from '../components/Modal';
import GradientButton from "../components/buttons/GradientButton";
import { WalletUnlockStrategy } from '../services/Wallet'
import {unlockWallet} from "../state/actions/Wallet";
import {store} from "../state";
import {hideModal} from "../state/actions/Modals";

export default class ColdWalletSelectorModal extends React.Component {
    constructor(){
        super();

        this.state = {
            page: 0,
            addressChosen: null,
        };

        this.handleUnlockWalletClick = this.handleUnlockWalletClick.bind(this);
    }

    isValid(){
        return this.state.page >= 0 && this.state.addressChosen != null;
    }

    handleUnlockWalletClick(){
        store.dispatch(unlockWallet(WalletUnlockStrategy.COLD_WALLET, null, {hardware: this.props.hardware, address: this.state.addressChosen}));
        store.dispatch(hideModal());
    }

    handleAddressClick(address){
        console.log("=========== addr: ", address)
        this.setState({addressChosen: address})
    }

    render() {
        let isDisabled = (this.state.loading || this.isValid() === false);

        let renderDataRow = (address, balance) =>{
            return (
                // address.serializedPath
                <div className="ColdWalletSelectorModal__row" key={address.serializedPath} onClick={() => {this.handleAddressClick(address.address)}} >
                    <div className="ColdWalletSelectorModal__row-address">
                        {address.address}
                    </div>
                    <div className="ColdWalletSelectorModal__row-balance">
                        {balance}
                    </div>
                </div>
            );
        };

        let addressRows = null;

        if(this.props.addresses){
            let addresses = this.props.addresses;
            addressRows = []
            for(var i = 0; i < addresses.length; i++){
                addressRows.push( renderDataRow(addresses[i], 'loading...') )
            }
            addressRows = (
                <React.Fragment>
                    { addressRows }
                </React.Fragment>
            );
        }

        return (
            <Modal>
                <div className="ColdWalletSelectorModal">
                    <div className="ColdWalletSelectorModal__title">
                        Select an Address
                    </div>

                    <div className="ColdWalletSelectorModal__header">
                        <div className="ColdWalletSelectorModal__header-address">
                            address
                        </div>
                        <div className="ColdWalletSelectorModal__header-balance">
                            balance
                        </div>
                    </div>

                    <div className="ColdWalletSelectorModal__rows">
                        { addressRows }
                    </div>

                    <div className="ColdWalletSelectorModal__footer">
                        <div className="ColdWalletSelectorModal__footer-prev">
                            { '< Previous' }
                        </div>
                        <div className="ColdWalletSelectorModal__footer-next">
                        { 'Next >' }
                        </div>
                    </div>

                    <GradientButton title="Access My Wallet"
                                    disabled={isDisabled}
                                    onClick={this.handleUnlockWalletClick}
                                    loading={this.state.loading}
                    />

                </div>
            </Modal>
        )
    }
}