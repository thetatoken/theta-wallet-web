export default class TemporaryState {
    static _walletData = null;

    static getWalletData() {
        return this._walletData;
    }

    static setWalletData(data) {
        this._walletData = data;
    }
}