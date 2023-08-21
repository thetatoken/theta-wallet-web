import _ from 'lodash';
import React from "react";
import './Pages.css';
import {Route, Redirect, Switch} from "react-router-dom";
import WalletPage from './pages/WalletPage'
import SettingsPage from './pages/SettingsPage'
import OnboardingPage from './pages/OnboardingPage'
import CreateWalletPage from './pages/CreateWalletPage'
import UnlockWalletPage from './pages/UnlockWalletPage'
import StakesPage from './pages/StakesPage'
import Wallet, {WalletUnlockStrategy} from './services/Wallet'
import OfflinePage from "./pages/OfflinePage";
import ContractPage from "./pages/ContractPage";
import ContractModes from "./constants/ContractModes";
import CrossChainTransferPage from "./pages/CrossChainTransferPage";
import {unlockWallet} from "./state/actions/Wallet";
import {setEmbedMode} from "./state/actions/ui";
import {connect} from "react-redux";
import {getAllAssets} from "./constants/assets";
import {transformThetaNetworkTransaction} from "./state/selectors/Transactions";
import TemporaryState from "./services/TemporaryState";
import MDSpinner from "react-md-spinner";

class UnconnectedEmbedPage extends React.Component{
    loadWallet(){
        const {location} = this.props;
        const {search} = location;
        const params = new URLSearchParams(search);
        const kB64 = params.get('k');
        const k = atob(decodeURIComponent(kB64));
        const pB64 = params.get('p');
        const p = atob(decodeURIComponent(pB64));
        TemporaryState.setWalletData({
            password: p
        });
        this.props.dispatch(setEmbedMode());
        this.props.dispatch(unlockWallet(WalletUnlockStrategy.KEYSTORE_FILE, p, {
            keystore: k
        }));
    }

    componentDidMount() {
        setTimeout(() => {
            this.loadWallet();
        }, 1000)
    }

    render() {
        return (
            <div className={'EmbedPage'}>
                <MDSpinner singleColor="#1BDED0" className={'EmbedPage__spinner'}/>
            </div>
        )
    }
}
const mapStateToPropsForEmbedPage = (state, ownProps) => {
    return {};
};

const EmbedPage = connect(mapStateToPropsForEmbedPage)(UnconnectedEmbedPage);

export class Pages extends React.Component {
    render() {
        return (
            <div className="Pages">
                <Route path="/embed" component={EmbedPage}/>

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
                    <Route path="/embed" component={EmbedPage}/>
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

                    <Route path="/wallet/cross-chain-transfer" component={CrossChainTransferPage}/>

                    <Route path="/offline" component={OfflinePage}/>
                </Switch>
            </div>
        );
    }
}
