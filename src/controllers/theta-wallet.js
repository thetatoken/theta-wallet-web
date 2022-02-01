import _ from 'lodash';
import * as thetajs from '@thetalabs/theta-js';
import KeyringController from '../controllers/keyring';
import ComposableObservableStore from '../utils/ComposableObservableStore';
import PreferencesController from './preferences';
import AccountManager from './account-manager';
import TransactionsController from './transactions';
import SimpleKeyring from '../keyrings/simple';
import TrezorKeyring from '../keyrings/trezor';
import LedgerKeyring from "../keyrings/ledger";
import {
    EthereumDerivationPath, EthereumLedgerLiveDerivationPath,
    EthereumOtherDerivationPath,
    NumPathsPerPage,
    ThetaDevDerivationPath
} from "../services/Wallet";
import {updateAccountBalances} from "../state/actions/Wallet";

const { EventEmitter } = require('events');

export default class ThetaWalletController extends EventEmitter {
    constructor(opts) {
        super();

        this.sendUpdate = this._sendUpdate.bind(this);
        this.opts = opts;

        const initState = opts.initState || {};

        this.store = new ComposableObservableStore(initState);
        this.memStore = new ComposableObservableStore();

        this.preferencesController = new PreferencesController({
            initState: initState.preferencesController
        });
        this.preferencesController.on('networkChanged', (newNetwork) => {
            const selectedAddress = this.preferencesController.getSelectedAddress();
            const newProvider = new thetajs.providers.HttpProvider(newNetwork.chainId);
            this.setProvider(newProvider);

            if(selectedAddress) {
                this.accountManager.updateAccounts();
                this.accountManager.updateAccountStakes(selectedAddress);
                this.accountManager.detectNewTokens();

                this.transactionsController.updateAccountTransactions(selectedAddress);
            }
        });
        this.preferencesController.on('accountTokensUpdated', () => {
            this.accountManager.updateAccounts();
        });

        const network = this.preferencesController.getNetwork();
        this.provider =  new thetajs.providers.HttpProvider(network.chainId);

        const additionalKeyrings = [TrezorKeyring, LedgerKeyring]
        this.keyringController = new KeyringController({
            initState: initState.keyringController,
            keyringTypes: additionalKeyrings,
        });
        this.keyringController.memStore.subscribe((s) =>
            this._onKeyringVaultUpdate(s),
        );

        this.accountManager = new AccountManager({
            getProvider: this.getProvider,
            getNetwork: this.preferencesController.getNetwork.bind(this.preferencesController),
            getTokens: this.preferencesController.getTokens.bind(this.preferencesController),
            preferencesController: this.preferencesController,
        });

        this.transactionsController = new TransactionsController({
            initState: initState.transactionsController,

            getProvider: this.getProvider,

            preferencesController: this.preferencesController,

            signAndSendTransaction: this.keyringController.signAndSendTransaction.bind(this.keyringController),

            updateAccounts: this.accountManager.updateAccounts.bind(this.accountManager)
        });

        this.store.updateStructure({
            keyringController: this.keyringController.store,
            preferencesController: this.preferencesController.store,
        });

        this.preferencesController.store.subscribe((data) => {
            try {
                if(localStorage){
                    localStorage.setItem('preferencesController', JSON.stringify(_.pick(data, 'accountTokens')));
                }
            }
            catch (e) {

            }
        });

        this.memStore.updateStructure({
            keyringController: this.keyringController.memStore,
            preferencesController: this.preferencesController.store,
            transactionsController: this.transactionsController.memStore,
            accountManager: this.accountManager.store
        });
        this.memStore.subscribe((data) => {
            this.sendUpdate();
        });


        const sendUpdate = (data) => {
            // TODO anything?
        };
        this.on('update', sendUpdate);

        this.RPCApi = this._setupRPCApi();
    }

    getProvider = () => {
        return this.provider;
    };

    setProvider = (provider) => {
        this.provider = provider;
    };

    /**
     * The theta-wallet-state of the various controllers, made available to the UI
     *
     * @returns {Object} status
     */
    getState() {
        const { vault } = this.keyringController.store.getState();
        const isInitialized = Boolean(vault);

        return {
            ...{ isInitialized },
            ...this.memStore.getFlatState(),
        };
    }

