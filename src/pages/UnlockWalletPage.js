import _ from 'lodash';
import React from "react";
import './UnlockWalletPage.css';
import {connect} from 'react-redux'
import {Link} from "react-router-dom";
import GradientButton from '../components/buttons/GradientButton'
import HardwareOptionButton from '../components/buttons/HardwareOptionButton';
import Wallet, { WalletUnlockStrategy, EthereumDerivationPath, EthereumLedgerLiveDerivationPath, EthereumOtherDerivationPath } from '../services/Wallet'
import TabBarItem from "../components/TabBarItem";
import TabBar from "../components/TabBar";
import {connectHardware, unlockHardwareWalletAccount, unlockWallet} from "../state/actions/Wallet";
import DropZone from '../components/DropZone'
import {formatNativeTokenAmountToLargestUnit, truncate} from "../utils/Utils";
import MDSpinner from "react-md-spinner";

const classNames = require('classnames');

class UnlockWalletViaPrivateKey extends React.Component {
    constructor(){
        super();

        this.state = {
            privateKey: "",
            password: "",
            loading: false
        };

        this.handleKeyPress = this.handleKeyPress.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleUnlockClick = this.handleUnlockClick.bind(this);
    }

    isValid(){
        return this.state.privateKey.length > 0 && this.state.password.length > 0;
    }

    handleChange(event){
        let name = event.target.name;
        let value = event.target.value;

        this.setState({[name]: value});
    }

    handleKeyPress(e) {
        if (e.key === 'Enter') {
            this.handleUnlockClick();
        }
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

    handleUnlockClick(){
        if(this.isValid()){
            this.prepareForUnlock();
        }
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
                          onChange={this.handleChange}
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
                       onChange={this.handleChange}
                       onKeyPress={this.handleKeyPress}
                />

                <div className="UnlockWalletCard__warning">
                    Before you enter your private key, we recommend you disconnect your device from the internet. You will be able to reconnect once your wallet is unlocked.
                </div>

                <div className="UnlockWalletViaPrivateKey__footer">
                    <GradientButton title="Unlock Wallet"
                                    loading={this.state.loading}
                                    onClick={this.handleUnlockClick}
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
        };

        this.handleKeyPress = this.handleKeyPress.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleUnlockClick = this.handleUnlockClick.bind(this);
    }

    isValid(){
        return this.state.mnemonic.length > 0 && this.state.password.length > 0;
    }

    handleChange(event){
        let name = event.target.name;
        let value = event.target.value;

        this.setState({[name]: value});
    }

