import TrezorConnect from '@trezor/connect-web';
import ThetaJS from '../libs/thetajs.esm';
import Wallet from './Wallet';
import Trezor from './Trezor';

jest.mock('@trezor/connect-web', () => ({
    __esModule: true,
    default: {
        ethereumSignTransaction: jest.fn(),
    },
}));

jest.mock('../libs/thetajs.esm', () => ({
    __esModule: true,
    default: {
        TxSigner: {
            serializeTx: jest.fn(),
        },
    },
}));

jest.mock('./Theta.js', () => ({
    __esModule: true,
    default: {
        prepareTxPayload: jest.fn().mockReturnValue('prepared-payload'),
    },
}));

jest.mock('./Wallet', () => ({
    __esModule: true,
    default: {
        getWalletPath: jest.fn(),
    },
}));

jest.mock('web3', () => ({
    __esModule: true,
    default: function Web3() {
        this.utils = {
            toHex: jest.fn().mockReturnValue('0x0'),
        };
    },
}));

const deviceIdentity = (name) => ({
    path: `webusb:${name}`,
    instance: 0,
    state: {
        staticSessionId: `test-address@${name}:0`,
        sessionId: `${name}-session`,
    },
});

const successfulSignature = (device) => ({
    success: true,
    payload: {
        r: `0x${'1'.repeat(64)}`,
        s: `0x${'2'.repeat(64)}`,
        v: '0x25',
    },
    device,
});

describe('Trezor transaction session integrity', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        Trezor.clearDevice();
        Wallet.getWalletPath.mockReturnValue("m/44'/60'/0'/0/0");
        ThetaJS.TxSigner.serializeTx.mockReturnValue(Buffer.from('abcd', 'hex'));
    });

    it('passes the selected device identity into Connect and accepts the same session', async () => {
        const device = deviceIdentity('selected');
        const transaction = {setSignature: jest.fn()};
        Trezor.setDevice(device);
        TrezorConnect.ethereumSignTransaction.mockResolvedValue(successfulSignature(device));

        await expect(Trezor.signTransaction(transaction)).resolves.toBe('abcd');

        expect(TrezorConnect.ethereumSignTransaction).toHaveBeenCalledWith(
            expect.objectContaining({
                device,
                path: "m/44'/60'/0'/0/0",
            }),
        );
        expect(transaction.setSignature).toHaveBeenCalledTimes(1);
    });

    it('rejects a successful signature returned from a different Trezor session', async () => {
        const selected = deviceIdentity('selected');
        const different = deviceIdentity('different');
        const transaction = {setSignature: jest.fn()};
        TrezorConnect.ethereumSignTransaction.mockResolvedValue(successfulSignature(different));

        await expect(Trezor.signTransaction(transaction, selected)).rejects.toThrow(
            'The active Trezor session changed',
        );
        expect(transaction.setSignature).not.toHaveBeenCalled();
    });

    it('fails before calling Connect when no verified session is selected', async () => {
        await expect(Trezor.signTransaction({})).rejects.toThrow(
            'Unable to verify the active Trezor session',
        );
        expect(TrezorConnect.ethereumSignTransaction).not.toHaveBeenCalled();
    });

    it('surfaces an unsuccessful Connect response without processing a signature', async () => {
        const device = deviceIdentity('selected');
        const transaction = {setSignature: jest.fn()};
        TrezorConnect.ethereumSignTransaction.mockResolvedValue({
            success: false,
            payload: {error: 'Signing cancelled'},
        });

        await expect(Trezor.signTransaction(transaction, device)).rejects.toThrow('Signing cancelled');
        expect(transaction.setSignature).not.toHaveBeenCalled();
    });
});
