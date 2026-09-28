/** @jest-environment node */
import {createTransactionRequest, approveTransactionRequest} from './Transactions';
import Wallet from '../../services/Wallet';
import {sleep} from '../../utils/Utils';
import Alerts from '../../services/Alerts';
jest.mock('../../services/Api', () => ({__esModule: true, default: {}}));
jest.mock('./Api', () => ({reduxFetch: jest.fn()}));
jest.mock('../../services/Wallet', () => ({__esModule: true, default: {verifyPassword: jest.fn(), controller: {transactionsController: {pendingTransactionRequests: new Map()}, RPCApi: {addTransactionRequest: jest.fn(), approveTransactionRequest: jest.fn()}}}}));
jest.mock('../../services/Theta', () => ({__esModule: true, default: {}}));
jest.mock('../../Config', () => ({__esModule: true, default: {}}));
jest.mock('../../services/Alerts', () => ({__esModule: true, default: {showError: jest.fn()}}));
jest.mock('../../libs/thetajs.esm', () => ({__esModule: true, default: {}}));
jest.mock('../../services/Router', () => ({__esModule: true, default: {}}));
jest.mock('./Wallet', () => ({updateAccountStakes: jest.fn()}));
jest.mock('../../utils/Utils', () => ({sleep: jest.fn()}));
let dispatch;
beforeEach(() => {
    jest.clearAllMocks(); dispatch = jest.fn(); global.window = {location: {href: '/wallet'}};
    Wallet.verifyPassword.mockReturnValue(true); sleep.mockResolvedValue();
    Wallet.controller.RPCApi.approveTransactionRequest.mockResolvedValue({hash: 'synthetic'});
});
test('modal opens only on queue readiness and carries the exact id and origin', async () => {
    let args, finish; Wallet.controller.RPCApi.addTransactionRequest.mockImplementation(a => {args = a; return new Promise(resolve => {finish = resolve;});});
    const isValid = () => true;
    const pending = createTransactionRequest({txType: 7}, {origin: 'https://verified.example', isValid, dappRequestId: 'dapp-1'})(dispatch);
    expect(dispatch).not.toHaveBeenCalled(); args.onCreated('request-42');
    const shown = dispatch.mock.calls[0][0].modal.props;
    expect(shown).toMatchObject({transactionRequestId: 'request-42', origin: 'https://verified.example', dappRequestId: 'dapp-1'});
    expect(shown.isValid).toBe(isValid); finish(false); await pending;
});
test('async preparation failure cannot open a confirmation', async () => {
    Wallet.controller.RPCApi.addTransactionRequest.mockRejectedValue(new Error('gas estimation failed'));
    const onError = jest.fn(); await createTransactionRequest({}, {onError})(dispatch);
    expect(onError).toHaveBeenCalledTimes(1); expect(dispatch).not.toHaveBeenCalled();
});
test('wrong password never reaches the transaction approval API', async () => {
    Wallet.verifyPassword.mockReturnValue(false); await approveTransactionRequest('id', 'wrong', 'dapp-1')(dispatch);
    expect(Wallet.controller.RPCApi.approveTransactionRequest).not.toHaveBeenCalled(); expect(Alerts.showError).toHaveBeenCalledWith('Wrong password. Your transaction could not be signed.');
});
test('approval closes only the matching dApp modal', async () => {
    await approveTransactionRequest('id', 'correct', 'dapp-1')(dispatch);
    expect(dispatch.mock.calls.map(([a]) => a).some(a => a.dappRequestId === 'dapp-1')).toBe(true);
});
test('a falsy signing result leaves confirmation open for rejection/retry', async () => {
    Wallet.controller.RPCApi.approveTransactionRequest.mockResolvedValue(false);
    await approveTransactionRequest('id', 'correct', 'dapp-1')(dispatch);
    expect(dispatch.mock.calls.map(([a]) => a).some(a => a.dappRequestId === 'dapp-1')).toBe(false);
});