    /**
     * A method for emitting the full Theta Wallet state to all registered listeners.
     * @private
     */
    _sendUpdate() {
        this.emit('update', this.getState());
    }


    /**
     * Handle a KeyringController update
     * @param {Object} state - the KC state
     * @returns {Promise<void>}
     * @private
     */
    async _onKeyringVaultUpdate(state) {
        const { keyrings } = state;
        const addresses = keyrings.reduce(
            (acc, { accounts }) => acc.concat(accounts),
            [],
        );

        if (!addresses.length) {
            return;
        }

        // Ensure preferences + identities controller know about all addresses
        this.preferencesController.syncAddresses(addresses);
        this.accountManager.syncAddresses(addresses);
    }

    /**
     * Sets the first address in the state to the selected address
     */
    async selectFirstIdentity(){
        const { identities } = this.preferencesController.store.getState();
        const address = Object.keys(identities)[0];
        await this.preferencesController.setSelectedAddress(address);
    }

    _setupRPCApi(){
        return {
            getState: this._getState.bind(this),

            // Transactions
            addTransactionRequest: this._addTransactionRequest.bind(this),
            approveTransactionRequest: this._approveTransactionRequest.bind(this),
            rejectTransactionRequest: this._rejectTransactionRequest.bind(this),

            // Tokens
            addToken: this._addToken.bind(this),
            removeToken: this._removeToken.bind(this),

            // Preferences
            setSelectedAddress: this._setSelectedAddress.bind(this),
            setSelectedNetwork: this._setSelectedNetwork.bind(this),

            // Accounts
            importAccount: this._importAccount.bind(this),

            sendTransaction: this._sendTransaction.bind(this),

            updateAccountStakes: this._updateAccountStakes.bind(this),
            updateAccountBalances: this._updateAccountBalances.bind(this),
            updateAccountTransactions: this._updateAccountTransactions.bind(this),

            // Hardware wallets
            connectHardware: this.connectHardware.bind(this),
            forgetDevice: this.forgetDevice.bind(this),
            checkHardwareStatus: this.checkHardwareStatus.bind(this),
            unlockHardwareWalletAccount: this.unlockHardwareWalletAccount.bind(this),
        };
    }


    async _sendTransaction(args){
        const {transactionRequest} = args;

        if(!this.getState().isInitialized){
            throw Error('Your Theta Wallet has not be initialized.');
        }

        const result = await this.transactionsController.addTransactionRequest(transactionRequest);

        return result;
    }

    async _getState(args) {
        const result = await this.getState();

        return result;
    }

    async _addTransactionRequest(args) {
        const {transactionRequest} = args;

        const result = await this.transactionsController.addTransactionRequest(transactionRequest);

        return result;
    }

    async _approveTransactionRequest(args) {
        const {transactionRequestId, onDependencySent} = args;

        const result = await this.transactionsController.approveTransactionRequest(transactionRequestId, onDependencySent);

        return result;
    }

    async _rejectTransactionRequest(args) {
        const {transactionRequestId} = args;

        const result = await this.transactionsController.rejectTransactionRequest(transactionRequestId);

        return result;
    }

    async _addToken(args) {
        const {token} = args;
        const {address, symbol, decimals, image} = token;

        const result = await this.preferencesController.addToken(address, symbol, decimals, image);

        return result;
    }

    async _removeToken(args) {
        const {address} = args;

        const result = await this.preferencesController.removeToken(address);

        return result;
    }

    async _setSelectedAddress(args) {
        const {address} = args;

        const result = await this.preferencesController.setSelectedAddress(address);

        return result;
    }

    async _setSelectedNetwork(args) {
        const {network} = args;

        const result = await this.preferencesController.setNetwork(network);

        return result;
    }

