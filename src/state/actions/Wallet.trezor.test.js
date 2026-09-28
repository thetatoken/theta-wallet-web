/** @jest-environment node */

import TrezorConnect from '@trezor/connect-web';
import Alerts from '../../services/Alerts';
import Wallet from '../../services/Wallet';
import {
    TREZOR_DIAGNOSTIC_CONNECTION_TIMEOUT_CODE,
} from '../../keyrings/trezor/diagnostics';
import {connectHardware} from './Wallet';
import {hideLoader, showLoader} from './ui';

jest.mock('@trezor/connect-web', () => ({
    __esModule: true,
    default: {
        cancel: jest.fn(),
    },
}));

jest.mock('../../services/Alerts', () => ({
    __esModule: true,
    default: {
        showError: jest.fn(),
    },
}));

jest.mock('../../services/Wallet', () => ({
    __esModule: true,
    default: {
        controller: {
            connectHardware: jest.fn(),
        },
    },
    WalletUnlockStrategy: {},
}));

jest.mock('../../services/Api', () => ({
    __esModule: true,
    default: {},
}));

jest.mock('./Api', () => ({
    reduxFetch: jest.fn(),
}));

jest.mock('../../services/TemporaryState', () => ({
    __esModule: true,
    default: {
        setWalletData: jest.fn(),
    },
}));

jest.mock('./Transactions', () => ({
    resetTransactionsState: jest.fn(),
}));

jest.mock('../../services/Router', () => ({
    __esModule: true,
    default: {
        push: jest.fn(),
    },
}));

jest.mock('../../utils/Utils', () => ({
    onLine: jest.fn(),
}));

jest.mock('../../Config', () => ({
    __esModule: true,
    default: {
        defaultThetaChainID: 'test',
        isEmbedMode: false,
    },
}));

jest.mock('../../services/Theta', () => ({
    __esModule: true,
    default: {
        getChainID: jest.fn(),
        setChainID: jest.fn(),
    },
}));

jest.mock('../../utils/SafeLocalStorage', () => ({
    __esModule: true,
    default: {
        setItem: jest.fn(),
    },
}));

jest.mock('./ui', () => ({
    hideLoader: jest.fn(() => ({type: 'HIDE_LOADER'})),
    hideModal: jest.fn(),
    showLoader: jest.fn(message => ({type: 'SHOW_LOADER', message})),
    showModal: jest.fn(),
}));

describe('Trezor hardware connection action', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('cancels the SDK call and hides the loader after a diagnostic timeout', async () => {
        jest.useFakeTimers();
        Wallet.controller.connectHardware.mockReturnValue(new Promise(() => {}));
        const dispatch = jest.fn();
        const result = connectHardware(
            'trezor',
            0,
            "m/44'/60'/0'/0/",
            1000,
        )(dispatch);

        jest.advanceTimersByTime(1000);

        await expect(result).rejects.toMatchObject({
            code: TREZOR_DIAGNOSTIC_CONNECTION_TIMEOUT_CODE,
        });
        expect(TrezorConnect.cancel).toHaveBeenCalledWith(
            'Trezor diagnostic connection timed out',
        );
        expect(showLoader).toHaveBeenCalledWith('Looking for your Trezor...');
        expect(hideLoader).toHaveBeenCalledTimes(1);
        expect(Alerts.showError).toHaveBeenCalledWith(
            'Trezor diagnostic connection timed out',
        );
    });

    it('does not apply a timeout or cancellation in the normal connection path', async () => {
        const accounts = [{address: '0x1', index: 0}];
        Wallet.controller.connectHardware.mockResolvedValue(accounts);
        const dispatch = jest.fn();

        await expect(connectHardware(
            'trezor',
            0,
            "m/44'/60'/0'/0/",
        )(dispatch)).resolves.toEqual(accounts);

        expect(TrezorConnect.cancel).not.toHaveBeenCalled();
        expect(Alerts.showError).not.toHaveBeenCalled();
        expect(hideLoader).toHaveBeenCalledTimes(1);
    });
});
