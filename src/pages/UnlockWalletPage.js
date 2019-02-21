import React from "react";
import './UnlockWalletPage.css';
import {Link} from "react-router-dom";
import GradientButton from '../components/buttons/GradientButton'
import Wallet from '../services/Wallet'
import TemporaryState from "../services/TemporaryState";
import {downloadFile} from "../utils/Utils";
import TabBarItem from "../components/TabBarItem";
import TabBar from "../components/TabBar";

class UnlockWalletCard extends React.Component {
    constructor(){
        super();

        this.state = {
            password: '',
            passwordConfirmation: '',
        }
    }

    handleChange(event) {
        let name = event.target.name;
        let type = event.target.type;
        let value = (type === "password" ? event.target.value : event.target.checked);

        this.setState({[name]: value}, this.validate);
    }

    unlockWallet(){
        console.log("Unlock the wallet...");
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
            <div className="UnlockWalletCard">
                <div className="UnlockWalletCard__content">
                    <div className="UnlockWalletCard__header">
                        <TabBar centered={true}
                                className="UnlockWalletCard__tab-bar"
                        >
                            <TabBarItem
                                title="Keystore File"
                                href="/unlock/keystore-file"
                            />
                            <TabBarItem
                                title="Mnemonic Phrase"
                                href="/unlock/mnemonic-phrase"
                            />
                            <TabBarItem
                                title="Private Key"
                                href="/unlock/private-key"
                            />
                        </TabBar>
                    </div>


                    <div className="UnlockWalletCard__footer">
                        <GradientButton title="Unlock Wallet"
                                        onClick={this.unlockWallet.bind(this)}
                                        disabled={(this.isValid() === false)}
                        />
                    </div>
                </div>
            </div>
        );
    }
}

class UnlockWalletPage extends React.Component {
    render() {
        return (
            <div className="UnlockWalletPage">
                <div className="UnlockWalletPage__wrapper">
                    <div className="UnlockWalletPage__title">
                        Unlock Your Wallet
                    </div>

                    <UnlockWalletCard/>

                    <div className="UnlockWalletPage__subtitle">
                        <span>Don't have a wallet?</span>
                        <Link to="/create">Create Wallet</Link>
                    </div>
                </div>
            </div>
        );
    }
}

export default UnlockWalletPage;