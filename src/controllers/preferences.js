import _ from 'lodash';
import ObservableStore from '../utils/ObservableStore';
import * as thetajs from '@thetalabs/theta-js';

const { EventEmitter } = require('events');

export default class PreferencesController  extends EventEmitter {
    /**
     *
     * @typedef {Object} PreferencesController
     * @param {Object} opts - Overrides the defaults for the initial state of this.store
     * @property {Object} store The stored object containing a users preferences, stored in local storage
     * @property {Array} store.tokens The tokens the user wants display in their token lists
     * @property {Object} store.accountTokens The tokens stored per account and then per network type
     * @property {Object} store.assetImages Contains assets objects related to assets added
     * @property {string} store.selectedAddress A hex string that matches the currently selected address in the app
     *
     */
    constructor(opts = {}) {
        super();

        const initState = {
            accountTokens: {},
            assetImages: {},
            tokens: [],

            identities: {},
            lostIdentities: {},

            preferences: {
                autoLockTimeLimit: undefined,
            },
            completedOnboarding: false,

            selectedAddress: null,

            network: {
                chainId: thetajs.networks.ChainIds.Mainnet,
            },

            delegatedGuardianNodes: [],

            ...opts.initState,
        };

        this.store = new ObservableStore(initState);

        this.updateDelegatedGuardianNodes();
    }


    // PUBLIC METHODS

    getAssetImages() {
        return this.store.getState().assetImages;
    }

    /**
     * Synchronizes identity entries with known accounts.
     * Removes any unknown identities, and returns the resulting selected address.
     *
     * @param {Array<string>} addresses - known to the vault.
     * @returns {string} selectedAddress the selected address.
     */
    syncAddresses(addresses) {
        if (!Array.isArray(addresses) || addresses.length === 0) {
            throw new Error('Expected non-empty array of addresses.');
        }

        const { identities, lostIdentities } = this.store.getState();

        const newlyLost = {};
        Object.keys(identities).forEach((identity) => {
            if (!addresses.includes(identity)) {
                newlyLost[identity] = identities[identity];
                delete identities[identity];
            }
        });

        // Identities are no longer present.
        if (Object.keys(newlyLost).length > 0) {
            // store lost accounts
            Object.keys(newlyLost).forEach((key) => {
                lostIdentities[key] = newlyLost[key];
            });
        }

        this.store.updateState({ identities, lostIdentities });
        this.addAddresses(addresses);

        // If the selected account is no longer valid,
        // select an arbitrary other account:
        let selectedAddr = this.getSelectedAddress();
        if (!addresses.includes(selectedAddr)) {
            selectedAddr = addresses[0];
            this.setSelectedAddress(selectedAddr);
        }

        return selectedAddr;
    }

    /**
     * Updates identities to only include specified addresses. Removes identities
     * not included in addresses array
     *
     * @param {string[]} addresses - An array of hex addresses
     *
     */
    setAddresses(addresses) {
        const oldIdentities = this.store.getState().identities;
        const oldAccountTokens = this.store.getState().accountTokens;

        const identities = addresses.reduce((ids, address, index) => {
            const oldId = oldIdentities[address] || {};
            ids[address] = { name: `Account ${index + 1}`, address, ...oldId };
            return ids;
        }, {});
        const accountTokens = addresses.reduce((tokens, address) => {
            const oldTokens = oldAccountTokens[address] || {};
            tokens[address] = oldTokens;
            return tokens;
        }, {});
        this.store.updateState({ identities, accountTokens });
    }

    /**
     * Removes an address from state
     *
     * @param {string} address - A hex address
     * @returns {string} the address that was removed
     */
    removeAddress(address) {
        const { identities } = this.store.getState();
        const { accountTokens } = this.store.getState();
        if (!identities[address]) {
            throw new Error(`${address} can't be deleted cause it was not found`);
        }
        delete identities[address];
        delete accountTokens[address];
        this.store.updateState({ identities, accountTokens });

        // If the selected account is no longer valid,
        // select an arbitrary other account:
        if (address === this.getSelectedAddress()) {
            const selected = Object.keys(identities)[0];
            this.setSelectedAddress(selected);
        }
        return address;
    }

