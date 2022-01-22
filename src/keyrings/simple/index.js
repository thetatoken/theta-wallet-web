import * as thetajs from '@thetalabs/theta-js';

const { EventEmitter } = require('events');

const Type = 'SimpleKeyring';

class SimpleKeyring extends EventEmitter{
    constructor (opts) {
        super();
        this.type = Type;
        this.wallets = [];
        this.deserialize(opts);
    }

    serialize () {
        return Promise.resolve(this.wallets.map((w) => w.privateKey));
    }

    deserialize (privateKeys = []) {
        return new Promise((resolve, reject) => {
            try {
                this.wallets = privateKeys.map((privateKey) => {
                    const wallet = new thetajs.Wallet(privateKey);
                    return wallet;
                });
            } catch (e) {
                reject(e);
            }
            resolve();
        });
    }

    addAccounts (n = 1) {
        const newWallets = [];
        for (let i = 0; i < n; i++) {
            const wallet = thetajs.Wallet.createRandom(null);
            newWallets.push(wallet);
        }
        this.wallets = this.wallets.concat(newWallets);
        const walletAddresses = newWallets.map((w) => w.getAddress());
        return Promise.resolve(walletAddresses);
    }

    getAccounts () {
        return Promise.resolve(this.wallets.map((w) => w.getAddress()));
    }

    signTransaction (fromAddress, transaction, provider) {
        let wallet = this._getWalletForAccount(fromAddress);
        wallet = wallet.connect(provider);
        const signedTxBytes = wallet.signTransaction(transaction);

        // tx.sign(privKey);
        return Promise.resolve(signedTxBytes);
    }

    signAndSendTransaction (fromAddress, transaction, provider) {
        let wallet = this._getWalletForAccount(fromAddress);
        wallet = wallet.connect(provider);
        transaction.setFrom(fromAddress);
        const result = wallet.sendTransaction(transaction);

        return Promise.resolve(result);
    }

    // exportAccount should return a hex-encoded private key:
    exportAccount (address) {
        const wallet = this._getWalletForAccount(address);
        return Promise.resolve(wallet.privateKey());
    }

    removeAccount (address) {
        const addressLC = address.toLowerCase();
        if (!this.wallets.map((w) => w.getAddress().toLowerCase()).includes(addressLC)) {
            throw new Error(`Address ${address} not found in this keyring`);
        }
        this.wallets = this.wallets.filter((w) => w.getAddress().toLowerCase() !== addressLC);
    }

    getPrivateKeyFor (address) {
        if (!address) {
            throw new Error('Must specify address.');
        }
        const wallet = this._getWalletForAccount(address);
        const privKey = wallet.privateKey();
        return privKey;
    }

    /**
     * @private
     */
    _getWalletForAccount (address) {
        let wallet = this.wallets.find((w) => w.getAddress() === address);
        if (!wallet) {
            throw new Error('Simple Keyring - Unable to find matching address.');
        }

        return wallet;
    }
}

SimpleKeyring.type = Type;

export default SimpleKeyring;
