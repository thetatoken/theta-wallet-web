export default class TemporaryState {
    static _wallet = null;
    static _mnemonic = null;

    static getWallet() {
        return this._wallet;
    }

    static setWallet(wallet) {
        this._wallet = wallet;
    }

    static getMnemonic() {
        return this._mnemonic;
    }

    static setMnemonic(mnemonic) {
        this._mnemonic = mnemonic;
    }
}