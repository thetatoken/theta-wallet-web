import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import AppWrapper from './AppWrapper';
import {BigNumber} from 'bignumber.js';

BigNumber.config({ EXPONENTIAL_AT: 1e+9 });

ReactDOM.render(<AppWrapper />, document.getElementById('root'));
