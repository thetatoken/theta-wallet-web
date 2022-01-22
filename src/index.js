import React from 'react';
import ReactDOM from 'react-dom';
import './index.scss';
import AppWrapper from './AppWrapper';
import {BigNumber} from 'bignumber.js';

BigNumber.config({ EXPONENTIAL_AT: 1e+9 });

ReactDOM.render(<AppWrapper />, document.getElementById('root'));

window.onerror = function(message, url, line, col, error) {
    console.log('Caught error...skipping');
};
