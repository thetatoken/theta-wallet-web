import React, {Component} from 'react';
import {BrowserRouter, Redirect, Route, Switch} from 'react-router-dom'
import {Provider} from 'react-redux'
import {store} from "./state";
import {App, WalletApp} from './App'
import {Provider as AlertProvider} from 'react-alert'
import Alerts from './services/Alerts'
import Alert from './components/Alert'
import { hot } from 'react-hot-loader/root'
import Wallet from "./services/Wallet";
import {UPDATE_THETA_WALLET_STATE} from "./state/types/ThetaWallet";

// optional cofiguration
const options = {
    // you can also just use 'bottom center'
    position: 'top center',
    timeout: 5000,
    offset: '30px',
    transition: 'scale'
};

class AppWrapper extends Component {
    componentDidMount() {
        Wallet.controller.on('update', (data) => {
            store.dispatch({
                type: UPDATE_THETA_WALLET_STATE,
                data: data
            });
        });
    }

    render() {
        let alertRef = Alerts.getRef();

        return (
            <BrowserRouter>
                <Provider store={store}>
                    <AlertProvider ref={alertRef}
                                   template={Alert}
                                   {...options}>
                        <Switch>
                            <Redirect from='/' to='/unlock' exact={true}/>
                            <Route path="/wallet" component={WalletApp}/>
                            <Route path="/" component={App}/>
                        </Switch>
                    </AlertProvider>
                </Provider>
            </BrowserRouter>
        );
    }
}

// export default AppWrapper;
export default process.env.NODE_ENV === "development" ? hot(AppWrapper) : AppWrapper;

