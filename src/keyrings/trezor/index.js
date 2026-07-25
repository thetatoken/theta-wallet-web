import _ from 'lodash';
import Trezor from "../../services/Trezor";
import TrezorConnect from '@trezor/connect-web';
import {
    createTrezorDiagnosticReport,
    normalizeDiagnosticAddress,
    sanitizeDiagnosticErrorCode,
} from './diagnostics';
const { EventEmitter } = require('events')
const ethUtil = require('ethereumjs-util')
const HDKey = require('hdkey')

const hdPathString = `m/44'/60'/0'/0`
const keyringType = 'Trezor Hardware'
const pathBase = 'm'
const MAX_INDEX = 1000
const DELAY_BETWEEN_POPUPS = 1000
const TREZOR_CONNECT_MANIFEST = {
    email: 'walletsupport@thetanetwork.org',
    appUrl: 'https://wallet.thetatoken.org',
    appName: 'Theta Wallet',
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
        this.device = null
        this.accountDevices = {}
        this.diagnosticPublicKeyCheck = null
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
            TrezorConnect.ethereumGetPublicKey({
                path: this.hdPath
            }).then(response => {
                if (response.success) {
                    const device = this._deviceIdentity(response.device)
                    if (!device) {
                        reject(new Error('Unable to verify the active Trezor session. Please reconnect your device.'))
                        return
                    }

                    const hdk = new HDKey()
                    hdk.publicKey = Buffer.from(response.payload.publicKey, 'hex')
                    hdk.chainCode = Buffer.from(response.payload.chainCode, 'hex')
                    this.hdk = hdk
                    this.device = device
                    this.diagnosticPublicKeyCheck = {
                        success: true,
                        publicKeyBytes: hdk.publicKey.length,
                        chainCodeBytes: hdk.chainCode.length,
                        returnedPathMatches: response.payload.serializedPath === this.hdPath,
                        deviceStateAvailable: true,
                    }
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
                        this.accountDevices[address.toLowerCase()] = this.device
                        this.page = 0
                    }
                    Trezor.setDevice(this.device)
                    resolve(this.accounts)
                })
                .catch(e => {
                    reject(e)
                })
        })
    }

    getFirstPage () {
        this._resetSessionCandidate()
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

    async runDiagnostics (index, uiAddress) {
        const validIndex = typeof index === 'number'
            && Number.isSafeInteger(index)
            && index >= 0
            && index < MAX_INDEX
        const childPath = validIndex ? `${this.hdPath}/${index}` : 'UNKNOWN'
        const emptyAddressCheck = {
            success: false,
            returnedPathMatches: false,
            deviceStateAvailable: false,
            displayConfirmed: false,
        }
        const publicKeyCheck = this.diagnosticPublicKeyCheck || {
            success: false,
            publicKeyBytes: 0,
            chainCodeBytes: 0,
            returnedPathMatches: false,
            deviceStateAvailable: false,
        }
        const createReport = (addressCheck, comparison, error) => (
            createTrezorDiagnosticReport({
                parentPath: this.hdPath,
                childPath,
                publicKeyCheck,
                addressCheck,
                comparison,
                error,
            })
        )

        if (!validIndex
            || !this.isUnlocked()
            || !this.device
            || !this.diagnosticPublicKeyCheck) {
            return createReport(emptyAddressCheck, null, {
                stage: 'precondition',
                code: 'UNKNOWN',
            })
        }

        const boundDevice = this.device
        let localAddress
        try {
            localAddress = this._addressFromIndex(pathBase, index)
        }
        catch (error) {
            return createReport(emptyAddressCheck, null, {
                stage: 'precondition',
                code: 'UNKNOWN',
            })
        }

        try {
            const response = await TrezorConnect.ethereumGetAddress({
                device: boundDevice,
                path: childPath,
                showOnTrezor: true,
                chunkify: true,
            })

            if (!response.success) {
                return createReport(emptyAddressCheck, null, {
                    stage: 'getAddress',
                    code: sanitizeDiagnosticErrorCode(response.payload && response.payload.code),
                })
            }

            const responseDevice = this._deviceIdentity(response.device)
            const normalizedLocalAddress = normalizeDiagnosticAddress(localAddress)
            const normalizedDeviceAddress = normalizeDiagnosticAddress(
                response.payload && response.payload.address,
            )
            const normalizedUiAddress = normalizeDiagnosticAddress(uiAddress)
            const addressCheck = {
                success: Boolean(normalizedDeviceAddress),
                returnedPathMatches: response.payload.serializedPath === childPath,
                deviceStateAvailable: Boolean(responseDevice),
                displayConfirmed: true,
            }

            if (!responseDevice || !normalizedDeviceAddress || !normalizedLocalAddress || !normalizedUiAddress) {
                return createReport(addressCheck, null, {
                    stage: 'comparison',
                    code: 'UNKNOWN',
                })
            }

            return createReport(addressCheck, {
                sameDeviceWalletState:
                    this.device === boundDevice
                    && boundDevice.state.staticSessionId === responseDevice.state.staticSessionId,
                localMatchesDevice: normalizedLocalAddress === normalizedDeviceAddress,
                uiMatchesLocal: normalizedUiAddress === normalizedLocalAddress,
            }, null)
        }
        catch (error) {
            return createReport(emptyAddressCheck, null, {
                stage: 'getAddress',
                code: sanitizeDiagnosticErrorCode(error && error.code),
            })
        }
    }

    removeAccount (address) {
        if (!this.accounts.map(a => a.toLowerCase()).includes(address.toLowerCase())) {
            throw new Error(`Address ${address} not found in this keyring`)
        }
        this.accounts = this.accounts.filter(a => a.toLowerCase() !== address.toLowerCase())
    }

    async signAndSendTransaction (fromAddress, transaction, provider) {
        const device = this.accountDevices[fromAddress.toLowerCase()]
        if (!device) {
            throw new Error('Unable to verify the Trezor session for this account. Please reconnect your device.')
        }

        if(_.isNil(transaction.getSequenceOverride())){
            let sequence = await provider.getTransactionCount(fromAddress);
            sequence = sequence + 1;
            transaction.setSequence(sequence);
        }
        transaction.setFrom(ethUtil.toChecksumAddress(fromAddress));
        const signedTxRaw = await Trezor.signTransaction(transaction, device);
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
        this.device = null
        this.accountDevices = {}
        this.diagnosticPublicKeyCheck = null
        Trezor.clearDevice()
    }

    /* PRIVATE METHODS */

    _resetSessionCandidate () {
        this.hdk = new HDKey()
        this.device = null
        this.page = 0
        this.paths = {}
        this.diagnosticPublicKeyCheck = null
    }

    _deviceIdentity (device) {
        const staticSessionId = device && device.state && device.state.staticSessionId
        if (!staticSessionId) return null

        const identity = {
            state: {
                staticSessionId: staticSessionId,
            },
        }
        if (device.path) identity.path = device.path
        if (Number.isInteger(device.instance)) identity.instance = device.instance
        if (typeof device.state.sessionId === 'string') identity.state.sessionId = device.state.sessionId
        if (typeof device.state.deriveCardano === 'boolean') identity.state.deriveCardano = device.state.deriveCardano
        return identity
    }

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
