import ObservableStore from '../utils/ObservableStore';
import * as thetajs from '@thetalabs/theta-js';
import {nanoid} from 'nanoid';
import _ from "lodash";
import BigNumber from "bignumber.js";

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
            transactions: {}
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
        const fromAddress = this.preferencesController.getSelectedAddress();
        const transaction = thetajs.transactions.transactionFromJson(transactionRequest);
        transaction.setFrom(fromAddress);
        const gasFeeData = await this.getEstimatedGasData(transaction);
        let transactionDepJson = (transactionRequest.dependencies || [])[0];

        if(transactionDepJson){
            const transactionDep = thetajs.transactions.transactionFromJson(transactionDepJson);
            transactionDep.setFrom(fromAddress);
            const depGasFeeData = await this.getEstimatedGasData(transactionDep);
            transactionDepJson = {
                ...transactionDepJson,
                txData: {
                    ...transactionDepJson.txData,
                    ..._.pick(depGasFeeData, ['gasPrice', 'gasLimit'])
                },
                gasFeeData: depGasFeeData
            };
            transactionRequest.dependencies = [transactionDepJson]
        }

        return new Promise((resolve, reject) => {
            this._addTransactionRequest(Object.assign({}, transactionRequest, {
                id: nanoid(),
                txData: {
                    ...transactionRequest.txData,
                    ..._.pick(gasFeeData, ['gasPrice', 'gasLimit'])
                },
                gasFeeData: gasFeeData
            }), resolve, reject);
        });
    }

    /**
     * Validates and generates a txMeta with defaults and puts it in txStateManager
     * store.
     *
     * @returns {Object}
     */
    async approveTransactionRequest(transactionRequestId, onDependencySent) {
        const provider = this._getProvider();
        const approval = this.pendingTransactionRequests.get(transactionRequestId);
        const transactionRequest = approval.request;
        const fromAddress = this.preferencesController.getSelectedAddress();
        const transactionDepJson = (transactionRequest.dependencies || [])[0];
        if(transactionDepJson){
            const transactionDep = thetajs.transactions.transactionFromJson(transactionDepJson);
            await this.signAndSendTransaction(fromAddress, transactionDep, provider);

            if(onDependencySent){
                onDependencySent();
            }
        }
        const transaction = thetajs.transactions.transactionFromJson(transactionRequest);
        const result = await this.signAndSendTransaction(fromAddress, transaction, provider);

        if(result){
            const approval = this.pendingTransactionRequests.get(transactionRequestId);
            this._removeTransactionRequest(transactionRequestId);

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

    _transformTransaction(rawXact, priorityAddress) {
        if (rawXact.type === thetajs.constants.TxType.Send) {
            let xact = {};

            xact.type = rawXact.type;
            xact.number = rawXact.number;
            xact.status = rawXact.status;
            xact.hash = rawXact.hash.toLowerCase();
            xact.timestamp = rawXact.timestamp;
            xact.fee = {
                theta: rawXact.data.fee.thetawei,
                tfuel: rawXact.data.fee.tfuelwei
            };

            xact.inputs = _.map(rawXact.data.inputs, (input) => {
                return _.pick(input, ['address', 'coins']);
            });
            xact.outputs = _.map(rawXact.data.outputs, (output) => {
                return _.pick(output, ['address', 'coins']);
            });

            //Sort outputs
            if(priorityAddress){
                var priorityAddressLC = priorityAddress.toLowerCase();

                xact.outputs = _.sortBy(xact.outputs, function(output){
                    //Ensure the priorityAddress is always first (lowest sort key) in the list
                    return ((priorityAddressLC === output.address.toLowerCase()) ? -100 : 0);
                });
            }

            return xact;
        }

        return null;
    }

    async updateAccountTransactions(address){
        let txs = null;

        if(_.isEmpty(address)){
            return [];
        }

        try {
            const network = this.preferencesController.getNetwork();
            const chainId = network.chainId;
            const explorerUrl = thetajs.networks.getExplorerUrlForChainId(chainId);
            const explorerApiUrl = `${explorerUrl}:8443/api`;
            const listStakesUrl = `${explorerApiUrl}/accounttx/${address}`;
            const response = await fetch(listStakesUrl);
            const responseJson = await response.json();
            txs = _.get(responseJson, ['body'], []);
            txs = _.map(txs, (tx) => {
                return this._transformTransaction(tx, address);
            });
            txs = _.filter(txs, (tx) => {
                return !_.isNil(tx);
            });
        }
        catch (e) {
            // No Update
            return [];
        }

        // update accounts state
        const { transactions } = this.memStore.getState();
        transactions[address] = txs;

        this.memStore.updateState({
            transactions: transactions
        });

        return txs;
    }

    /**
     * Estimates the gas fee
     *
     * @returns {Object}
     */
    async getEstimatedGasData(transaction) {
        if(transaction.getType() === thetajs.constants.TxType.SmartContract){
            if(transaction.gasLimit !== thetajs.constants.gasLimitDefault){
                // Gas fee was set by user...
                return {
                    gasPrice: transaction.gasPrice.toString(),
                    gasLimit: transaction.gasLimit,
                    totalGasFee: transaction.gasPrice.multipliedBy(transaction.gasLimit).toString()
                }
            }

            const provider = this._getProvider();
            const result = await provider.callSmartContract(transaction);

            // if(!_.isEmpty(result.vm_error)){
            //     throw new Error(result.vm_error);
            // }

            const gasLimitWithBuffer = (new BigNumber(result.gas_used)).multipliedBy(1.5);
            const gasLimit = Math.ceil(gasLimitWithBuffer.toNumber());

            return {
                gasPrice: thetajs.constants.gasPriceSmartContractDefault.toString(),
                gasLimit: gasLimit,
                totalGasFee: thetajs.constants.gasPriceSmartContractDefault.multipliedBy(gasLimit).toString()
            }
        }
        else{
            return {
                gasPrice: thetajs.constants.gasPriceDefault.toString(),
                totalGasFee: thetajs.constants.gasPriceDefault.toString()
            }
        }
    }
}
