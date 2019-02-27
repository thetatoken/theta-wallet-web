import React, {Component} from 'react';
import {BrowserRouter, Route, Switch} from 'react-router-dom'
import {Provider} from 'react-redux'
import {store} from "./state";
import {App, WalletApp} from './App'
import {Provider as AlertProvider} from 'react-alert'
import Alerts from './services/Alerts'
import Alert from './components/Alert'

// optional cofiguration
const options = {
    // you can also just use 'bottom center'
    position: 'bottom center',
    timeout: 5000,
    offset: '30px',
    transition: 'fade'
};

class AppWrapper extends Component {
    render() {
        let alertRef = Alerts.getRef();

        return (
            <BrowserRouter>
                <Provider store={store}>
                    <AlertProvider ref={alertRef}
                                   template={Alert}
                                   {...options}>
                        <Switch>
                            <Route path="/wallet" component={WalletApp}/>
                            <Route path="/" component={App}/>
                        </Switch>
                    </AlertProvider>
                </Provider>
            </BrowserRouter>
        );
    }
}

export default AppWrapper;