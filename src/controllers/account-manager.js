import _ from 'lodash';
import * as thetajs from '@thetalabs/theta-js';
import BigNumber from 'bignumber.js';
import ObservableStore from '../utils/ObservableStore';
import {SingleCallTokenBalancesAddressByChainId, TDropStakingAddressByChainId} from '../constants';
import {SingleCallTokenBalancesABI, TDropStakingABI} from '../constants/contracts';

const {tokensByChainId} = require('@thetalabs/tnt20-contract-metadata');
const DEFAULT_INTERVAL = 60 * 1000;

/**
 * This module is responsible for tracking any number of accounts and caching their current balances & transaction
 * counts.
 *
 * It also tracks transaction hashes, and checks their inclusion status on each new block.
 *
 * @typedef {Object} AccountManager
 * @property {Object} store The stored object containing all accounts to track
 * @property {Object} store.accounts The accounts currently stored in this AccountTracker
 *
 */
export default class AccountManager {
    /**
     * @param {Object} opts - Options for initializing the controller
     */
    constructor(opts = {}) {
        const initState = {
            accounts: {}
        };
        this.store = new ObservableStore(initState);
        this._getProvider = opts.getProvider;
        this._getNetwork = opts.getNetwork;
        this._getTokens = opts.getTokens;
        this._preferencesController = opts.preferencesController;
        this._updateIntervalId = null;
    }

    start() {
        // fetch account balances
        this.updateAccounts();

        if(!this._updateIntervalId){
            this._updateIntervalId = setInterval(() => {
                this.updateAccounts();
            }, DEFAULT_INTERVAL);
        }

        this.detectNewTokens();
    }

    stop() {
        if(this._updateIntervalId){
            clearInterval(this._updateIntervalId);
        }
    }

    /**
     * Ensures that the locally stored accounts are in sync with a set of accounts stored externally to this
     * AccountTracker.
     *
     * Once this AccountTracker's accounts are up to date with those referenced by the passed addresses, each
     * of these accounts are given an updated balance via EthQuery.
     *
     * @param {Array} addresses - The array of hex addresses for accounts with which this AccountTracker's accounts should be
     * in sync
     *
     */
    syncAddresses(addresses) {
        const { accounts } = this.store.getState();
        const locals = Object.keys(accounts);

        const accountsToAdd = [];
        addresses.forEach((addr) => {
            if (!locals.includes(addr)) {
                accountsToAdd.push(addr);
            }
        });

        const accountsToRemove = [];
        locals.forEach((local) => {
            if (!addresses.includes(local)) {
                accountsToRemove.push(local);
            }
        });

        this.addAccounts(accountsToAdd);
        this.removeAccounts(accountsToRemove);
    }

    /**
     * Adds new addresses to track the balances of
     * given a balance as long this._currentBlockNumber is defined.
     *
     * @param {Array} addresses - An array of hex addresses of new accounts to track
     *
     */
    addAccounts(addresses) {
        const { accounts } = this.store.getState();
        // add initial state for addresses
        addresses.forEach((address) => {
            accounts[address] = {};
        });
        // save accounts state
        this.store.updateState({ accounts });

        // fetch balances for the accounts that we added
        if(addresses.length){
            this.updateAccounts();
        }
    }

    /**
     * Removes accounts from being tracked
     *
     * @param {Array} addresses - array of hex addresses to stop tracking
     *
     */
    removeAccounts(addresses) {
        const { accounts } = this.store.getState();
        // remove each state object
        addresses.forEach((address) => {
            delete accounts[address];
        });
        // save accounts state
        this.store.updateState({ accounts });
    }

    /**
     * Removes all addresses and associated balances
     */

    clearAccounts() {
        this.store.updateState({ accounts: {} });
    }

