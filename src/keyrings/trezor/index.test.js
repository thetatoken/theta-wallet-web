/** @jest-environment node */

import TrezorConnect from '@trezor/connect-web';
import Trezor from '../../services/Trezor';
import TrezorKeyring from './index';

jest.mock('@trezor/connect-web', () => ({
    __esModule: true,
    default: {
        manifest: jest.fn(),
        ethereumGetPublicKey: jest.fn(),
    },
}));

jest.mock('../../services/Trezor', () => ({
    __esModule: true,
    default: {
        clearDevice: jest.fn(),
        setDevice: jest.fn(),
        signTransaction: jest.fn(),
    },
}));

const parentKeys = [
    ['02c1fe50cf544584cdd8b65d2f5ee973bccaa37c85b292768a6588cb2457a9b4a1', '93a25bad4f08e4940f60b998f380c4ea8cac14d665549e7e64e2a176dfe9ae01'],
    ['037186bd9517bb91c558c47269bacca6837a8adab08e932a0948a84d9a8345db5d', '8a4758ca230e3480a3ae1af8813b16f7841825ebb5a6d6f7d89fec2486f587c5'],
    ['03a89628dc1c09bc34a3ae9b928d4856a77073f1c2552fdf735aa348a7aee8f492', '1dd1d7ba6ad71395d11009d3d0bf08dfa551b0c33785480611cfe0258056ad35'],
    ['034b8a13e4f4247383b396b8302e093cc25aaeb63214f8bce2b170b07f9d3d71ad', '756185297f9f895258b3ff4e910ee624ddc4322b72b690d2dd296d05ca5c2771'],
    ['02895fb53329b5bf640157cef11db7adfacb5d85abb45cae00b0557a03b45e3d3a', 'a78ed9140397e9124d2abdbb59111440e44a6ac8f9e5faf61c8b13b32fd0e9be'],
    ['0286963e8e2a8563dcd85f5fe5acae112f94f675e36ca04333ae176eab0d2d7167', 'd70e39bc10beb18f57cc01475fff6cea3e046076309345d1891c0102a3a7bc00'],
].map(([publicKey, chainCode]) => ({publicKey, chainCode}));

const deviceIdentity = (name, instance = 0) => ({
    path: `webusb:${name}`,
    instance,
    state: {
        staticSessionId: `test-address@${name}:${instance}`,
        sessionId: `${name}-session`,
    },
});

const publicKeyResponse = (parent, device) => ({
    success: true,
    payload: {
        publicKey: parent.publicKey,
        chainCode: parent.chainCode,
    },
    device,
});

