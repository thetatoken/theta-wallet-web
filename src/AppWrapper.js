import React, {Component} from 'react';
import {BrowserRouter, Route, Switch} from 'react-router-dom'
import {Provider} from 'react-redux'
import {store} from "./state";
import {App, WalletApp} from './App'

class AppWrapper extends Component {
    render() {
        return (
            <BrowserRouter>
                <Provider store={store}>
                    <Switch>
                        <Route path="/wallet" component={WalletApp}/>
                        <Route path="/" component={App}/>
                    </Switch>
                </Provider>
            </BrowserRouter>
        );
    }
}

export default AppWrapper;