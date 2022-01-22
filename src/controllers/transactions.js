import ObservableStore from '../utils/ObservableStore';
import * as thetajs from '@thetalabs/theta-js';
import {nanoid} from 'nanoid';

const { EventEmitter } = require('events');

export default class TransactionsController extends EventEmitter{
    constructor(opts) {
        super();

        const initState = {
            ...opts.initState,
        };
        this.store = new ObservableStore(initState);

        this.memStore = new ObservableStore({
            transactionRequests: [],
        });

        this.preferencesController = opts.preferencesController;

        this.signAndSendTransaction = opts.signAndSendTransaction;

        this._getProvider = opts.getProvider;

        this._updateAccounts = opts.updateAccounts;

        this.pendingTransactionRequests = new Map();
    }

    _getTransactionRequests(){
        return this.memStore.getState().transactionRequests || [];
    }

    _setTransactionRequests(transactionRequests){
        this.memStore.updateState({
            transactionRequests: transactionRequests
        });
    }

    _addTransactionRequest(request, resolve, reject){
        const transactionRequests = this._getTransactionRequests();
        transactionRequests.push(request);
        this._setTransactionRequests(transactionRequests);
        this.pendingTransactionRequests.set(request.id, {
            request: request,
            resolve,
            reject
        });

        return true;
    }

    _removeTransactionRequest(transactionRequestId){
        let transactionRequests = this._getTransactionRequests();
        transactionRequests = transactionRequests.filter((tx)=> {
            return (tx.id !== transactionRequestId);
        });

        this._setTransactionRequests(transactionRequests);
        delete this.pendingTransactionRequests[transactionRequestId];

        return true;
    }

    _getTransactionRequest(transactionRequestId){
        let transactionRequests = this._getTransactionRequests();
        return  transactionRequests.find((tx)=> {
            return (tx.id === transactionRequestId);
        });
    }

    /**
     * Validates and generates a txMeta with defaults and puts it in txStateManager
     * store.
     *
     * @returns {Object}
     */
    async addTransactionRequest(transactionRequest) {
        console.log('addTransactionRequest == transactionRequest == ');
        console.log(transactionRequest);

        return new Promise((resolve, reject) => {
            this._addTransactionRequest(Object.assign({}, transactionRequest, {
                id: nanoid(),
            }), resolve, reject);
        });
    }

    /**
     * Validates and generates a txMeta with defaults and puts it in txStateManager
     * store.
     *
     * @returns {Object}
     */
    async approveTransactionRequest(transactionRequestId) {
        const provider = this._getProvider();
        const approval = this.pendingTransactionRequests.get(transactionRequestId);
        const transactionRequest = approval.request;
        const fromAddress = this.preferencesController.getSelectedAddress();
        const transactionDepJson = (transactionRequest.dependencies || [])[0];
        if(transactionDepJson){
            const transactionDep = thetajs.transactions.transactionFromJson(transactionDepJson);
            await this.signAndSendTransaction(fromAddress, transactionDep, provider);
        }
        const transaction = thetajs.transactions.transactionFromJson(transactionRequest);
        const result = await this.signAndSendTransaction(fromAddress, transaction, provider);

        if(result){
            this._removeTransactionRequest(transactionRequestId);
            const approval = this.pendingTransactionRequests.get(transactionRequestId);

            // Refresh balances because we just sent a tx
            this._updateAccounts();

            approval.resolve(result);

            return result;
        }

        return true;
    }

    /**
     * Validates and generates a txMeta with defaults and puts it in txStateManager
     * store.
     *
     * @returns {Object}
     */
    async rejectTransactionRequest(transactionRequestId) {
        this._removeTransactionRequest(transactionRequestId);
        const approval = this.pendingTransactionRequests.get(transactionRequestId);
        // approval.reject(new Error('User rejected transaction.'));

        return true;
    }
}
