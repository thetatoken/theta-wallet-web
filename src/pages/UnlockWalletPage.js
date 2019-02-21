import React from "react";
import './UnlockWalletPage.css';
import {Link} from "react-router-dom";
import GradientButton from '../components/buttons/GradientButton'
import Wallet from '../services/Wallet'

const CREATE_WALLET_STEP_CREATE_KEYSTORE = 0;
const CREATE_WALLET_STEP_MNEMONIC_WARNING = 1;
const CREATE_WALLET_STEP_MNEMONIC = 2;
const CREATE_WALLET_STEP_COMPLETE = 3;

class UnlockWalletPage extends React.Component {
    constructor(){
        super();

        this.state = {
            currentStep: CREATE_WALLET_STEP_MNEMONIC_WARNING
        }
    }

    continue(){
        this.setState({ currentStep: this.state.currentStep + 1 });
    }

    render() {
        let card = null;

        return (
            <div className="UnlockWalletPage">
                <div className="UnlockWalletPage__wrapper">
                    <div className="UnlockWalletPage__title">
                        Unlock Your Wallet
                    </div>

                    {card}

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