import React from "react";
import './UnlockWalletPage.css';
import {connect} from 'react-redux'
import {Link} from "react-router-dom";
import GradientButton from '../components/buttons/GradientButton'
import Wallet from '../services/Wallet'
import { WalletUnlockStrategy } from '../services/Wallet'
import TabBarItem from "../components/TabBarItem";
import TabBar from "../components/TabBar";
import {unlockWallet} from "../state/actions/Wallet";

const classNames = require('classnames');

class UnlockWalletViaPrivateKey extends React.Component {
    constructor(){
        super();

        this.state = {
            privateKey: "",
            password: "",
            loading: false
        }
    }

    isValid(){
        return this.state.privateKey.length > 0 && this.state.password.length > 0;
    }

    handleChange(event){
        let name = event.target.name;
        let value = event.target.value;

        this.setState({[name]: value});
    }

    unlockWallet(){
        this.props.unlockWallet(WalletUnlockStrategy.PRIVATE_KEY, this.state.password, {privateKey: this.state.privateKey});

        this.setState({loading: false});
    }

    prepareForUnlock(){
        this.setState({loading: true});

        setTimeout(() => {
            this.unlockWallet()
        }, 1500);
    }

    render() {
        let isDisabled = (this.state.loading || this.isValid() === false);

        return (
            <div className="UnlockWalletViaPrivateKey">
                <div className="UnlockWalletViaPrivateKey__title">
                    Please enter your private key
                </div>

                <textarea className="UnlockWalletViaPrivateKey__private-key"
                          name="privateKey"
                          value={this.state.privateKey}
                          onChange={this.handleChange.bind(this)}
                />

                <div className="UnlockWalletViaPrivateKey__private-key-instructions">
                    Please enter your private key in HEX format.
                </div>

                <input className="UnlockWalletViaPrivateKey__password-input"
                       placeholder="Enter temporary session password"
                       name="password"
                       type="password"
                       value={this.state.password}
                       ref={this.passwordInput}
                       onChange={this.handleChange.bind(this)}
                />

                <div className="UnlockWalletViaPrivateKey__footer">
                    <GradientButton title="Unlock Wallet"
                                    loading={this.state.loading}
                                    onClick={this.prepareForUnlock.bind(this)}
                                    disabled={isDisabled}
                    />
                </div>
            </div>
        );
    }
}

class UnlockWalletViaMnemonicPhrase extends React.Component {
    constructor(){
        super();

        this.state = {
            mnemonic: "",
            password: "",
            loading: false
        }
    }

    isValid(){
        return this.state.mnemonic.length > 0 && this.state.password.length > 0;
    }

    handleChange(event){
        let name = event.target.name;
        let value = event.target.value;

        this.setState({[name]: value});
    }

    unlockWallet(){
        this.props.unlockWallet(WalletUnlockStrategy.MNEMONIC_PHRASE, this.state.password, {mnemonic: this.state.mnemonic});

        this.setState({loading: false});
    }

    prepareForUnlock(){
        this.setState({loading: true});

        setTimeout(() => {
            this.unlockWallet()
        }, 1500);
    }

    render() {
        let isDisabled = (this.state.loading || this.isValid() === false);

        return (
            <div className="UnlockWalletViaMnemonicPhrase">
                <div className="UnlockWalletViaMnemonicPhrase__title">
                    Please enter your 12 word phrase
                </div>

                <textarea className="UnlockWalletViaMnemonicPhrase__mnemonic"
                          name="mnemonic"
                          value={this.state.mnemonic}
                          onChange={this.handleChange.bind(this)}
                />

                <div className="UnlockWalletViaMnemonicPhrase__mnemonic-instructions">
                    Please separate each Mnemonic Phrase with a space.
                </div>

                <input className="UnlockWalletViaMnemonicPhrase__password-input"
                       placeholder="Enter temporary session password"
                       name="password"
                       type="password"
                       value={this.state.password}
                       ref={this.passwordInput}
                       onChange={this.handleChange.bind(this)}
                />

                <div className="UnlockWalletViaMnemonicPhrase__footer">
                    <GradientButton title="Unlock Wallet"
                                    loading={this.state.loading}
                                    onClick={this.prepareForUnlock.bind(this)}
                                    disabled={isDisabled}
                    />
                </div>
            </div>
        );
    }
}

class UnlockWalletViaKeystoreFile extends React.Component {
    constructor(){
        super();

        this.fileInput = React.createRef();
        this.passwordInput = React.createRef();


        this.state = {
            password: "",
            loading: false
        }
    }

    isValid(){
        let keystoreFile = this.keystoreFile();

        return keystoreFile !== null && this.state.password.length > 0;
    }

    keystoreFile(){
        let fileInput = this.fileInput.current;

        return (fileInput ? fileInput.files[0] : null);
    }