    handleKeyPress(e) {
        if (e.key === 'Enter') {
            this.handleUnlockClick();
        }
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

    handleUnlockClick(){
        if(this.isValid()){
            this.prepareForUnlock();
        }
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
                          onChange={this.handleChange}
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
                       onChange={this.handleChange}
                       onKeyPress={this.handleKeyPress}
                />
                <div className="UnlockWalletCard__warning">
                    Before you enter your mnemonic phrase, we recommend you disconnect your device from the internet. You will be able to reconnect once your wallet is unlocked.
                </div>

                <div className="UnlockWalletViaMnemonicPhrase__footer">
                    <GradientButton title="Unlock Wallet"
                                    loading={this.state.loading}
                                    onClick={this.handleUnlockClick}
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

        this.droppedFile = null;


        this.state = {
            password: "",
            loading: false
        };

        this.handleKeyPress = this.handleKeyPress.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleUnlockClick = this.handleUnlockClick.bind(this);
        this.handleKeystoreFileDrop = this.handleKeystoreFileDrop.bind(this);
    }

    isValid(){
        let keystoreFile = this.keystoreFile();

        return keystoreFile !== null && this.state.password.length > 0;
    }

    keystoreFile(){
        let fileInput = this.fileInput.current;
        let fileFromInput = (fileInput && fileInput.files.length > 0 ? fileInput.files[0] : null);

        //If a dropped file is available, use it
        return (this.droppedFile ? this.droppedFile : fileFromInput);
    }

    handleChange(event){
        let name = event.target.name;
        let value = event.target.value;

        this.setState({[name]: value});

        if(name === "file"){
            //Clear the dropped file
            this.droppedFile = null;

            this.passwordInput.current.focus();
        }
    }

    handleKeyPress(e) {
        if (e.key === 'Enter') {
            this.handleUnlockClick();
        }
    }

    handleKeystoreFileDrop(file){
        this.droppedFile = file;

        this.setState({droppedFile: true}, () => {
            //To prevent lost focusing, focus after rendering
            this.passwordInput.current.focus();
        });
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

    handleUnlockClick(){
        if(this.isValid()){
            this.prepareForUnlock();
        }
    }

    render() {
        let keystoreFile = this.keystoreFile();
        let fileInputClassName = classNames("UnlockWalletViaKeystoreFile__file-input", {
            "UnlockWalletViaKeystoreFile__file-input--has-file": (keystoreFile !== null)
        });
        let isDisabled = (this.state.loading || this.isValid() === false);

        return (
            <div className="UnlockWalletViaKeystoreFile">
                <DropZone title="Drop keystore here"
                          icon="/img/icons/theta-file@2x.png"
                          onDrop={this.handleKeystoreFileDrop}/>
                <div className="UnlockWalletViaKeystoreFile__title">
                    Please select your keystore file
                </div>

                <label htmlFor="file-upload" className={fileInputClassName}>
                    <input id="file-upload"
                           type="file"
                           name="file"
                           ref={this.fileInput}
                           onChange={this.handleChange}/>
                    { ((keystoreFile === null) ? "Choose Keystore File" : "Keystore File Set") }
                </label>

                <input className="UnlockWalletViaKeystoreFile__password-input"
                       placeholder="Enter your wallet password"
                       name="password"
                       type="password"
                       value={this.state.password}
                       ref={this.passwordInput}
                       onChange={this.handleChange}
                       onKeyPress={this.handleKeyPress}
                />

                <div className="UnlockWalletViaKeystoreFile__footer">
                    <GradientButton title="Unlock Wallet"
                                    loading={this.state.loading}
                                    onClick={this.handleUnlockClick}
                                    disabled={isDisabled}
                    />
                </div>
            </div>
        );
    }
}

const HardwareAccountsList = ({hardwareAccounts, accounts, onClick}) => {
    const renderHardwareAccount = (account, balances) => {
        return (
            <a className="HardwareDeviceAccountRow"
               key={account.address}
               onClick={() => {
                   onClick(account)
               }}
            >
                <div className="HardwareDeviceAccountRow__address">
                    {truncate(account.address)}
                </div>
                <div className="HardwareDeviceAccountRow__balances">
                    {
                        !_.isEmpty(balances) &&
                        <React.Fragment>
                            <div className="HardwareDeviceAccountRow__balance">
                                <span>{formatNativeTokenAmountToLargestUnit(balances?.thetawei)}</span>
                                <img src="/img/tokens/theta_large@2x.png"/>
                            </div>
                            <div className="HardwareDeviceAccountRow__balance">
                                <span>{formatNativeTokenAmountToLargestUnit(balances?.tfuelwei)}</span>
                                <img src="/img/tokens/tfuel_large@2x.png"/>
                            </div>
                        </React.Fragment>
                    }
                    {
                        _.isEmpty(balances) &&
                        <MDSpinner singleColor="#ffffff" size={16}/>
                    }
                </div>
            </a>
        );
    }

    return (
        <div>
            {
                _.map(hardwareAccounts, (hardwareAccount) => {
                    const address = hardwareAccount.address;
                    const account = _.get(accounts, address, {});

                    return renderHardwareAccount(hardwareAccount, account.balances);
                })
            }
        </div>
    )

}

class UnlockWalletViaColdWalletUnconnected extends React.Component {
    constructor(){
        super();

        this.state = {
            hardware: '',
            loading: false,
            hardwareAccounts: [],
            derivationPath: EthereumDerivationPath
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleChooseHardwareClick = this.handleChooseHardwareClick.bind(this);
        this.handleTrezorClick = this.handleTrezorClick.bind(this);
        this.handleLedgerClick = this.handleLedgerClick.bind(this);
        this.handleDerivationPathChange = this.handleDerivationPathChange.bind(this);
    }

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        return true;
    }

    connectHardware = async (hardware, page, derivationPath) => {
        this.setState({
            loading: true,
        });

        try {
            const hardwareAccounts = await this.props.dispatch(connectHardware(hardware, page, derivationPath));

            this.setState({
                hardwareAccounts: hardwareAccounts
            });
        }
        catch (e) {

        }
        finally {
            setTimeout(() => {
                this.setState({loading: false});
            }, 1000);
        }
    }

    goToNextPage = () => {
        const {hardware, derivationPath} = this.state;

        // Increment page by 1
        this.connectHardware(hardware, 1, derivationPath);
    }

    goToPrevPage = () => {
        const {hardware, derivationPath} = this.state;

        // Decrement page by 1
        this.connectHardware(hardware, -1, derivationPath);
    }

    isValid(){
        return this.state.hardware.length > 0;
    }

    handleChange(event){
        let name = event.target.name;
        let value = event.target.value;

        this.setState({[name]: value});
    }

    handleChooseHardwareClick(){
        if(this.isValid()){
            this.setState({loading: true});

            setTimeout(() => {
                this.connectHardware(this.state.hardware, 0, this.state.derivationPath);
            }, 1000);
        }
    }

    handleTrezorClick(){
        this.setState({hardware: 'trezor'})
    }

    handleLedgerClick(){
        this.setState({hardware: 'ledger'})
    }

    handleDerivationPathChange(e) {
        this.setState({derivationPath: e.target.value});
    }

    onChooseHardwareAccount = (account) => {
        const {hardware, derivationPath} = this.state;
        let path = null;

        if(hardware === 'trezor'){
            path = derivationPath + account.index;
        }
        else if(hardware === 'ledger'){
            path = account.serializedPath;
        }

        this.props.dispatch(unlockHardwareWalletAccount(account.index, account.address, hardware, path ));
    };

    render() {
        const {accounts} = this.props;
        const {hardwareAccounts, page} = this.state;
        let isDisabled = (this.state.loading || this.isValid() === false);
        let warning = "";

        if(this.state.hardware === "trezor"){
            warning = "Please make sure your Trezor is connected before clicking 'Continue' below.";
        }
        else if(this.state.hardware === "ledger"){
            warning = "Please make sure your Ledger is connected with the Ethereum app open before clicking 'Continue' below.";
        }

        if(hardwareAccounts.length > 0){
            return (
                <div className="UnlockWalletViaColdWallet">
                    <div className="UnlockWalletViaColdWallet__title">
                        Choose account
                    </div>
                    <HardwareAccountsList hardwareAccounts={hardwareAccounts.slice()}
                                          accounts={Object.assign({}, accounts)}
                                          onClick={this.onChooseHardwareAccount}
                    />

                    <div className="UnlockWalletViaColdWallet__footer">
                        <a onClick={this.goToPrevPage}>{'< Prev'}</a>
                        <div style={{flex: 1}}/>
                        <a onClick={this.goToNextPage}>Next ></a>
                    </div>
                </div>
            );
        }

        return (
            <div className="UnlockWalletViaColdWallet">
                <div className="UnlockWalletViaColdWallet__title">
                    Choose hardware
                </div>

                <div className="UnlockWalletViaColdWallet__cold-wallet-hardware-select">
                    <HardwareOptionButton title="Trezor"
                                          iconUrl={(this.state.hardware === "trezor" ? "/img/icons/checkmark-green@2x.png" : null)}
                                          isSelected={(this.state.hardware === "trezor")}
                                          onClick={this.handleTrezorClick}
                    />
                    <HardwareOptionButton title="Ledger"
                                          iconUrl={(this.state.hardware === "ledger" ? "/img/icons/checkmark-green@2x.png" : null)}
                                          isSelected={(this.state.hardware === "ledger")}
                                          onClick={this.handleLedgerClick}
                    />
                </div>

                <div className="UnlockWalletCard__warning">
                    {warning}
                </div>

                <div className="UnlockColdWalletLedger__choose-derivation-path">
                    {
                        (this.state.hardware === "ledger") &&
                        <select value={this.state.derivationPath}
                                onChange={this.handleDerivationPathChange}
                                className={"UnlockColdWalletLedger__select"}
                        >
                            <option value={EthereumDerivationPath}>Ethereum - m/44'/60'/0'/0</option>
                            <option value={EthereumOtherDerivationPath}>Ethereum - m/44'/60'/0'</option>
                            <option value={EthereumLedgerLiveDerivationPath}>Ethereum - Ledger Live - m/44'/60'</option>
                        </select>
                    }
                </div>

                <div className="UnlockWalletViaColdWallet__footer">
                    <GradientButton title="Connect"
                                    loading={this.state.loading}
                                    onClick={this.handleChooseHardwareClick}
                                    disabled={isDisabled}
                    />
                </div>
            </div>
        );
    }
}
const UnlockWalletViaColdWalletStateToProps = state => {
    const {thetaWallet} = state;

    return {
        accounts: thetaWallet.accounts
    };
};
const UnlockWalletViaColdWallet = connect(UnlockWalletViaColdWalletStateToProps)(UnlockWalletViaColdWalletUnconnected);


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
        else if(this.props.unlockStrategy === WalletUnlockStrategy.COLD_WALLET){
            unlockWalletStrategyContent = (
                <UnlockWalletViaColdWallet/>
            );
        }

        return (
            <div className="UnlockWalletCard">
                <div className="UnlockWalletCard__content">
                    <div className="UnlockWalletCard__header">
                        <TabBar centered={true}
                                condensed={true}
                                className="UnlockWalletCard__tab-bar">
                            <TabBarItem
                                title="Keystore"
                                href={"/unlock/" + WalletUnlockStrategy.KEYSTORE_FILE}
                            />
                            <TabBarItem
                                title="Mnemonic"
                                href={"/unlock/" + WalletUnlockStrategy.MNEMONIC_PHRASE}
                            />
                            <TabBarItem
                                title="Private Key"
                                href={"/unlock/" + WalletUnlockStrategy.PRIVATE_KEY}
                            />
                            <TabBarItem
                                title="Hardware"
                                href={"/unlock/" + WalletUnlockStrategy.COLD_WALLET}
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
    }

    unlockWallet = (strategy, password, data) => {
        this.props.dispatch(unlockWallet(strategy, password, data));
    }

    componentDidMount() {
        let address = Wallet.getWalletAddress();

        if(!_.isNil(address)){
            // Incase the user went backwards after unlocking, reload the app
            window.location.reload();
        }
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
                                      unlockWallet={this.unlockWallet}
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
    return {};
};

export default connect(mapStateToProps)(UnlockWalletPage);
