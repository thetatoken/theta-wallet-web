import React from "react";
import './CreateWalletPage.css';
import {Link} from "react-router-dom";
import GradientButton from '../components/buttons/GradientButton'
import Wallet from '../services/Wallet'
import TemporaryState from '../services/TemporaryState'
import { downloadFile } from '../utils/Utils'
import {store} from "../state";
import {showModal} from "../state/actions/ui";
import ModalTypes from "../constants/ModalTypes";

class WalletCreationCompleteCard extends React.Component {
    render() {
        return (
            <div className="WalletCreationCompleteCard">
                <div className="WalletCreationCompleteCard__content">
                    <div className="WalletCreationCompleteCard__header"/>

                    <div className="WalletCreationCompleteCard__success">
                        <img className="WalletCreationCompleteCard__icon" src={'/img/icons/wallet-success@2x.png'}/>

                        <div className="WalletCreationCompleteCard__success-title">
                            You're ready!
                        </div>
                        <div className="WalletCreationCompleteCard__success-body">
                            You are now ready to use your new Theta wallet.
                        </div>
                    </div>

                    <div className="WalletCreationCompleteCard__footer">
                        <GradientButton title="Unlock Wallet"
                                        href="/unlock"
                        />
                    </div>
                </div>
            </div>
        );
    }
}

class MnemonicCard extends React.Component {
    constructor(){
        super();

        this.showPrivateKey = this.showPrivateKey.bind(this);
    }

    showPrivateKey(){
        store.dispatch(showModal({
            type: ModalTypes.PRIVATE_KEY,
            props: {
                privateKey: this.props.wallet.privateKey
            }
        }));
    }

    render() {
        let { mnemonic, privateKey } = this.props.wallet;
        const phrase = mnemonic.phrase;

        return (
            <div className="MnemonicCard">
                <div className="MnemonicCard__content">
                    <div className="MnemonicCard__header">
                        <div className="MnemonicCard__title">
                            Mnemonic Phrase
                        </div>
                        <div className="MnemonicWarningCard__subtitle">
                            12 words which allow you to recover your wallet.
                        </div>
                    </div>

                    <div className="MnemonicCard__body">
                        <div className="MnemonicCard__instructions">
                            Back up the text below on paper and keep it somewhere secret and safe. It will not be shown again.
                        </div>

                        <div className="MnemonicCard__phrase-container">
                            <p>
                                { phrase }
                            </p>
                        </div>

                        <a className="MnemonicCard__view-private-key"
                           onClick={this.showPrivateKey}
                        >View my Private Key</a>
                    </div>

                    <div className="MnemonicCard__footer">
                        <GradientButton title="Continue"
                                        onClick={this.props.onContinue}
                        />
                    </div>
                </div>
            </div>
        );
    }
}

class MnemonicWarningCard extends React.Component {
    render() {
        return (
            <div className="MnemonicWarningCard">
                <div className="MnemonicWarningCard__content">
                    <div className="MnemonicWarningCard__header">
                        <div className="MnemonicWarningCard__title">
                            Mnemonic Phrase
                        </div>
                        <div className="MnemonicWarningCard__subtitle">
                            12 words which allow you to recover your wallet.
                        </div>
                    </div>

                    <img className="MnemonicWarningCard__icon" src={'/img/icons/word-blocks@2x.png'}/>

                    <div className="MnemonicWarningCard__warning">
                        <div className="MnemonicWarningCard__warning-title">
                            Warning!
                        </div>
                        <div className="MnemonicWarningCard__warning-body">
                            We are about to show your Mnemonic phrase. Please ensure no one can see your screen before you continue.
                        </div>
                    </div>



                    <div className="MnemonicWarningCard__footer">
                        <GradientButton title="Continue"
                                        onClick={this.props.onContinue}
                        />
                    </div>
                </div>
            </div>
        );
    }
}

//TODO rename to create keystore card
class ChoosePasswordCard extends React.Component {
    constructor(){
        super();

        this.state = {
            password: '',
            passwordConfirmation: '',
            agreedToTerms: false
        }
    }

    handleChange(event) {
        let name = event.target.name;
        let type = event.target.type;
        let value = (type === "password" ? event.target.value : event.target.checked);

        this.setState({[name]: value}, this.validate);
    }

    createWallet(){
        let data = Wallet.createWallet(this.state.password);

        if(data){
            TemporaryState.setWalletData(data);

            downloadFile(data.wallet.address + '.keystore', JSON.stringify(data.keystore));

            //Sometimes the browser pauses when downloading a file, to reduce jitters add a pause
            setTimeout(() => {
                this.setState({loading: false});

                this.props.onContinue();
            }, 500);
        }
    }