    /**
     * Adds addresses to the identities object without removing identities
     *
     * @param {string[]} addresses - An array of hex addresses
     *
     */
    addAddresses(addresses) {
        const { identities, accountTokens } = this.store.getState();
        addresses.forEach((address) => {
            // skip if already exists
            if (identities[address]) {
                return;
            }
            // add missing identity
            const identityCount = Object.keys(identities).length;

            if(_.isNil(accountTokens[address])){
                accountTokens[address] = {};
            }

            identities[address] = { name: `Account ${identityCount + 1}`, address };
        });
        this.store.updateState({ identities, accountTokens });
    }

    /**
     * Setter for the `selectedAddress` property
     *
     * @param {string} _address - A new hex address for an account
     * @returns {Promise<void>} Promise resolves with tokens
     *
     */
    setSelectedAddress(_address) {
        const address = _address;
        this._updateTokens(address);

        const { identities, tokens } = this.store.getState();
        const selectedIdentity = identities[address];
        if (!selectedIdentity) {
            throw new Error(`Identity for '${address} not found`);
        }

        selectedIdentity.lastSelected = Date.now();
        this.store.updateState({ identities, selectedAddress: address });
        return Promise.resolve(tokens);
    }

    /**
     * Getter for the `selectedAddress` property
     *
     * @returns {string} The hex address for the currently selected account
     *
     */
    getSelectedAddress() {
        return this.store.getState().selectedAddress;
    }

    /**
     * Contains data about tokens users add to their account.
     * @typedef {Object} AddedToken
     * @property {string} address - The hex address for the token contract. Will be all lower cased and hex-prefixed.
     * @property {string} symbol - The symbol of the token, usually 3 or 4 capitalized letters
     *  {@link https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md#symbol}
     * @property {boolean} decimals - The number of decimals the token uses.
     *  {@link https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md#decimals}
     */

    /**
     * A getter for `tokens` and `accountTokens` related states.
     *
     * @param {string} [selectedAddress] - A new hex address for an account
     * @returns {Object.<array, object, string, string>} States to interact with tokens in `accountTokens`
     *
     */
    _getTokenRelatedStates(selectedAddress) {
        const { network, accountTokens } = this.store.getState();
        const chainId = network.chainId;

        if (!selectedAddress) {
            // eslint-disable-next-line no-param-reassign
            selectedAddress = this.store.getState().selectedAddress;
        }
        if (!(selectedAddress in accountTokens)) {
            accountTokens[selectedAddress] = {};
        }
        if (!(chainId in accountTokens[selectedAddress])) {
            accountTokens[selectedAddress][chainId] = [];
        }
        const tokens = accountTokens[selectedAddress][chainId];
        return { tokens, accountTokens, network, selectedAddress };
    }

    /**
     * Updates `tokens` of current account and network.
     *
     * @param {string} selectedAddress - Account address to be updated with.
     *
     */
    _updateTokens(selectedAddress) {
        const { tokens } = this._getTokenRelatedStates(selectedAddress);
        this.store.updateState({ tokens });
    }

    /**
     * Updates `accountTokens` and `tokens` of current account and network according to it.
     *
     * @param {Array} tokens - Array of tokens to be updated.
     *
     */
    _updateAccountTokens(tokens, assetImages) {
        const {
            accountTokens,
            network,
            selectedAddress,
        } = this._getTokenRelatedStates();
        accountTokens[selectedAddress][network.chainId] = tokens;
        this.store.updateState({ accountTokens, tokens, assetImages });

        this.emit('accountTokensUpdated');
    }

    /**
     * Adds a new token to the token array, or updates the token if passed an address that already exists.
     * Modifies the existing tokens array from the store. All objects in the tokens array array AddedToken objects.
     * @see AddedToken {@link AddedToken}
     *
     * @param {string} rawAddress - Hex address of the token contract. May or may not be a checksum address.
     * @param {string} symbol - The symbol of the token
     * @param {number} decimals - The number of decimals the token uses.
     * @param {string} image - The url for the token asset.
     * @returns {Promise<array>} Promises the new array of AddedToken objects.
     *
     */
    async addToken(rawAddress, symbol, decimals, image) {
        const address = rawAddress;
        const newEntry = { address, symbol, decimals };
        const { tokens } = this.store.getState();
        const assetImages = this.getAssetImages();
        const previousEntry = tokens.find((token) => {
            return token.address === address;
        });
        const previousIndex = tokens.indexOf(previousEntry);

        if (previousEntry) {
            tokens[previousIndex] = newEntry;
        } else {
            tokens.push(newEntry);
        }
        assetImages[address] = image;
        this._updateAccountTokens(tokens, assetImages);
        return Promise.resolve(tokens);
    }