    handleChange(event){
        let name = event.target.name;
        let value = event.target.value;

        this.setState({[name]: value});

        if(name === "file"){
            this.passwordInput.current.focus();
        }
    }

    unlockWallet(keystore){
        this.props.unlockWallet(WalletUnlockStrategy.KEYSTORE_FILE, this.state.password, {keystore: keystore});

        this.setState({loading: false});
    }

    onKeystoreFileLoad(e){
        let keystoreData = e.target.result;

        setTimeout(() => {
            this.unlockWallet(keystoreData)
        }, 1500);
    }

    prepareForUnlock(){
        let fileToLoad = this.keystoreFile();
        let fileReader = new FileReader();

        this.setState({loading: true});

        fileReader.onload = this.onKeystoreFileLoad.bind(this);
        fileReader.readAsText(fileToLoad, "UTF-8");
    }

    render() {
        let keystoreFile = this.keystoreFile();
        let fileInputClassName = classNames("UnlockWalletViaKeystoreFile__file-input", {
            "UnlockWalletViaKeystoreFile__file-input--has-file": (keystoreFile !== null)
        });
        let isDisabled = (this.state.loading || this.isValid() === false);

        return (
            <div className="UnlockWalletViaKeystoreFile">
                <div className="UnlockWalletViaKeystoreFile__title">
                    Please select your keystore file
                </div>

                <label htmlFor="file-upload" className={fileInputClassName}>
                    <input id="file-upload"
                           type="file"
                           name="file"
                           ref={this.fileInput}
                           onChange={this.handleChange.bind(this)}
                    />
                    Upload Keystore File
                </label>

                <input className="UnlockWalletViaKeystoreFile__password-input"
                       placeholder="Enter your wallet password"
                       name="password"
                       type="password"
                       value={this.state.password}
                       ref={this.passwordInput}
                       onChange={this.handleChange.bind(this)}
                />

                <div className="UnlockWalletViaKeystoreFile__footer">
                    <GradientButton title="Unlock Wallet"
                                    loading={this.state.loading}
                                    onClick={this.prepareForUnlock.bind(this)}
                                    disabled={isDisabled}
                    />
                </div>
            </div>
        );
    }
}

class UnlockWalletCard extends React.Component {
    render() {
        let unlockWalletStrategyContent = null;

        if(this.props.unlockStrategy === WalletUnlockStrategy.KEYSTORE_FILE){
            unlockWalletStrategyContent = (
                <UnlockWalletViaKeystoreFile unlockWallet={this.props.unlockWallet}/>
            );
        }
        else if(this.props.unlockStrategy === WalletUnlockStrategy.MNEMONIC_PHRASE){
            unlockWalletStrategyContent = (
                <UnlockWalletViaMnemonicPhrase unlockWallet={this.props.unlockWallet}/>
            );
        }
        else if(this.props.unlockStrategy === WalletUnlockStrategy.PRIVATE_KEY){
            unlockWalletStrategyContent = (
                <UnlockWalletViaPrivateKey unlockWallet={this.props.unlockWallet}/>
            );
        }

        return (
            <div className="UnlockWalletCard">
                <div className="UnlockWalletCard__content">
                    <div className="UnlockWalletCard__header">
                        <TabBar centered={true}
                                className="UnlockWalletCard__tab-bar">
                            <TabBarItem
                                title="Keystore File"
                                href={"/unlock/" + WalletUnlockStrategy.KEYSTORE_FILE}
                            />
                            <TabBarItem
                                title="Mnemonic Phrase"
                                href={"/unlock/" + WalletUnlockStrategy.MNEMONIC_PHRASE}
                            />
                            <TabBarItem
                                title="Private Key"
                                href={"/unlock/" + WalletUnlockStrategy.PRIVATE_KEY}
                            />
                        </TabBar>
                    </div>

                    {unlockWalletStrategyContent}
                </div>
            </div>
        );
    }
}

export class UnlockWalletPage extends React.Component {
    constructor(){
        super();

        this.unlockWallet = this.unlockWallet.bind(this)
    }

    unlockWallet(strategy, password, data){
        this.props.dispatch(unlockWallet(strategy, password, data));
    }

    render() {
        let unlockStrategy = this.props.match.params.unlockStrategy;

        return (
            <div className="UnlockWalletPage">
                <div className="UnlockWalletPage__wrapper">
                    <div className="UnlockWalletPage__title">
                        Unlock Your Wallet
                    </div>

                    <UnlockWalletCard unlockStrategy={unlockStrategy}
                                      unlockWallet={this.unlockWallet.bind(this)}
                    />

                    <div className="UnlockWalletPage__subtitle">
                        <span>Don't have a wallet?</span>
                        <Link to="/create">Create Wallet</Link>
                    </div>
                </div>
            </div>
        );
    }
}

const mapStateToProps = state => {
    return {

    };
};

export default connect(mapStateToProps)(UnlockWalletPage);