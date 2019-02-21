import React from "react";
import './Pages.css';
import {Route, Redirect, Switch} from "react-router-dom";
import WalletPage from './pages/WalletPage'
import SettingsPage from './pages/SettingsPage'
import OnboardingPage from './pages/OnboardingPage'
import CreateWalletPage from './pages/CreateWalletPage'
import UnlockWalletPage from './pages/UnlockWalletPage'

export class Pages extends React.Component {
    render() {
        return (
            <div className="Pages">
                <Switch>
                    <Redirect from='/onboarding' to='/onboarding/0' exact={true}/>
                    <Route path="/onboarding/:onboardingStep" component={OnboardingPage}/>
                </Switch>

                <Route path="/create" component={CreateWalletPage}/>
                <Route path="/unlock" component={UnlockWalletPage}/>
            </div>
        );
    }
}

export class WalletPages extends React.Component {
    render() {
        return (
            <div className="Pages Pages--wallet">
                <Switch>
                    <Route path="/wallet/settings" component={SettingsPage}/>
                    <Redirect from='/wallet/tokens' to='/wallet/tokens/erc20' exact={true}/>
                    <Route path="/wallet/tokens/:tokenType" component={WalletPage}/>
                </Switch>
            </div>
        );
    }
}