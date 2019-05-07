import React from 'react'
import './ColdWalletSelectorModal.css';
import Modal from '../components/Modal';
import GradientButton from "../components/buttons/GradientButton";
import { WalletUnlockStrategy } from '../services/Wallet'
import { NumPathsPerPage } from '../services/Wallet'
import {unlockWallet} from "../state/actions/Wallet";
import {store} from "../state";
import {hideModal} from "../state/actions/Modals";
// import {getHardwareWalletAddresses} from "../state/actions/Wallet";

export default class ColdWalletSelectorModal extends React.Component {
    constructor(props){
        super(props);

        this.state = {
            page: props.page,
            addressChosen: null,
            pathChosen: null,
        };

        this.handleUnlockWalletClick = this.handleUnlockWalletClick.bind(this);
        this.handlePrevPageClick = this.handlePrevPageClick.bind(this);
        this.handleNextPageClick = this.handleNextPageClick.bind(this);
    }

    isValid(){
        return this.state.addressChosen != null;
    }

    handleUnlockWalletClick(){
        store.dispatch(unlockWallet(WalletUnlockStrategy.COLD_WALLET, null, {hardware: this.props.hardware, address: this.state.addressChosen, path: this.state.pathChosen}));
        store.dispatch(hideModal());
    }

    handleAddressClick(address){
        this.setState({addressChosen: address.address})
        this.setState({pathChosen: address.serializedPath})
    }

    handlePrevPageClick(){
        this.setState({page: this.state.page - 1});
    }

    handleNextPageClick(){
        this.setState({page: this.state.page + 1});
    }

    render() {
        let isDisabled = (this.state.loading || this.isValid() === false);

        let renderDataRow = (address, balance) =>{
            return (
                // address.serializedPath
                <div className="ColdWalletSelectorModal__row" key={address.serializedPath} onClick={() => {this.handleAddressClick(address)}} >
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
            
            for(var i = 0; i < NumPathsPerPage; i++){
                addressRows.push( renderDataRow(addresses[this.state.page * NumPathsPerPage + i], 'loading...') )
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
                        <div className={this.state.page <= 0 ? "ColdWalletSelectorModal__footer-prev-hidden" : "ColdWalletSelectorModal__footer-prev"} onClick={this.handlePrevPageClick}>
                            { '< Previous' }
                        </div>
                        <div className={(this.state.page + 1) * NumPathsPerPage >= this.props.addresses.length ? "ColdWalletSelectorModal__footer-next-hidden" : "ColdWalletSelectorModal__footer-next"} onClick={this.handleNextPageClick}>
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