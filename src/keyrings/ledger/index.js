import TransportU2F from "@ledgerhq/hw-transport-u2f";
import TransportWebUSB from "@ledgerhq/hw-transport-webusb";
import Eth from "@ledgerhq/hw-app-eth";
import _ from "lodash";
import Ledger from "../../services/Ledger";

const {EventEmitter} = require('events')
const HDKey = require('hdkey')
const ethUtil = require('ethereumjs-util')

const hdPathString = `m/44'/60'/0'`
const type = 'Ledger Hardware'
const pathBase = 'm'
const MAX_INDEX = 1000

class LedgerKeyring extends EventEmitter {
    constructor (opts = {}) {
        super()
        this.accountIndexes = {}
        this.type = type
        this.page = 0
        this.perPage = 5
        this.unlockedAccount = 0
        this.hdk = new HDKey()
        this.paths = {}
        this.deserialize(opts)
    }

    serialize () {
        return Promise.resolve({
            hdPath: this.hdPath,
            accounts: this.accounts,
            accountIndexes: this.accountIndexes,
        })
    }

    deserialize (opts = {}) {
        this.hdPath = opts.hdPath || hdPathString
        this.accounts = opts.accounts || []
        this.accountIndexes = opts.accountIndexes || {}

        if (this._isBIP44()) {
            // Remove accounts that don't have corresponding account indexes
            this.accounts = this.accounts
                .filter(account => Object.keys(this.accountIndexes).includes(ethUtil.toChecksumAddress(account)))
        }

        return Promise.resolve()
    }

    isUnlocked () {
        return !!(this.hdk && this.hdk.publicKey)
    }

    setAccountToUnlock (index) {
        this.unlockedAccount = parseInt(index, 10)
    }

    setHdPath (hdPath) {
        // Reset HDKey if the path changes
        if (this.hdPath !== hdPath) {
            this.hdk = new HDKey()
        }
        this.hdPath = hdPath
    }

    unlock (hdPath) {
        if (this.isUnlocked() && !hdPath) return Promise.resolve('already unlocked')
        const path = hdPath ? this._toLedgerPath(hdPath) : this.hdPath
        return new Promise(async (resolve, reject) => {
            try {
                const app = await this._getETH();
                const payload = await app.getAddress(path, false, true);
                this.hdk.publicKey = new Buffer(payload.publicKey, 'hex');
                this.hdk.chainCode = new Buffer(payload.chainCode, 'hex');

                resolve(payload.address.toLowerCase());
            }
            catch (e) {
                reject(new Error(e.message || 'Unknown error'))
            }
        })
    }

    addAccounts (n = 1) {
        return new Promise((resolve, reject) => {
            this.unlock()
                .then(async _ => {
                    const from = this.unlockedAccount
                    const to = from + n
                    this.accounts = []
                    for (let i = from; i < to; i++) {
                        let address
                        if (this._isBIP44()) {
                            const path = this._getPathForIndex(i)
                            address = await this.unlock(path)
                            this.accountIndexes[ethUtil.toChecksumAddress(address)] = i
                        } else {
                            address = this._addressFromIndex(pathBase, i)
                        }
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

    getAccounts () {
        return Promise.resolve(this.accounts.slice())
    }

    removeAccount (address) {
        if (!this.accounts.map(a => a.toLowerCase()).includes(address.toLowerCase())) {
            throw new Error(`Address ${address} not found in this keyring`)
        }
        this.accounts = this.accounts.filter(a => a.toLowerCase() !== address.toLowerCase())
        delete this.accountIndexes[ethUtil.toChecksumAddress(address)]
    }

    async signAndSendTransaction (fromAddress, transaction, provider) {
        const unlockResult = await this.unlock();
        let hdPath;
        if (this._isBIP44()) {
            const checksummedAddress = ethUtil.toChecksumAddress(fromAddress)
            if (!Object.keys(this.accountIndexes).includes(checksummedAddress)) {
                throw (new Error(`Ledger: Index for address '${checksummedAddress}' not found`))
            }
            hdPath = this._getPathForIndex(this.accountIndexes[checksummedAddress])
        } else {
            hdPath = this._toLedgerPath(this._pathFromAddress(fromAddress))
        }

        if(_.isNil(transaction.getSequenceOverride())){
            let sequence = await provider.getTransactionCount(fromAddress);
            sequence = sequence + 1;
            transaction.setSequence(sequence);
        }
        transaction.setFrom(ethUtil.toChecksumAddress(fromAddress));

        const app = await this._getETH();
        const signedTxRaw = await Ledger.signTransaction(app, hdPath, transaction);
        const result = provider.sendTransaction(signedTxRaw);

        return Promise.resolve(result);
    }

    signMessage (withAccount, data) {
        throw new Error('Not supported on this device')
    }

    // For personal_sign, we need to prefix the message:
    signPersonalMessage (withAccount, message) {
        throw new Error('Not supported on this device')
    }

    signTypedData (withAccount, typedData) {
        throw new Error('Not supported on this device')
    }

    exportAccount (address) {
        throw new Error('Not supported on this device')
    }

    forgetDevice () {
        this.accounts = []
        this.page = 0
        this.unlockedAccount = 0
        this.paths = {}
        this.hdk = new HDKey()
    }

    /* PRIVATE METHODS */

    async _getPage (increment) {
        this.page += increment

        if (this.page <= 0) { this.page = 1 }
        const from = (this.page - 1) * this.perPage
        const to = from + this.perPage

        await this.unlock()
        let accounts
        if (this._isBIP44()) {
            accounts = await this._getAccountsBIP44(from, to)
        } else {
            accounts = this._getAccountsLegacy(from, to)
        }
        return accounts
    }

    async _getAccountsBIP44 (from, to) {
        const accounts = []

        for (let i = from; i < to; i++) {
            const path = this._getPathForIndex(i)
            const address = await this.unlock(path)
            accounts.push({
                address: address.toLowerCase(),
                balance: null,
                index: i,
            })
        }
        return accounts
    }

    _getAccountsLegacy (from, to) {
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
        return accounts
    }

    _padLeftEven (hex) {
        return hex.length % 2 !== 0 ? `0${hex}` : hex
    }

    _normalize (buf) {
        return this._padLeftEven(ethUtil.bufferToHex(buf).toLowerCase())
    }

    _addressFromIndex (pathBase, i) {
        const dkey = this.hdk.derive(`${pathBase}/${i}`)
        const address = ethUtil
            .publicToAddress(dkey.publicKey, true)
            .toString('hex')
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
        return this._getPathForIndex(index)
    }

    _getPathForIndex (index) {
        // Check if the path is BIP 44 (Ledger Live)
        return this._isBIP44() ? `m/44'/60'/${index}'/0/0` : `${this.hdPath}${index}`
    }

    _isBIP44 () {
        return this.hdPath === `m/44'/60'/0'/0/0`
    }

    _toLedgerPath (path) {
        return path.toString().replace('m/', '')
    }

    async _getETH () {
        let transport;
        if(navigator.userAgent.toLowerCase().indexOf('firefox') > -1){
            transport = await TransportU2F.create();
        }
        else {
            transport = await TransportWebUSB.create();
        }
        const app = new Eth(transport);

        return app;
    }
}

LedgerKeyring.type = type;

export default LedgerKeyring;
