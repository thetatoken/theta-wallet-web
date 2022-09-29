import _ from 'lodash';
import ObservableStore from '../utils/ObservableStore';
import * as thetajs from '@thetalabs/theta-js';
import {TNT721ABI} from "../constants/contracts";
import {ERC721} from '../constants/assets';

const { EventEmitter } = require('events');

const ALL_COLLECTIBLES_STATE_KEY = 'allCollectibles';
const ALL_COLLECTIBLES_CONTRACTS_STATE_KEY = 'allCollectibleContracts';

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

            // address -> chainId
            allCollectibleContracts: {},
            allCollectibles: {},

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

        this._getProvider = opts.getProvider;

        this.store = new ObservableStore(initState);

        this.onCollectibleAdded = opts.onCollectibleAdded;
        this.onCollectibleRemoved = opts.onCollectibleRemoved;

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
     * Helper method to update nested state for allCollectibles and allCollectibleContracts.
     *
     * @param newCollection - the modified piece of state to update in the controller's store
     * @param baseStateKey - The root key in the store to update.
     */
    updateNestedCollectibleState(newCollection, baseStateKey) {
        const {
            network,
            selectedAddress,
        } = this._getTokenRelatedStates();
        const chainId = network.chainId;
        const userAddress = selectedAddress;
        const { [baseStateKey]: oldState } = this.store.getState();

        const addressState = oldState[userAddress];
        const newAddressState = {
            ...addressState,
            ...{ [chainId]: newCollection },
        };
        const newState = {
            ...oldState,
            ...{ [userAddress]: newAddressState },
        };

        this.store.updateState({
            [baseStateKey]: newState,
        });
    }

    /**
     * A getter for `tokens` and `accountTokens` related states.
     *
     * @param {string} [selectedAddress] - A new hex address for an account
     * @returns {Object.<array, object, string, string>} States to interact with tokens in `accountTokens`
     *
     */
    _getCollectibleRelatedStates(selectedAddress) {
        let { network, allCollectibles, allCollectibleContracts } = this.store.getState();
        const chainId = network.chainId;

        if (!selectedAddress) {
            // eslint-disable-next-line no-param-reassign
            selectedAddress = this.store.getState().selectedAddress;
        }
        if (!(selectedAddress in allCollectibles)) {
            allCollectibles[selectedAddress] = {};
            allCollectibleContracts[selectedAddress] = {};
        }
        if (!(chainId in allCollectibles[selectedAddress])) {
            allCollectibles[selectedAddress][chainId] = [];
            allCollectibleContracts[selectedAddress][chainId] = [];
        }

        const collectibleContracts = allCollectibleContracts[selectedAddress][chainId];
        const collectibles = allCollectibles[selectedAddress][chainId];

        return { collectibleContracts, collectibles, network, selectedAddress };
    }

    /**
     * Updates `tokens` of current account and network.
     *
     * @param {string} selectedAddress - Account address to be updated with.
     *
     */
    _updateCollectibles(selectedAddress) {
        const { collectibles, collectibleContracts } = this._getCollectibleRelatedStates(selectedAddress);
        this.store.updateState({ collectibles, collectibleContracts });
    }

    /**
     * Query for tokenURI for a given asset.
     *
     * @param address - ERC721 asset contract address.
     * @param tokenId - ERC721 asset identifier.
     * @returns Promise resolving to the 'owner'.
     */
    async getERC721OwnerOf(address, tokenId) {
        const provider = this._getProvider();
        let owner = null;

        try {
            const contract = new thetajs.Contract(address, TNT721ABI, provider);
            owner = await contract.ownerOf(tokenId);
        }
        catch (e){
            owner = null;
        }

        return owner;
    }

    /**
     * Checks the ownership of a ERC-721 or ERC-1155 collectible for a given address.
     *
     * @param ownerAddress - User public address.
     * @param collectibleAddress - Collectible contract address.
     * @param collectibleId - Collectible token ID.
     * @returns Promise resolving the collectible ownership.
     */
    async isCollectibleOwner(ownerAddress, collectibleAddress, collectibleId) {
        // Checks the ownership for ERC-721.
        console.log('isCollectibleOwner :: ownerAddress == ' + ownerAddress);
        console.log('isCollectibleOwner :: collectibleAddress == ' + collectibleAddress);
        console.log('isCollectibleOwner :: collectibleId == ' + collectibleId);
        try {
            const owner = await this.getERC721OwnerOf(
                collectibleAddress,
                collectibleId,
            );
            console.log('owner == ' + owner);
            return !_.isNil(owner) && (ownerAddress.toLowerCase() === owner.toLowerCase());
            // eslint-disable-next-line no-empty
        } catch {
            // Ignore ERC-721 contract error
        }

        // TODO Check the ownership for ERC-1155.

        throw new Error(
            'Unable to verify ownership. Probably because the standard is not supported or the chain is incorrect.',
        );
    }

    async getCollectibleContractInformationFromContract(contractAddress) {
        const provider = this._getProvider();
        try {
            const contract = new thetajs.Contract(contractAddress, TNT721ABI, provider);
            const contractURI = await contract.contractURI();
            const response = await fetch(contractURI);
            const {name, image, external_url} = await response.json();

            return {
                address: contractAddress,
                name: name,
                image: image,
                asset_contract_type: ERC721,
                external_link: external_url,
                collection: { name: name, image_url: image },
            };
        }
        catch (e){
            // Fall back if query fails.
            return {
                address: contractAddress,
                name: null,
                image: null,
                asset_contract_type: null,
                description: null,
                external_link: null,
                collection: { name: null, description: null, image_url: null },
            };
        }

    }

    /**
     * Adds a new token to the token array, or updates the token if passed an address that already exists.
     * Modifies the existing tokens array from the store. All objects in the tokens array array AddedToken objects.
     * @see AddedCollectibleContract {@link AddedToken}
     *
     * @param {string} rawAddress - Hex address of the token contract. May or may not be a checksum address.
     * @returns {Promise<array>} Promises the new array of AddedToken objects.
     *
     */
    async addCollectibleContract(rawAddress) {
        const address = rawAddress;
        const contractInformation = await this.getCollectibleContractInformationFromContract(address);
        const {asset_contract_type, name, image, external_link} = contractInformation;
        const newEntry = Object.assign(
            {},
            { address },
            name && { name },
            image && { image: image },
            asset_contract_type && { assetContractType: asset_contract_type },
            external_link && { externalLink: external_link }
        );
        const { collectibleContracts } = this._getCollectibleRelatedStates();
        const previousEntry = collectibleContracts.find((collectibleContract) => {
            return collectibleContract.address.toLowerCase() === address.toLowerCase();
        });
        const previousIndex = collectibleContracts.indexOf(previousEntry);

        if (previousEntry) {
            collectibleContracts[previousIndex] = newEntry;
        } else {
            collectibleContracts.push(newEntry);
        }

        this.updateNestedCollectibleState(collectibleContracts, ALL_COLLECTIBLES_CONTRACTS_STATE_KEY);

        return Promise.resolve(collectibleContracts);
    }

    /**
     * Query for tokenURI for a given asset.
     *
     * @param address - ERC721 asset contract address.
     * @param tokenId - ERC721 asset identifier.
     * @returns Promise resolving to the 'tokenURI'.
     */
    getERC721TokenURI = async (address, tokenId) => {
        const provider = this._getProvider();
        let tokenURI = null;

        try {
            const contract = new thetajs.Contract(address, TNT721ABI, provider);
            tokenURI = await contract.tokenURI(tokenId);
        }
        catch (e){

        }

        return tokenURI;
    }

    async getCollectibleURIAndStandard(contractAddress, tokenId) {
        // try ERC721 uri
        try {
            const uri = await this.getERC721TokenURI(contractAddress, tokenId);
            return [uri, ERC721];
        } catch {
            // Ignore error
        }

        // TODO try ERC1155 uri

        return [null, null];
    }

    /**
     * Request individual collectible information from contracts that follows Metadata Interface.
     *
     * @param contractAddress - Hex address of the collectible contract.
     * @param tokenId - The collectible identifier.
     * @returns Promise resolving to the current collectible name and image.
     */
    async getCollectibleInformationFromTokenURI(contractAddress, tokenId) {
        const result = await this.getCollectibleURIAndStandard(
            contractAddress,
            tokenId,
        );
        let tokenURI = result[0];
        const standard = result[1];

        try {
            const response = await fetch(tokenURI);
            const object = await response.json();
            // TODO: Check image_url existence. This is not part of EIP721 nor EIP1155
            const image = Object.prototype.hasOwnProperty.call(object, 'image')
                ? 'image'
                : /* istanbul ignore next */ 'image_url';

            return {
                image: object[image],
                name: object.name,
                description: object.description,
                standard,
                favorite: false,
            };
        } catch {
            return {
                image: null,
                name: null,
                description: null,
                standard: standard || null,
                favorite: false,
            };
        }
    }

    /**
     * Request individual collectible information (name, image url and description).
     *
     * @param contractAddress - Hex address of the collectible contract.
     * @param tokenId - The collectible identifier.
     * @returns Promise resolving to the current collectible name and image.
     */
    async getCollectibleInformation(contractAddress, tokenId) {
        let blockchainMetadata = {};

        try {
            blockchainMetadata = await this.getCollectibleInformationFromTokenURI(contractAddress, tokenId,);
        } catch (e) {

        }

        return {
            name: blockchainMetadata.name ?? null,
            description: blockchainMetadata.description ?? null,
            image: blockchainMetadata.image ?? null,
            standard: blockchainMetadata.standard ?? null,
        };
    }

    compareCollectiblesMetadata(newCollectibleMetadata, collectible) {
        const keys = [
            'image',
            'backgroundColor',
            'imagePreview',
            'imageThumbnail',
            'imageOriginal',
            'animation',
            'animationOriginal',
            'externalLink',
        ];
        const differentValues = keys.reduce((value, key) => {
            if (
                newCollectibleMetadata[key] &&
                newCollectibleMetadata[key] !== collectible[key]
            ) {
                return value + 1;
            }
            return value;
        }, 0);
        return differentValues > 0;
    }

    /**
     * Adds an individual collectible to the stored collectible list.
     *
     * @param address - Hex address of the collectible contract.
     * @param tokenId - The collectible identifier.
     * @param isOwner - If the user owns this NFT
     * @returns Promise resolving to the current collectible list.
     */
    async updateIndividualCollectible(address, tokenId, isOwner) {
        try {
            const {allCollectibles, selectedAddress, network} = this.store.getState();
            const chainId = network.chainId;

            const collectibles = allCollectibles[selectedAddress]?.[chainId] || [];

            const newCollectibles = _.map(collectibles, ((collectible) => {
                if(collectible.address.toLowerCase() === address.toLowerCase()
                    && collectible.tokenId === tokenId){
                    return Object.assign({}, collectible, {
                        isCurrentlyOwned: isOwner
                    });
                }
                else{
                    return collectible
                }
            }));
            this.updateNestedCollectibleState(
                newCollectibles,
                ALL_COLLECTIBLES_STATE_KEY
            );

            return newCollectibles;
        }
        catch (e){
            console.log('updateIndividualCollectible :: error == ');
            console.log(e);

            throw e;
        }
    }

    /**
     * Adds an individual collectible to the stored collectible list.
     *
     * @param address - Hex address of the collectible contract.
     * @param tokenId - The collectible identifier.
     * @param collectibleMetadata - Collectible optional information (name, image and description).
     * @param collectibleContract - An object containing contract data of the collectible being added.
     * @returns Promise resolving to the current collectible list.
     */
    async addIndividualCollectible(address, tokenId, collectibleMetadata, collectibleContract,) {
        try {
            const {allCollectibles, selectedAddress, network} = this.store.getState();
            const chainId = network.chainId;

            const collectibles = allCollectibles[selectedAddress]?.[chainId] || [];

            const existingEntry = collectibles.find((collectible) => collectible.address.toLowerCase() === address.toLowerCase()
                && collectible.tokenId === tokenId);

            if (existingEntry) {
                const differentMetadata = this.compareCollectiblesMetadata(
                    collectibleMetadata,
                    existingEntry);

                if (differentMetadata) {
                    // TODO: Switch to indexToUpdate
                    const indexToRemove = collectibles.findIndex(
                        (collectible) =>
                            collectible.address.toLowerCase() === address.toLowerCase() &&
                            collectible.tokenId === tokenId,
                    );
                    /* istanbul ignore next */
                    if (indexToRemove !== -1) {
                        collectibles.splice(indexToRemove, 1);
                    }
                } else {
                    return collectibles;
                }
            }

            const isOwner = await this.isCollectibleOwner(selectedAddress, address, tokenId);

            if(!isOwner){
                throw new Error('You do not own this NFT.');
            }

            const newEntry = {
                address,
                tokenId,
                favorite: existingEntry?.favorite || false,
                isCurrentlyOwned: isOwner,
                ...collectibleMetadata,
            };

            const newCollectibles = [...collectibles, newEntry];
            this.updateNestedCollectibleState(
                newCollectibles,
                ALL_COLLECTIBLES_STATE_KEY
            );

            if (this.onCollectibleAdded) {
                this.onCollectibleAdded({
                    address,
                    symbol: collectibleContract.symbol,
                    tokenId: tokenId.toString(),
                    standard: collectibleMetadata.standard
                });
            }

            return newCollectibles;
        }
        catch (e){
            console.log('addIndividualCollectible :: error == ');
            console.log(e);

            throw e;
        }
    }

    /**
     * Adds a collectible and respective collectible contract to the stored collectible and collectible contracts lists.
     *
     * @param address - Hex address of the collectible contract.
     * @param tokenId - The collectible identifier.
     * @returns Promise resolving to the current collectible list.
     */
    async addCollectible(address, tokenId) {
        const newCollectibleContracts = await this.addCollectibleContract(address);
        const collectibleMetadata = await this.getCollectibleInformation(address, tokenId);

        // If collectible contract was not added, do not add individual collectible
        const collectibleContract = newCollectibleContracts.find((contract) => contract.address.toLowerCase() === address.toLowerCase(),);

        // If collectible contract information, add individual collectible

        if (collectibleContract) {
            await this.addIndividualCollectible(
                address,
                tokenId,
                collectibleMetadata,
                collectibleContract);
        }
    }

    /**
     * Adds a collectible and respective collectible contract to the stored collectible and collectible contracts lists.
     *
     * @param address - Hex address of the collectible contract.
     * @param tokenId - The collectible identifier.
     * @returns Promise resolving to the current collectible list.
     */
    async addCollectibles(address) {
        const provider = this._getProvider();
        const selectedAddress = this.getSelectedAddress();
        const contract = new thetajs.Contract(address, TNT721ABI, provider);
        const balance = await contract.balanceOf(selectedAddress);

        for(let idx = 0; idx < balance.toNumber(); idx++){
            const tokenId = await contract.tokenOfOwnerByIndex(selectedAddress, idx);
            const tokenIdStr = tokenId.toString();
            await this.addCollectible(address, tokenIdStr);
        }
    }

    /**
     * Removes an individual collectible to the stored collectible list.
     *
     * @param address - Hex address of the collectible contract.
     * @param tokenId - The collectible identifier.
     * @returns Promise resolving to the current collectible list.
     */
    async removeIndividualCollectible(address, tokenId) {
        try {
            const {allCollectibles, selectedAddress, network} = this.store.getState();
            const chainId = network.chainId;

            const collectibles = allCollectibles[selectedAddress]?.[chainId] || [];
            const newCollectibles = _.filter(collectibles, ((collectible) => {
                return !(collectible.address.toLowerCase() === address.toLowerCase()
                    && collectible.tokenId === tokenId);
            }));

            this.updateNestedCollectibleState(
                newCollectibles,
                ALL_COLLECTIBLES_STATE_KEY
            );

            if (this.onCollectibleRemoved) {
                this.onCollectibleRemoved({
                    address,
                    tokenId: tokenId.toString(),
                });
            }

            return newCollectibles;
        }
        catch (e){
            console.log('removeIndividualCollectible :: error == ');
            console.log(e);
        }
    }

    /**
     * Adds a collectible and respective collectible contract to the stored collectible and collectible contracts lists.
     *
     * @param address - Hex address of the collectible contract.
     * @param tokenId - The collectible identifier.
     * @returns Promise resolving to the current collectible list.
     */
    async removeCollectible(address, tokenId) {
        await this.removeIndividualCollectible(
            address,
            tokenId);
    }

    async refreshCollectiblesOwnership(collectionAddress = null, tokenId = null){
        const { collectibleContracts, collectibles } = this._getCollectibleRelatedStates();
        const collectibleContractsToCheck = (_.isNil(collectionAddress) ? collectibleContracts : _.filter((collectibleContract) => {
            return (collectibleContract.address.toLowerCase() === collectionAddress.toLowerCase());
        }, collectibleContracts));
        const selectedAddress = this.getSelectedAddress();

        for(const collectibleContract of collectibleContractsToCheck){
            for(const collectible of collectibles){
                if(collectible.address.toLowerCase() === collectibleContract.address.toLowerCase()){
                    if(_.isNil(tokenId) || collectible.tokenId === tokenId){
                        const isOwner = await this.isCollectibleOwner(selectedAddress, collectibleContract.address, collectible.tokenId);
                        console.log(`collectibleContract.address == ${collectibleContract.address}   collectible.address == ${collectible.address}    isOwner == ${isOwner}`);
                        await this.updateIndividualCollectible(collectibleContract.address, collectibleContract.tokenId, isOwner);
                    }
                }
            }
        }
    }

    /**
     * A getter for the `collectibles` property
     *
     * @returns {Array} The current array of AddedCollectible objects
     *
     */
    getCollectibles() {
        return this.store.getState().collectibles;
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