    prepareForWalletCreation(){
        this.setState({loading: true});

        setTimeout(() => {
            this.createWallet();
        }, 1000);
    }

    isValid(){
        return (
            this.state.agreedToTerms === true &&
            this.state.password.length > 0 &&
            this.state.password === this.state.passwordConfirmation);
    }

    validate(){
        if(this.state.password.length > 0 &&
            this.state.passwordConfirmation.length > 0 &&
            this.state.password !== this.state.passwordConfirmation){
            this.setState({error: "Your passwords do not match"});
        }
        else{
            this.setState({error: ""});
        }
    }

    render() {
        return (
            <div className="ChoosePasswordCard">
                <div className="ChoosePasswordCard__content">
                    <div className="ChoosePasswordCard__header">
                        <div className="ChoosePasswordCard__title">
                            Create Keystore
                        </div>
                        <div className="ChoosePasswordCard__subtitle">
                            This password will encrypt your private key.
                        </div>
                    </div>
                    <div className="ChoosePasswordCard__inputs">
                        <input className="ChoosePasswordCard__password-input"
                               placeholder="Set a New Password"
                               name="password"
                               type="password"
                               value={this.state.password}
                               onChange={this.handleChange.bind(this)}
                        />
                        <input className="ChoosePasswordCard__password-input"
                               placeholder="Re-enter Password"
                               name="passwordConfirmation"
                               type="password"
                               value={this.state.passwordConfirmation}
                               onChange={this.handleChange.bind(this)}
                        />
                    </div>
                    <div className="ChoosePasswordCard__error">
                        {this.state.error}
                    </div>
                    <div className="ChoosePasswordCard__message-wrapper">
                        <input id="agreedToTerms"
                               type="checkbox"
                               name="agreedToTerms"
                               checked={this.state.agreedToTerms}
                               onChange={this.handleChange.bind(this)}/>
                        <label className="ChoosePasswordCard__message"
                               htmlFor="agreedToTerms">
                            <span>
                                I understand that Theta cannot recover or reset my password or the keystore file.
                                I will make a backup of the keystore file / password, keep them secret, complete all
                                wallet creation steps.
                            </span>
                        </label>
                    </div>

                    <div className="ChoosePasswordCard__footer">
                        <GradientButton title="Download Keystore"
                                        onClick={this.prepareForWalletCreation.bind(this)}
                                        loading={this.state.loading}
                                        disabled={(this.state.loading || this.isValid() === false)}
                        />
                    </div>
                </div>
            </div>
        );
    }
}

const CREATE_WALLET_STEP_CREATE_KEYSTORE = 0;
const CREATE_WALLET_STEP_MNEMONIC_WARNING = 1;
const CREATE_WALLET_STEP_MNEMONIC = 2;
const CREATE_WALLET_STEP_COMPLETE = 3;

class CreateWalletPage extends React.Component {
    constructor(){
        super();

        this.state = {
            currentStep: CREATE_WALLET_STEP_CREATE_KEYSTORE
        }
    }

    continue(){
        this.setState({ currentStep: this.state.currentStep + 1 });
    }

    render() {
        let walletData = TemporaryState.getWalletData();
        let card = null;
        let footer = null;
        let pageTitle = (this.state.currentStep === CREATE_WALLET_STEP_COMPLETE ? "" : "Create New Wallet");

        if(this.state.currentStep === CREATE_WALLET_STEP_CREATE_KEYSTORE){
            card = (
                <ChoosePasswordCard onContinue={this.continue.bind(this)}/>
            );
        }
        else if(this.state.currentStep === CREATE_WALLET_STEP_MNEMONIC_WARNING){
            card = (
                <MnemonicWarningCard onContinue={this.continue.bind(this)}/>
            );
        }
        else if(this.state.currentStep === CREATE_WALLET_STEP_MNEMONIC){
            card = (
                <MnemonicCard onContinue={this.continue.bind(this)}
                              wallet={walletData.wallet}
                />
            );
        }
        else if(this.state.currentStep === CREATE_WALLET_STEP_COMPLETE){
            card = (
                <WalletCreationCompleteCard onContinue={this.continue.bind(this)}/>
            );
        }


        if(this.state.currentStep !== CREATE_WALLET_STEP_COMPLETE){
            footer = (
                <div className="CreateWalletPage__subtitle">
                    <span>Already have a wallet?</span>
                    <Link to="/unlock">Unlock Wallet</Link>
                </div>
            );
        }

        return (
            <div className="CreateWalletPage">
                <div className="CreateWalletPage__wrapper">
                    <div className="CreateWalletPage__title">
                        {pageTitle}
                    </div>

                    {card}

                    {footer}
                </div>
            </div>
        );
    }
}

export default CreateWalletPage;