    /**
     * balanceChecker is deployed on main eth (test)nets and requires a single call
     * for all other networks, calls this._updateAccount for each account in this.store
     *
     * @returns {Promise} after all account balances updated
     *
     */
    async updateAccounts() {
        const { accounts } = this.store.getState();
        const addresses = Object.keys(accounts);

        if(addresses.length === 0){
            // No accounts to fetch
            return true;
        }

        addresses.map((addr) => {
            this._updateAccount(addr);
        });

        // Fetch tokens...
        await this._updateAccountTokensViaBalanceChecker(addresses);
    }

    /**
     * Updates the current balance of an account.
     *
     * @private
     * @param {string} address - A hex address of a the account to be updated
     * @returns {Promise} after the account balance is updated
     *
     */
    async _updateAccount(address) {
        // query balance
        let account = null;
        try {
            const provider = this._getProvider();

            account = await provider.getAccount(address);
        }
        catch (e) {
            // This can happen if the account doesn't have any theta/tfuel yet.
            account = {
                coins: {
                    thetawei: 0,
                    tfuelwei: 0,
                }
            };
        }

        const result = {
            address: address,
            balances: account.coins,
        };

        // update accounts state
        const { accounts } = this.store.getState();
        const current = accounts[address.toLowerCase()] || accounts[address] || {};
        // only populate if the entry is still present

        accounts[address] = {
            // keep our stakes
            ...current,
            ...result,
            balances: {
                ...current.balances,
                ...result.balances
            }
        };
        this.store.updateState({ accounts });
    }

    /**
     * Updates current address balances from balanceChecker deployed contract instance
     * @param {*} addresses
     * @param {*} deployedContractAddress
     */
    async _updateAccountTokensViaBalanceChecker(addresses) {
        const { accounts } = this.store.getState();
        const provider = this._getProvider();
        const chainId = this._getNetwork().chainId;
        const tokens = this._getTokens();
        let tokenAddresses = _.map(tokens, 'address');
        tokenAddresses = _.map(tokenAddresses, _.trim);
        const deployedContractAddress = SingleCallTokenBalancesAddressByChainId[chainId];

        if(_.isNil(deployedContractAddress)){
            // TODO not supported... call each token?
            return;
        }

        if(tokenAddresses.length === 0){
            // No tokens to fetch
            return;
        }

        if(addresses.length === 0){
            // No addresses to fetch
            return;
        }

        try {
            const balanceCheckContract = new thetajs.Contract(deployedContractAddress, SingleCallTokenBalancesABI, provider);
            const balances = await balanceCheckContract.balances(addresses, tokenAddresses);
            // contract returns a array of length addresses.length * tokens.length so we need to partiton it
            const balancesGroupedByAddress = _.chunk(balances, tokenAddresses.length);

            addresses.forEach((address, index) => {
                const addressTokenBalances = balancesGroupedByAddress[index];
                const tokenBalancesByTokenAddress = _.reduce(addressTokenBalances, function(current, balance, tokenIdx) {
                    const tokenAddress = tokenAddresses[tokenIdx];
                    return Object.assign(current, {
                        [tokenAddress]: balance.toString()
                    });
                }, {});
                const currentAccounts = this.store.getState().accounts;
                const currentBalances = currentAccounts[address].balances;
                const current = accounts[address.toLowerCase()] || accounts[address];

                accounts[address] = {
                    ...current,
                    address,
                    balances: {
                        ...currentBalances,
                        ...tokenBalancesByTokenAddress
                    }};
            });

            this.store.updateState({ accounts });
        }
        catch (e) {

        }
    }

