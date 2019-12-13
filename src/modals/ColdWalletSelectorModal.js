import React from 'react'
import './ColdWalletSelectorModal.css';
import Modal from '../components/Modal';
import GradientButton from "../components/buttons/GradientButton";
import { WalletUnlockStrategy } from '../services/Wallet'
import { NumPathsPerPage } from '../services/Wallet'
import {unlockWallet} from "../state/actions/Wallet";
import {store} from "../state";
import {hideModal} from "../state/actions/Modals";
import MDSpinner from "react-md-spinner";
import Api from "../services/Api";
import Config from "../Config";
import {zipMap} from "../utils/Utils";
import Wallet from "../services/Wallet";
import Theta from "../services/Theta";

export class ColdWalletAddressRow extends React.Component {
    constructor(props){
        super(props);

        this.state = {
            tfuelWei: null,
            thetaWei: null,
            isLoading: true
        };
    }

    async fetchBalances(address){
        let response = await Api.fetchWallet(address, {network: Theta.getChainID()});

        if(response){
            let responseJSON = await response.json();
            let { balances } = responseJSON;
            let balancesByType = null;

            if(balances){
                balancesByType = zipMap(balances.map(({ type }) => type), balances.map(({ value }) => value));
            }
            else{
                balancesByType = {
                    theta: 0,
                    tfuel: 0
                };
            }

            this.setState({
                balances: balancesByType,
                isLoading: false
            });
        }
    }

    componentDidMount(){
        let {address} = this.props;

        this.fetchBalances(address);
    }

    render() {
        let {address, serializedPath, isSelected, onClick} = this.props;
        let { balances, isLoading } = this.state;

        let balanceView = null;

        if(isLoading){
            balanceView = <MDSpinner singleColor="#ffffff"/>
        }
        else{
            balanceView = (
                <React.Fragment>
                    <div className="ColdWalletSelectorModal__amount-container">
                        <div className="ColdWalletSelectorModal__amount">{balances.theta}</div>
                        <img className="ColdWalletSelectorModal__amount-icon"
                             src="/img/tokens/theta_large@2x.png"
                        />
                    </div>
                    <div className="ColdWalletSelectorModal__amount-container">
                        <div className="ColdWalletSelectorModal__amount">{balances.tfuel}</div>
                        <img className="ColdWalletSelectorModal__amount-icon"
                             src="/img/tokens/tfuel_large@2x.png"
                        />
                    </div>
                </React.Fragment>
            );
        }

        return (
            <a className="ColdWalletSelectorModal__row"
                 key={serializedPath}
                 onClick={onClick} >
                <img className="ColdWalletSelectorModal__checkmark-icon"
                     src={isSelected ? "/img/icons/checkmark-green@2x.png" : "/img/icons/checkmark-transparent@2x.png"}
                />
                <div className="ColdWalletSelectorModal__row-address">
                    {address}
                </div>

                <div className="ColdWalletSelectorModal__row-balance">
                    {balanceView}
                </div>
            </a>
        )
    }
}

export default class ColdWalletSelectorModal extends React.Component {
    constructor(props){
        super(props);

        this.state = {
            page: props.page,
            addressChosen: null,
            pathChosen: null,
            addresses: props.addresses,
            isLoading: false
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
        if(address.address === this.state.addressChosen){
            //Unselect this address

            this.setState({
                addressChosen: null,
                pathChosen: null
            });
        }
        else{
            //Select this address

            this.setState({
                addressChosen: address.address,
                pathChosen: address.serializedPath
            });
        }

    }

    handlePrevPageClick(){
        this.setState({
            page: this.state.page - 1,
            addressChosen: null,
            pathChosen: null
        });
    }

    async handleNextPageClick(){
        let nextPage = this.state.page + 1;

        this.setState({
            page: nextPage,
            addressChosen: null,
            pathChosen: null
        });

        if(this.props.hardware === "ledger"){
            //If the page has not been loaded yet...load it

            if(this.state.addresses.length < ((nextPage + 1) * 5)){
                this.setState({isLoading: true});

                let { hardware, derivationPath } = this.props;
                let addresses = await Wallet.getHardwareWalletAddresses(hardware, nextPage, derivationPath);


                this.setState({
                    addresses: [...this.state.addresses, ...addresses],
                    isLoading: false
                });
            }
        }
    }

    render() {
        let isDisabled = (this.state.loading || this.isValid() === false);
        let {isLoading} = this.state;

        let renderDataRow = (addressInfo) => {
            if(addressInfo){
                return (
                    <ColdWalletAddressRow address={addressInfo.address}
                                          serializedPath={addressInfo.serializedPath}
                                          key={addressInfo.address}
                                          isSelected={this.state.addressChosen === addressInfo.address}
                                          onClick={() => {this.handleAddressClick(addressInfo)}}>
                    </ColdWalletAddressRow>
                );
            }
        };

        let addressRows = null;

        if(this.state.addresses){
            let addresses = this.state.addresses;
            addressRows = [];

            for(var i = 0; i < NumPathsPerPage; i++){
                let addressInfo = addresses[this.state.page * NumPathsPerPage + i];

                addressRows.push( renderDataRow(addressInfo) );
            }

            addressRows = (
                <React.Fragment>
                    { addressRows }
                </React.Fragment>
            );
        }

        let showPrevButton = this.state.page > 0;
        let showNextButton = true;
        let prevButton = false;
        let nextButton = false;

        if(this.props.hardware === "trezor"){
            showNextButton = (this.state.page + 1) * NumPathsPerPage < this.state.addresses.length;
        }
        else if(this.props.hardware === "ledger"){
            showNextButton = true;
        }

        if(showPrevButton && isLoading === false){
            prevButton = (
                <a className="ColdWalletSelectorModal__footer-button"
                   onClick={this.handlePrevPageClick}>
                    { '< Previous' }
                </a>
            );
        }
        else{
            prevButton = (
                <div/>
            );
        }

        if(showNextButton && isLoading === false){
            nextButton = (
                <a className="ColdWalletSelectorModal__footer-button"
                   onClick={this.handleNextPageClick}>
                    { 'Next >' }
                </a>
            );
        }
        else{
            nextButton = (
                <div/>
            );
        }

        return (
            <Modal>
                <div className="ColdWalletSelectorModal">
                    <div className="ColdWalletSelectorModal__title">
                        {
                            (isLoading ? "Loading Addresses" : "Select an Address")
                        }
                    </div>

                    <div className="ColdWalletSelectorModal__rows">
                        { addressRows }
                    </div>

                    <div className="ColdWalletSelectorModal__footer">
                        {prevButton}
                        {nextButton}
                    </div>

                    <GradientButton title="Access My Wallet"
                                    disabled={isDisabled}
                                    onClick={this.handleUnlockWalletClick}
                                    loading={this.state.isLoading}
                    />

                </div>
            </Modal>
        )
    }
}
