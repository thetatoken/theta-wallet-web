import ObservableStore from '../utils/ObservableStore';
import SimpleKeyring from '../keyrings/simple/index';

const { EventEmitter } = require('events');

const keyringTypes = [
    SimpleKeyring,
]

export default class KeyringController extends EventEmitter {

    //
    // PUBLIC METHODS
    //

    constructor (opts) {
        super();

        const initState = opts.initState || {};
        this.store = new ObservableStore(initState);
        this.keyringTypes = opts.keyringTypes ? keyringTypes.concat(opts.keyringTypes) : keyringTypes

        this.memStore = new ObservableStore({
            isUnlocked: false,
            keyringTypes: this.keyringTypes.map((krt) => krt.type),
            keyrings: [],
        });

        this.keyrings = [];
    }

    /**
     * Full Update
     *
     * Emits the `update` event and @returns a Promise that resolves to
     * the current state.
     *
     * Frequently used to end asynchronous chains in this class,
     * indicating consumers can often either listen for updates,
     * or accept a state-resolving promise to consume their results.
     *
     * @returns {Object} The controller state.
     */
    fullUpdate () {
        this.emit('update', this.memStore.getState());
        return this.memStore.getState();
    }

    /**
     * Update Memstore Keyrings
     *
     * Updates the in-memory keyrings, without persisting.
     */
    async _updateMemStoreKeyrings () {
        const keyrings = await Promise.all(this.keyrings.map(this._dataForKeyring));
        return this.memStore.updateState({ keyrings });
    }

    /**
     * Add New Keyring
     *
     * Adds a new Keyring of the given `type` to the vault
     * and the current decrypted Keyrings array.
     *
     * All Keyring classes implement a unique `type` string,
     * and this is used to retrieve them from the keyringTypes array.
     *
     * @param {string} type - The type of keyring to add.
     * @param {Object} opts - The constructor options for the keyring.
     * @returns {Promise<SimpleKeyring|HDKeyring>} The new keyring.
     */
    addNewKeyring (type, opts) {
        const Keyring = this._getKeyringClassForType(type);
        const keyring = new Keyring(opts);
        return keyring.getAccounts()
            .then(() => {
                this.keyrings.push(keyring);
            })
            .then(() => this._updateMemStoreKeyrings())
            .then(() => this.fullUpdate())
            .then(() => {
                return keyring;
            });
    }

    /**
     * Get Accounts
     *
     * Returns the public addresses of all current accounts
     * managed by all currently unlocked keyrings.
     *
     * @returns {Promise<Array<string>>} The array of accounts.
     */
    async getAccounts () {
        const keyrings = this.keyrings || [];
        const addresses = await Promise.all(keyrings.map((kr) => kr.getAccounts()))
            .then((keyringArrays) => {
                return keyringArrays.reduce((res, arr) => {
                    return res.concat(arr);
                }, []);
            });
        return addresses;
    }

    /**
     * Add New Account
     *
     * Calls the `addAccounts` method on the given keyring,
     * and then saves those changes.
     *
     * @param {SimpleKeyring|HDKeyring} selectedKeyring - The currently selected keyring.
     * @returns {Promise<Object>} A Promise that resolves to the state.
     */
    async addNewAccount(selectedKeyring) {
        const addedAccounts = await selectedKeyring.addAccounts(1);
        addedAccounts.forEach((address) => {
            this.emit('newAccount', address);
        });
        await this._updateMemStoreKeyrings();
        return await this.fullUpdate();
    }

    /**
     * Get Keyrings by Type
     *
     * Gets all keyrings of the given type.
     *
     * @param {string} type - The keyring types to retrieve.
     * @returns {Array<SimpleKeyring|HDKeyring>} The keyrings.
     */
    getKeyringsByType (type) {
        return this.keyrings.filter((keyring) => keyring.type === type);
    }

    /**
     * Get Keyrings by Type
     *
     * Gets all keyrings of the given type.
     *
     * @param {string} type - The keyring types to retrieve.
     * @returns {SimpleKeyring|HDKeyring} The keyrings.
     */
    getPrimaryKeyring () {
        // Only supports one account for now
        return this.keyrings[0];
    }

    //
    // SIGNING METHODS
    //

    /**
     * Sign Theta Transaction
     *
     * Signs a Theta transaction object.
     *
     * @param {string} fromAddress - The transaction 'from' address.
     * @param {Object} txJson - The theta transaction (JSON format) to sign.
     * @returns {Promise<Object>} The signed transaction bytes.
     */
    signTransaction (fromAddress, txJson) {
        return this._getKeyringForAccount(fromAddress)
            .then((keyring) => {
                return keyring.signTransaction(fromAddress, txJson);
            });
    }

    signAndSendTransaction(fromAddress, transaction, networkChainId) {
        return this._getKeyringForAccount(fromAddress)
            .then((keyring) => {
                return keyring.signAndSendTransaction(fromAddress, transaction, networkChainId);
            });
    }

    //
    // PRIVATE METHODS
    //

    /**
     * Get Keyring Class For Type
     *
     * Searches the current `keyringTypes` array
     * for a Keyring class whose unique `type` property
     * matches the provided `type`,
     * returning it if it exists.
     *
     * @param {string} type - The type whose class to get.
     * @returns {SimpleKeyring|HdKeyring} The class, if it exists.
     */
    _getKeyringClassForType (type) {
        return this.keyringTypes.find((kr) => kr.type === type)
    }

    /**
     * Get Keyring For Account
     *
     * Returns the currently initialized keyring that manages
     * the specified `address` if one exists.
     *
     * @param {string} address - An account address.
     * @returns {Promise<SimpleKeyring|HDKeyring>} The keyring of the account, if it exists.
     */
    _getKeyringForAccount (address) {
        return Promise.all(this.keyrings.map((keyring) => {
            return Promise.all([
                keyring,
                keyring.getAccounts(),
            ]);
        }))
            .then((candidates) => {
                const winners = candidates.filter((candidate) => {
                    const accounts = candidate[1];
                    return accounts.includes(address);
                });
                if (winners && winners.length > 0) {
                    return winners[0][0];
                }
                throw new Error('No keyring found for the requested account.');
            });
    }

    /**
     * Display For Keyring
     *
     * Is used for adding the current keyrings to the state object.
     * @param {SimpleKeyring|HDKeyring} keyring
     * @returns {Promise<Object>} A keyring display object, with type and accounts properties.
     */
    async _dataForKeyring (keyring) {
        const accounts = await keyring.getAccounts();
        return {
            type: keyring.type,
            accounts: accounts,
        };
    }

    /**
     * Clear Keyrings
     *
     * Deallocates all currently managed keyrings and accounts.
     * Used before initializing a new vault.
     */
    async _clearKeyrings () {
        // clear keyrings from memory
        this.keyrings = [];
        this.memStore.updateState({
            keyrings: [],
        });
    }
}
