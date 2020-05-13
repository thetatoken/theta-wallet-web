import React from "react";
import './Pages.css';
import {Route, Redirect, Switch} from "react-router-dom";
import WalletPage from './pages/WalletPage'
import SettingsPage from './pages/SettingsPage'
import OnboardingPage from './pages/OnboardingPage'
import CreateWalletPage from './pages/CreateWalletPage'
import UnlockWalletPage from './pages/UnlockWalletPage'
import StakesPage from './pages/StakesPage'
import Wallet from './services/Wallet'
import OfflinePage from "./pages/OfflinePage";
import ContractPage from "./pages/ContractPage";
import ContractModes from "./constants/ContractModes";

export class Pages extends React.Component {
    render() {
        return (
            <div className="Pages">
                <Switch>
                    <Redirect from='/onboarding' to='/onboarding/0' exact={true}/>
                    <Route path="/onboarding/:onboardingStep" component={OnboardingPage}/>
                </Switch>

                <Route path="/create" component={CreateWalletPage}/>

                <Switch>
                    <Redirect from='/unlock' to='/unlock/keystore-file' exact={true}/>
                    <Route path="/unlock/:unlockStrategy" component={UnlockWalletPage}/>
                </Switch>

                <Route path="/offline" component={OfflinePage}/>
            </div>
        );
    }
}

export class WalletPages extends React.Component {
    render() {
        return (
            <div className="Pages Pages--wallet">
                <Switch>
                    {
                        Wallet.unlocked() === false && <Redirect to='/unlock'/>
                    }

                    <Redirect from='/wallet/contract/' to={('/wallet/contract/' + ContractModes.DEPLOY)} exact={true}/>
                    <Route path="/wallet/contract/:contractMode" component={ContractPage}/>

                    <Route path="/wallet/settings" component={SettingsPage}/>

                    <Route path="/wallet/stakes" component={StakesPage}/>

                    <Redirect from='/wallet' to='/wallet/tokens/theta' exact={true}/>
                    <Redirect from='/wallet/tokens' to='/wallet/tokens/theta' exact={true}/>
                    <Route path="/wallet/tokens/:tokenType" component={WalletPage}/>

                    <Route path="/offline" component={OfflinePage}/>
                </Switch>
            </div>
        );
    }
}