describe('TrezorKeyring session integrity', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('refreshes the parent key for every new first-page connection', async () => {
        const firstParent = parentKeys[0];
        const secondParent = parentKeys[1];
        TrezorConnect.ethereumGetPublicKey
            .mockResolvedValueOnce(publicKeyResponse(firstParent, deviceIdentity('first')))
            .mockResolvedValueOnce(publicKeyResponse(secondParent, deviceIdentity('second')));

        const keyring = new TrezorKeyring();
        const firstPage = await keyring.getFirstPage();
        const secondPage = await keyring.getFirstPage();

        expect(TrezorConnect.ethereumGetPublicKey).toHaveBeenCalledTimes(2);
        expect(firstPage[0].address).not.toBe(secondPage[0].address);
        expect(keyring.page).toBe(1);
    });

    it('keeps local paging under one verified parent key', async () => {
        TrezorConnect.ethereumGetPublicKey.mockResolvedValue(
            publicKeyResponse(parentKeys[2], deviceIdentity('paging')),
        );

        const keyring = new TrezorKeyring();
        const firstPage = await keyring.getFirstPage();
        const secondPage = await keyring.getNextPage();

        expect(TrezorConnect.ethereumGetPublicKey).toHaveBeenCalledTimes(1);
        expect(firstPage.map(({index}) => index)).toEqual([0, 1, 2, 3, 4]);
        expect(secondPage.map(({index}) => index)).toEqual([5, 6, 7, 8, 9]);
        expect(firstPage.map(({address}) => address)).toEqual([
            '0x405cf04fc0877753f7fca420720632df1b6b591a',
            '0x94e76320fcfb806bab63225a4b0eea315a47bbb0',
            '0x702bebf35c84144a469a77fd9c6c22acc222046e',
            '0x94b1201543a4292ea0ae60621f81249679780440',
            '0x3c9ddca685aedb9abb45db4765602f8c20cb8bb7',
        ]);
        expect(secondPage.map(({address}) => address)).toEqual([
            '0x1dc0917c5b1840f3b3d6699f1d163fc424a9ffed',
            '0x81b95d727b612ef7191ac50127e5b1ead22b2c96',
            '0x0c6038b7937438198aea85a0a384414816b219d4',
            '0xfc14f18a490873c7a13ef3c2d07ace7078dabf99',
            '0x8170d7b3397f24a835e9da96dbe8c7688ef7a1e9',
        ]);
    });

    it('binds the selected account to the full Trezor device identity', async () => {
        const device = deviceIdentity('hidden-wallet', 2);
        device.state.deriveCardano = false;
        TrezorConnect.ethereumGetPublicKey.mockResolvedValue(
            publicKeyResponse(parentKeys[3], device),
        );

        const keyring = new TrezorKeyring();
        await keyring.getFirstPage();
        keyring.setAccountToUnlock(0);
        const [account] = await keyring.addAccounts();

        expect(Trezor.setDevice).toHaveBeenCalledWith(device);
        expect(keyring.accountDevices[account]).toEqual(device);
        expect(TrezorConnect.ethereumGetPublicKey).toHaveBeenCalledWith({
            path: "m/44'/60'/0'/0",
        });
    });

    it('signs only with the device identity bound to the selected account', async () => {
        const device = deviceIdentity('signing');
        TrezorConnect.ethereumGetPublicKey.mockResolvedValue(
            publicKeyResponse(parentKeys[4], device),
        );
        Trezor.signTransaction.mockResolvedValue('signed-raw-transaction');
        const provider = {
            sendTransaction: jest.fn().mockResolvedValue('transaction-result'),
        };
        const transaction = {
            getSequenceOverride: jest.fn().mockReturnValue(10),
            setFrom: jest.fn(),
        };

        const keyring = new TrezorKeyring();
        await keyring.getFirstPage();
        keyring.setAccountToUnlock(0);
        const [account] = await keyring.addAccounts();
        await keyring.signAndSendTransaction(account, transaction, provider);

        expect(Trezor.signTransaction).toHaveBeenCalledWith(transaction, device);
        expect(provider.sendTransaction).toHaveBeenCalledWith('signed-raw-transaction');
    });

    it('fails closed when Connect does not return session identity', async () => {
        TrezorConnect.ethereumGetPublicKey.mockResolvedValue(
            publicKeyResponse(parentKeys[5], undefined),
        );

        const keyring = new TrezorKeyring();

        await expect(keyring.getFirstPage()).rejects.toThrow('Unable to verify the active Trezor session');
        expect(keyring.isUnlocked()).toBe(false);
    });

    it('does not reuse a stale parent when a later first-page connection fails', async () => {
        TrezorConnect.ethereumGetPublicKey
            .mockResolvedValueOnce(publicKeyResponse(parentKeys[0], deviceIdentity('first')))
            .mockResolvedValueOnce({
                success: false,
                payload: {error: 'Device disconnected'},
            });

        const keyring = new TrezorKeyring();
        await keyring.getFirstPage();
        await expect(keyring.getFirstPage()).rejects.toThrow('Device disconnected');

        expect(keyring.isUnlocked()).toBe(false);
        expect(keyring.device).toBeNull();
    });

    it('does not sign an account that has no verified session binding', async () => {
        const keyring = new TrezorKeyring();
        const provider = {sendTransaction: jest.fn()};
        const transaction = {getSequenceOverride: jest.fn()};

        await expect(keyring.signAndSendTransaction(
            '0x0000000000000000000000000000000000000000',
            transaction,
            provider,
        )).rejects.toThrow('Unable to verify the Trezor session for this account');
        expect(Trezor.signTransaction).not.toHaveBeenCalled();
    });

    it('clears candidate and selected-session state when forgetting the device', () => {
        const keyring = new TrezorKeyring();
        keyring.device = deviceIdentity('forgotten');
        keyring.accountDevices.test = keyring.device;

        keyring.forgetDevice();

        expect(keyring.device).toBeNull();
        expect(keyring.accountDevices).toEqual({});
        expect(Trezor.clearDevice).toHaveBeenCalledTimes(1);
    });
});
