import React from "react";
import './OfflinePage.css';
import GradientButton from '../components/buttons/GradientButton'

//The user's wifi will be off so the img tag won't load a remote image, let's inline one
const OfflineIcon = "data:image/png;base64,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";

class OfflineCard extends React.Component {
    render() {
        return (
            <div className="OfflineCard">
                <div className="OfflineCard__content">
                    <div className="OfflineCard__header"/>

                    <div className="OfflineCard__body">
                        <img className="OfflineCard__icon" src={OfflineIcon}/>

                        <div className="OfflineCard__title">
                            You're offline!
                        </div>
                        <div className="OfflineCard__message">
                            Your wallet has been unlocked. You may enable your internet connection now. Once your connection is enabled, press ‘Continue’.
                        </div>
                    </div>

                    <div className="OfflineCard__footer">
                        <GradientButton title="Continue"
                                        href="/wallet"
                        />
                    </div>
                </div>
            </div>
        );
    }
}

class OfflinePage extends React.Component {
    constructor(){
        super();

        this.handleContinue = this.handleContinue.bind(this);
    }

    handleContinue(){

    }

    render() {
        return (
            <div className="CreateWalletPage">
                <div className="CreateWalletPage__wrapper">
                    <div className="CreateWalletPage__title">
                        {""}
                    </div>
                    <OfflineCard onContinue={this.handleContinue}/>
                </div>
            </div>
        );
    }
}

export default OfflinePage;