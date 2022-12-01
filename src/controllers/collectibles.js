import ObservableStore from '../utils/ObservableStore';
import * as thetajs from '@thetalabs/theta-js';
import {nanoid} from 'nanoid';
import _ from "lodash";
import BigNumber from "bignumber.js";

const { EventEmitter } = require('events');

export default class CollectiblesController extends EventEmitter{
    constructor(opts) {
        super();

        const initState = {
            ...opts.initState,
        };
        this.store = new ObservableStore(initState);

        this.memStore = new ObservableStore({

        });

        this.preferencesController = opts.preferencesController;

        this.signAndSendTransaction = opts.signAndSendTransaction;

        this._getProvider = opts.getProvider;

        this._updateAccounts = opts.updateAccounts;
    }
}
