import React from 'react';
import ReactDOM from 'react-dom';
import './index.scss';
import AppWrapper from './AppWrapper';
import {BigNumber} from 'bignumber.js';
import { SettingsProvider } from './components/SettingContext';
import Web3Bridge from "./services/Web3Bridge";
import {getQueryParameters} from "./utils/Utils";

let queryParams = getQueryParameters(window.location.search);
if(queryParams['after-unlock']){
    window.afterUnlock = queryParams['after-unlock'];
}
if(queryParams['network']){
    window.network = queryParams['network'];
}
if(queryParams['dapp-window-size']){
    window.dappWindowSize = queryParams['dapp-window-size'];
}

BigNumber.config({ EXPONENTIAL_AT: 1e+9 });

ReactDOM.render(<SettingsProvider><AppWrapper /></SettingsProvider>, document.getElementById('root'));

window.onerror = function(message, url, line, col, error) {
    console.log('Caught error...skipping');
};


window.Web3Bridge = new Web3Bridge();
window.Web3Bridge.init();