    /**
     * Removes a specified token from the tokens array.
     *
     * @param {string} rawAddress - Hex address of the token contract to remove.
     * @returns {Promise<array>} The new array of AddedToken objects
     *
     */
    removeToken(rawAddress) {
        const { tokens } = this.store.getState();
        const assetImages = this.getAssetImages();
        const updatedTokens = tokens.filter((token) => token.address !== rawAddress);
        delete assetImages[rawAddress];
        this._updateAccountTokens(updatedTokens, assetImages);
        return Promise.resolve(updatedTokens);
    }

    /**
     * A getter for the `tokens` property
     *
     * @returns {Array} The current array of AddedToken objects
     *
     */
    getTokens() {
        return this.store.getState().tokens;
    }

    /**
     * Sets a custom label for an account
     * @param {string} account - the account to set a label for
     * @param {string} name - the custom name for the account
     * @returns {Promise<string>}
     */
    setAccountName(account, name) {
        if (!account) {
            throw new Error(
                `setAccountLabel requires a valid address, got ${String(account)}`,
            );
        }
        const address = account;
        const { identities } = this.store.getState();
        identities[address] = identities[address] || {};
        identities[address].name = name;
        this.store.updateState({ identities });
        return Promise.resolve(name);
    }

    /**
     * Updates the `preferences` property, which is an object. These are user-controlled features
     * found in the settings page.
     * @param {string} preference - The preference to enable or disable.
     * @param {boolean} value - Indicates whether or not the preference should be enabled or disabled.
     * @returns {Promise<object>} Promises a new object; the updated preferences object.
     */
    setPreference(preference, value) {
        const currentPreferences = this.getPreferences();
        const updatedPreferences = {
            ...currentPreferences,
            [preference]: value,
        };

        this.store.updateState({ preferences: updatedPreferences });
        return Promise.resolve(updatedPreferences);
    }

    /**
     * A getter for the `preferences` property
     * @returns {Object} A key-boolean map of user-selected preferences.
     */
    getPreferences() {
        return this.store.getState().preferences;
    }

    /**
     * Sets the completedOnboarding state to true, indicating that the user has completed the
     * onboarding process.
     */
    completeOnboarding() {
        this.store.updateState({ completedOnboarding: true });
        return Promise.resolve(true);
    }

    /**
     * Updates the `network` property.
     * @param {object} network - {chainId: String}
     * @returns {Promise<Boolean>} Promises a new object; the updated preferences object.
     */
    setNetwork(network) {
        if(network.chainId === undefined || network.chainId === null){
            throw new Error('PreferencesController :: setNetwork - network is invalid');
        }

        this.store.updateState({ network: network });

        this._updateTokens(this.getSelectedAddress());

        this.emit('networkChanged', network);

        return Promise.resolve(true);
    }

    /**
     * A getter for the `network` property
     * @returns {Object}
     */
    getNetwork() {
        return this.store.getState().network;
    }

    /**
     * Calls API to get the delegated guardian nodes
     * @returns {Object}
     */
    async updateDelegatedGuardianNodes(){
        let delegatedGuardianNodes = null;

        try {
            const url = `https://api.thetatoken.org/v1/guardian/delegated-nodes`;
            const response = await fetch(url);
            const responseJson = await response.json();
            delegatedGuardianNodes = responseJson;
            delegatedGuardianNodes = _.map(delegatedGuardianNodes, (node) => {
                const [fee, address] = node.address.split(' fee - ');

                return {
                    ...node,
                    fee: fee,
                    address: address
                };
            });
        }
        catch (e) {
            // No Update
            return [];
        }

        // Update states
        this.store.updateState({ delegatedGuardianNodes });

        return delegatedGuardianNodes;
    }
}