    async _importAccount(args) {
        const {importType, privateKey, encryptedJson, encryptedJsonPassword, name} = args;
        let privateKeyToImport = null;

        if(privateKey){
            privateKeyToImport = privateKey;
        }
        else if(encryptedJson && encryptedJsonPassword){
            const wallet = thetajs.Wallet.fromEncryptedJson(encryptedJson, encryptedJsonPassword, null);
            privateKeyToImport = wallet.privateKey;
        }
        else{
            throw new Error('Invalid account.');
        }

        const keyring = await this.keyringController.addNewKeyring(
            SimpleKeyring.type,
            [privateKeyToImport],
        );

        const accounts = await keyring.getAccounts();
        // update accounts in preferences controller
        const allAccounts = await this.keyringController.getAccounts();
        this.preferencesController.setAddresses(allAccounts);

        // Set account name
        const newAccount = accounts[0];
        if(newAccount && name){
            await this.preferencesController.setAccountName(newAccount, name);
        }

        // set new account as selected
        await this.preferencesController.setSelectedAddress(newAccount);

        this.accountManager.start();

        return true;
    }


    async _updateAccountStakes(args) {
        const {address} = args;

        return this.accountManager.updateAccountStakes(address);
    }

    async _updateAccountBalances(args) {
        const {} = args;

        return this.accountManager.updateAccounts();
    }

    async _updateAccountTransactions(args) {
        const {address} = args;

        return this.transactionsController.updateAccountTransactions(address);
    }

    //
    // Hardware
    //

    async getKeyringForDevice(deviceName, hdPath = null) {
        let keyringName = null
        switch (deviceName) {
            case 'trezor':
                keyringName = TrezorKeyring.type
                break
            case 'ledger':
                keyringName = LedgerKeyring.type
                break
            default:
                throw new Error(
                    'ThetaWalletController:getKeyringForDevice - Unknown device',
                )
        }
        let keyring = await this.keyringController.getKeyringsByType(keyringName)[0]
        if (!keyring) {
            keyring = await this.keyringController.addNewKeyring(keyringName)
        }
        if (hdPath && keyring.setHdPath) {
            // Transform the hdPath so it can be used properly
            if(hdPath === EthereumDerivationPath){
                hdPath = EthereumDerivationPath;
            }
            else if(hdPath === EthereumOtherDerivationPath){
                hdPath = EthereumOtherDerivationPath;
            }
            else if(hdPath === EthereumLedgerLiveDerivationPath){
                hdPath = "m/44'/60'/0'/0/0";
            }

            keyring.setHdPath(hdPath)
        }

        return keyring
    }

    /**
     * Fetch account list from a trezor device.
     *
     * @returns [] accounts
     */
    async connectHardware(deviceName, page, hdPath) {
        const keyring = await this.getKeyringForDevice(deviceName, hdPath)
        let accounts = []
        switch (page) {
            case -1:
                accounts = await keyring.getPreviousPage()
                break
            case 1:
                accounts = await keyring.getNextPage()
                break
            default:
                accounts = await keyring.getFirstPage()
        }

        // Merge with existing accounts
        // and make sure addresses are not repeated
        const oldAccounts = await this.keyringController.getAccounts()
        const accountsToTrack = [
            ...new Set(
                oldAccounts.concat(accounts.map((a) => a.address.toLowerCase())),
            ),
        ]
        this.accountManager.syncAddresses(accountsToTrack)
        return accounts
    }

    /**
     * Check if the device is unlocked
     *
     * @returns {Promise<boolean>}
     */
    async checkHardwareStatus(deviceName, hdPath) {
        const keyring = await this.getKeyringForDevice(deviceName, hdPath)
        return keyring.isUnlocked()
    }

    /**
     * Clear
     *
     * @returns {Promise<boolean>}
     */
    async forgetDevice(deviceName) {
        const keyring = await this.getKeyringForDevice(deviceName)
        keyring.forgetDevice()
        return true
    }

    /**
     * Imports an account from a trezor device.
     *
     * @returns {} keyState
     */
    async unlockHardwareWalletAccount(index, deviceName, hdPath) {
        const keyring = await this.getKeyringForDevice(deviceName, hdPath)

        keyring.setAccountToUnlock(index)
        const oldAccounts = await this.keyringController.getAccounts()
        const keyState = await this.keyringController.addNewAccount(keyring)
        const newAccounts = await this.keyringController.getAccounts()
        this.preferencesController.setAddresses(newAccounts)
        newAccounts.forEach((address) => {
            if (!oldAccounts.includes(address)) {
                // Select the account
                this.preferencesController.setSelectedAddress(address)
            }
        });

        this.accountManager.start();

        const { identities } = this.preferencesController.store.getState()
        return { ...keyState, identities }
    }
}
