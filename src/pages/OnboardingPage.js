import React from "react";
import './OnboardingPage.css';
import {Link} from "react-router-dom";
import GradientButton from '../components/buttons/GradientButton'

const OnboardingSteps = [
    {
        title: "How to swap from ERC20 Theta to Mainnet Theta",
        description: "This wallet functions as a Theta ERC20 wallet today. When Mainnet launches in March 2019, the wallet will automatically switch to work as a THETA Mainnet wallet."
    },
    {
        title: "Create a Wallet and transfer ERC20 Theta In",
        description: "Create your wallet and transfer your ERC20 Theta in. You can now use this wallet as a fully functional ERC20 Theta wallet."
    },
    {
        title: "After launch, use the wallet to transact on Mainnet",
        description: "Once the snapshot is taken of ERC20 Theta and the mainnet is launched, the wallet will have the same balance, but all transactions will be on the Mainnet. No action is needed from you for this swap."
    }
];

class OnboardingPage extends React.Component {
    render() {
        let onboardingStep = parseInt(this.props.match.params.onboardingStep);
        let onboardingImageUrl = '/img/onboarding/' + onboardingStep + '@2x.png';
        let {title, description} = OnboardingSteps[onboardingStep];
        let footerContent = null;

        if (onboardingStep === OnboardingSteps.length - 1) {
            footerContent = (
                <React.Fragment>
                    <GradientButton title="Create Wallet"
                                    href='/create-wallet'
                    />
                    <Link to="/restore-wallet"
                          className="OnboardingPage__restore-button">
                        Restore Wallet
                    </Link>
                </React.Fragment>
            );
        }
        else {
            footerContent = (
                <GradientButton title="Next"
                                href={'/onboarding/' + (onboardingStep + 1)}
                />);
        }

        return (
            <div className="OnboardingPage">
                <div className="OnboardingPage__wrapper">
                    <div className="OnboardingPage__title">{title}</div>
                    <img src={onboardingImageUrl}
                         className="OnboardingPage__image"
                    />
                    <div className="OnboardingPage__description">{description}</div>
                    <div className="OnboardingPage__footer">
                        {footerContent}
                    </div>
                </div>
            </div>
        );
    }
}

export default OnboardingPage;