    async updateAccountTDropStake(address){
        let stakingBalance = new BigNumber(0);
        let totalShares = new BigNumber(0);
        let estimatedTDropOwned = new BigNumber(0);
        let delegate = null;

        try {
            const provider = this._getProvider();
            const network = this._getNetwork();
            const chainId = network.chainId;
            const deployedContractAddress = TDropStakingAddressByChainId[chainId];
            if(_.isNil(deployedContractAddress)){
                return null;
            }
            const tdropStakingContract = new thetajs.Contract(deployedContractAddress, TDropStakingABI, provider);
            stakingBalance = await tdropStakingContract.balanceOf(address);

            if(!stakingBalance.isZero()){
                estimatedTDropOwned = await tdropStakingContract.estimatedTDropOwnedBy(address);
                totalShares = await tdropStakingContract.totalShares();
                delegate = await tdropStakingContract.delegates(address);
            }
        }
        catch (e) {
            // No Update
            return null;
        }

        // update accounts state
        const { accounts } = this.store.getState();
        const current = accounts[address.toLowerCase()] || accounts[address];
        // only populate if the entry is still present
        if (!current) {
            return null;
        }

        const votingPower = ((new BigNumber(stakingBalance.toString())).dividedBy((new BigNumber(totalShares.toString())))).multipliedBy(100);
        const tdropStakingInfo = {
            balance: stakingBalance.toString(),
            totalShares: totalShares.toString(),
            estimatedTokenOwnedWithRewards: estimatedTDropOwned.toString(),
            votingPower: stakingBalance.isZero() ? "0" : votingPower.toString(),
            votingDelegate: delegate
        };

        accounts[address] = {
            ...current,
            tnt20Stakes: {
                tdrop: tdropStakingInfo
            }
        };
        this.store.updateState({ accounts });

        return tdropStakingInfo;
    }

    async updateAccountStakes(address){
        let stakes = null;

        try {
            const network = this._getNetwork();
            const chainId = network.chainId;
            const explorerUrl = thetajs.networks.getExplorerUrlForChainId(chainId);
            const explorerApiUrl = `${explorerUrl}:8443/api`;
            const listStakesUrl = `${explorerApiUrl}/stake/${address}?hasBalance=true&types[]=vcp&types[]=gcp&types[]=eenp`;
            const response = await fetch(listStakesUrl);
            const responseJson = await response.json();
            stakes = _.get(responseJson, ['body', 'sourceRecords'], []);
        }
        catch (e) {
            // No Update
            return [];
        }

        // update accounts state
        const { accounts } = this.store.getState();
        const current = accounts[address.toLowerCase()] || accounts[address];
        // only populate if the entry is still present
        if (!current) {
            return [];
        }
        accounts[address] = {
            ...current,
            stakes: stakes
        };
        this.store.updateState({ accounts });

        // TNT20 stakes
        await this.updateAccountTDropStake(address);

        return stakes;
    }

    async detectNewTokens() {
        const selectedAddress = this._preferencesController.getSelectedAddress();
        const provider = this._getProvider();
        const network = this._getNetwork();
        const chainId = network.chainId;
        const knownTokenList = tokensByChainId[chainId];
        const tokens = this._getTokens();
        let tokenAddresses = _.map(tokens, 'address');
        let trackedTokens = new Set(_.map(tokenAddresses, _.trim));

        const tokensToDetect = [];
        for (const tokenAddress in knownTokenList) {
            if (!trackedTokens.has(tokenAddress)) {
                tokensToDetect.push(tokenAddress);
            }
        }

        if(tokensToDetect.length === 0){
            return;
        }

        const sliceOfTokensToDetect = [
            tokensToDetect.slice(0, 1000),
            tokensToDetect.slice(1000, tokensToDetect.length - 1),
        ];
        const balanceCheckContract = new thetajs.Contract(SingleCallTokenBalancesAddressByChainId[chainId], SingleCallTokenBalancesABI, provider);

        for (const tokensSlice of sliceOfTokensToDetect) {
            let result;
            try {
                result = await balanceCheckContract.balances([selectedAddress], tokensSlice);
            } catch (error) {
                return;
            }

            const tokensWithBalance = tokensSlice.filter((_, index) => {
                const balance = result[index];
                return balance && !balance.isZero();
            });

            await Promise.all(
                tokensWithBalance.map((tokenAddress) => {
                    return this._preferencesController.addToken(
                        tokenAddress,
                        knownTokenList[tokenAddress].symbol,
                        knownTokenList[tokenAddress].decimals,
                    );
                }),
            );
        }
    }
}
