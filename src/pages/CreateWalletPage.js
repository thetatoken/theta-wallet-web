import React from "react";
import './CreateWalletPage.css';
import {Link} from "react-router-dom";
import GradientButton from '../components/buttons/GradientButton'
import Wallet from '../services/Wallet'
import { downloadFile } from '../utils/Utils'

//const uuidv4 = require('uuid/v4');

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

        this.setState({[name]: value});
    }

    createWallet(){
        this.setState({loading: true});

        let data = Wallet.createWallet(this.state.password);
        console.log("data ==========");
        console.log(data);

        downloadFile(data.wallet.address + '.keystore', JSON.stringify(data.keystore));

        this.setState({loading: false});
    }

    isValid(){
        return (
            this.state.agreedToTerms === true &&
            this.state.password.length > 0 &&
            this.state.password === this.state.passwordConfirmation);
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
                        Your passwords do not match
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
                                        onClick={this.createWallet.bind(this)}
                                        disabled={(this.isValid() === false)}
                        />
                    </div>
                </div>
            </div>
        );
    }
}

class CreateWalletPage extends React.Component {
    render() {
        return (
            <div className="CreateWalletPage">
                <div className="CreateWalletPage__wrapper">
                    <div className="CreateWalletPage__title">Create New Wallet</div>
                    <ChoosePasswordCard></ChoosePasswordCard>
                    <div className="CreateWalletPage__subtitle">
                        <span>Already have a wallet?</span>
                        <Link to="/unlock">Unlock Wallet</Link>
                    </div>
                </div>
            </div>
        );
    }
}

export default CreateWalletPage;