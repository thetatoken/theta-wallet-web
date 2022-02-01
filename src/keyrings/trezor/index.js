import _ from 'lodash';
import Trezor from "../../services/Trezor";
const { EventEmitter } = require('events')
const ethUtil = require('ethereumjs-util')
const HDKey = require('hdkey')
const TrezorConnect = require('trezor-connect').default
const hdPathString = `m/44'/60'/0'/0`
const keyringType = 'Trezor Hardware'
const pathBase = 'm'
const MAX_INDEX = 1000
const DELAY_BETWEEN_POPUPS = 1000
const TREZOR_CONNECT_MANIFEST = {
    email: 'support@thetatoken.org',
    appUrl: 'https://wallet.thetatoken.org',
    keepSession: true
};

class TrezorKeyring extends EventEmitter {
    constructor (opts = {}) {
        super()
        this.type = keyringType
        this.accounts = []
        this.hdk = new HDKey()
        this.page = 0
        this.perPage = 5
        this.unlockedAccount = 0
        this.paths = {}
        this.deserialize(opts)
        TrezorConnect.manifest(TREZOR_CONNECT_MANIFEST)
    }

    serialize () {
        return Promise.resolve({
            hdPath: this.hdPath,
            accounts: this.accounts,
            page: this.page,
            paths: this.paths,
            perPage: this.perPage,
            unlockedAccount: this.unlockedAccount,
        })
    }

    deserialize (opts = {}) {
        this.hdPath = opts.hdPath || hdPathString
        this.accounts = opts.accounts || []
        this.page = opts.page || 0
        this.perPage = opts.perPage || 5
        return Promise.resolve()
    }

    isUnlocked () {
        return !!(this.hdk && this.hdk.publicKey)
    }

    unlock () {
        if (this.isUnlocked()) return Promise.resolve('already unlocked')
        return new Promise((resolve, reject) => {
            TrezorConnect.getPublicKey({
                path: this.hdPath,
                coin: 'ETH',
            }).then(response => {
                if (response.success) {
                    this.hdk.publicKey = new Buffer(response.payload.publicKey, 'hex')
                    this.hdk.chainCode = new Buffer(response.payload.chainCode, 'hex')
                    resolve('just unlocked')
                } else {
                    reject(new Error(response.payload && response.payload.error || 'Unknown error'))
                }
            }).catch(e => {
                reject(new Error(e && e.toString() || 'Unknown error'))
            })
        })
    }

    setAccountToUnlock (index) {
        this.unlockedAccount = parseInt(index, 10)
    }

    addAccounts (n = 1) {
        return new Promise((resolve, reject) => {
            this.unlock()
                .then(_ => {
                    const from = this.unlockedAccount
                    const to = from + n
                    this.accounts = []

                    for (let i = from; i < to; i++) {
                        const address = this._addressFromIndex(pathBase, i)
                        this.accounts.push(address)
                        this.page = 0
                    }
                    resolve(this.accounts)
                })
                .catch(e => {
                    reject(e)
                })
        })
    }

    getFirstPage () {
        this.page = 0
        return this._getPage(1)
    }

    getNextPage () {
        return this._getPage(1)
    }

    getPreviousPage () {
        return this._getPage(-1)
    }

    _getPage (increment) {
        this.page += increment

        if (this.page <= 0) { this.page = 1 }

        return new Promise((resolve, reject) => {
            this.unlock()
                .then(_ => {

                    const from = (this.page - 1) * this.perPage
                    const to = from + this.perPage

                    const accounts = []

                    for (let i = from; i < to; i++) {
                        const address = this._addressFromIndex(pathBase, i)
                        accounts.push({
                            address: address,
                            balance: null,
                            index: i,
                        })
                        this.paths[ethUtil.toChecksumAddress(address)] = i

                    }
                    resolve(accounts)
                })
                .catch(e => {
                    reject(e)
                })
        })
    }

    getAccounts () {
        return Promise.resolve(this.accounts.slice())
    }

    removeAccount (address) {
        if (!this.accounts.map(a => a.toLowerCase()).includes(address.toLowerCase())) {
            throw new Error(`Address ${address} not found in this keyring`)
        }
        this.accounts = this.accounts.filter(a => a.toLowerCase() !== address.toLowerCase())
    }

    async signAndSendTransaction (fromAddress, transaction, provider) {
        const unlockResult = await this.unlock();

        if(_.isNil(transaction.getSequenceOverride())){
            let sequence = await provider.getTransactionCount(fromAddress);
            sequence = sequence + 1;
            transaction.setSequence(sequence);
        }
        transaction.setFrom(ethUtil.toChecksumAddress(fromAddress));
        const signedTxRaw = await Trezor.signTransaction(transaction);
        const result = provider.sendTransaction(signedTxRaw);

        return Promise.resolve(result);
    }

    signMessage (withAccount, data) {
        return Promise.reject(new Error('Not supported on this device'))
    }

    // For personal_sign, we need to prefix the message:
    signPersonalMessage (withAccount, message) {
        return Promise.reject(new Error('Not supported on this device'))
    }

    signTypedData (withAccount, typedData) {
        // Waiting on trezor to enable this
        return Promise.reject(new Error('Not supported on this device'))
    }

    exportAccount (address) {
        return Promise.reject(new Error('Not supported on this device'))
    }

    forgetDevice () {
        this.accounts = []
        this.hdk = new HDKey()
        this.page = 0
        this.unlockedAccount = 0
        this.paths = {}
    }

    /* PRIVATE METHODS */

    _normalize (buf) {
        return ethUtil.bufferToHex(buf).toString()
    }

    _addressFromIndex (pathBase, i) {
        const dkey = this.hdk.derive(`${pathBase}/${i}`)
        const address = ethUtil
            .publicToAddress(dkey.publicKey, true)
            .toString('hex');
        return ethUtil.toChecksumAddress(address).toLowerCase()
    }

    _pathFromAddress (address) {
        const checksummedAddress = ethUtil.toChecksumAddress(address)
        let index = this.paths[checksummedAddress]
        if (typeof index === 'undefined') {
            for (let i = 0; i < MAX_INDEX; i++) {
                if (checksummedAddress === this._addressFromIndex(pathBase, i)) {
                    index = i
                    break
                }
            }
        }

        if (typeof index === 'undefined') {
            throw new Error('Unknown address')
        }
        return `${this.hdPath}/${index}`
    }
}

TrezorKeyring.type = keyringType;

export default TrezorKeyring;
