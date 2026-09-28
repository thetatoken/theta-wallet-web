/** @jest-environment node */
import TransactionsController from './transactions';
import * as thetajs from '@thetalabs/theta-js';

jest.mock('@thetalabs/theta-js', () => ({transactions: {transactionFromJson: jest.fn()}}));
jest.mock('../constants/Metachain', () => ({getExplorerApiUrl: jest.fn()}));
let controller, tx, active, onCreated, guard, address, send;
const flush = () => new Promise(resolve => setImmediate(resolve));
beforeEach(() => {
    jest.useRealTimers(); jest.clearAllMocks(); active = true; address = 'account-a';
    tx = {setFrom: jest.fn()}; thetajs.transactions.transactionFromJson.mockReturnValue(tx);
    send = jest.fn().mockResolvedValue({hash: 'local-test-hash'});
    controller = new TransactionsController({preferencesController: {getSelectedAddress: () => address},
        signAndSendTransaction: send, getProvider: () => ({}), updateAccounts: jest.fn(), detectNewTokens: jest.fn()});
    controller.getEstimatedGasData = jest.fn().mockResolvedValue({gasPrice: '1', gasLimit: 100, totalGasFee: '100'});
    guard = () => active; onCreated = jest.fn();
});
afterEach(() => jest.useRealTimers());
const queue = (options = {onCreated, isValid: guard}) => controller.addTransactionRequest({txType: 7, txData: {to: 'test-only'}}, options);

test('publishes ready request after estimation while result promise waits for user decision', async () => {
    let finishGas; controller.getEstimatedGasData.mockReturnValue(new Promise(resolve => {finishGas = resolve;}));
    const pending = queue(); expect(onCreated).not.toHaveBeenCalled();
    finishGas({gasPrice: '1'}); await flush();
    const id = onCreated.mock.calls[0][0]; expect(controller.pendingTransactionRequests.has(id)).toBe(true);
    expect(controller._getTransactionRequest(id).gasFeeData.gasPrice).toBe('1');
    await controller.rejectTransactionRequest(id); await expect(pending).resolves.toBe(false);
});
test('reject removes the map and visible request, settles result and cannot sign later', async () => {
    const pending = queue(); await flush(); const id = onCreated.mock.calls[0][0];
    await controller.rejectTransactionRequest(id); await expect(pending).resolves.toBe(false);
    expect(controller.pendingTransactionRequests.size).toBe(0); expect(controller._getTransactionRequests()).toEqual([]);
    await expect(controller.approveTransactionRequest(id)).rejects.toThrow('no longer available'); expect(send).not.toHaveBeenCalled();
});
test('a session revoked during gas estimation cannot create a pending request', async () => {
    let finishGas; controller.getEstimatedGasData.mockReturnValue(new Promise(resolve => {finishGas = resolve;}));
    const pending = queue(); active = false; finishGas({});
    await expect(pending).rejects.toThrow('session ended'); expect(onCreated).not.toHaveBeenCalled(); expect(controller.pendingTransactionRequests.size).toBe(0);
});
test('an expired session cannot enter gas estimation', async () => {
    active = false; await expect(queue()).rejects.toThrow('session ended'); expect(controller.getEstimatedGasData).not.toHaveBeenCalled();
});
test('gas estimation failure creates neither a modal callback nor a pending transaction', async () => {
    controller.getEstimatedGasData.mockRejectedValue(new Error('gas unavailable'));
    await expect(queue()).rejects.toThrow('gas unavailable'); expect(onCreated).not.toHaveBeenCalled(); expect(controller.pendingTransactionRequests.size).toBe(0);
});
test('confirmation rechecks validity after the UI has opened', async () => {
    const pending = queue(); await flush(); const id = onCreated.mock.calls[0][0]; active = false;
    await expect(controller.approveTransactionRequest(id)).rejects.toThrow('no longer available'); expect(send).not.toHaveBeenCalled();
    await controller.rejectTransactionRequest(id); await pending;
});
test('duplicate confirmation cannot dispatch a second signing operation', async () => {
    let finishSend; send.mockReturnValue(new Promise(resolve => {finishSend = resolve;}));
    const pending = queue(); await flush(); const id = onCreated.mock.calls[0][0];
    const first = controller.approveTransactionRequest(id);
    await expect(controller.approveTransactionRequest(id)).rejects.toThrow('no longer available'); expect(send).toHaveBeenCalledTimes(1);
    jest.useFakeTimers(); finishSend({hash: 'synthetic'}); await first; await expect(pending).resolves.toEqual({hash: 'synthetic'});
    expect(controller.pendingTransactionRequests.size).toBe(0); jest.runAllTimers();
});
test('native transaction path still approves and resolves without dApp callbacks', async () => {
    const pending = queue({}); await flush(); const id = controller._getTransactionRequests()[0].id;
    jest.useFakeTimers(); await expect(controller.approveTransactionRequest(id)).resolves.toEqual({hash: 'local-test-hash'});
    await expect(pending).resolves.toEqual({hash: 'local-test-hash'}); expect(send).toHaveBeenCalledWith('account-a', tx, {}); jest.runAllTimers();
});
test('a signing failure leaves a request available for retry or reject', async () => {
    send.mockRejectedValue(new Error('device rejected')); const pending = queue(); await flush(); const id = onCreated.mock.calls[0][0];
    await expect(controller.approveTransactionRequest(id)).rejects.toThrow('device rejected');
    expect(controller.pendingTransactionRequests.get(id).approving).toBe(false);
    await controller.rejectTransactionRequest(id); await expect(pending).resolves.toBe(false);
});

test('disconnect cannot falsely reject a transaction already approved and signing', async () => {
    let finishSend; send.mockReturnValue(new Promise(resolve => {finishSend = resolve;}));
    const pending = queue(); await flush(); const id = onCreated.mock.calls[0][0];
    const approved = controller.approveTransactionRequest(id); active = false;
    await expect(controller.rejectTransactionRequest(id)).resolves.toBe(false);
    expect(controller.pendingTransactionRequests.has(id)).toBe(true);
    jest.useFakeTimers(); finishSend({hash: 'already-approved'}); await approved;
    await expect(pending).resolves.toEqual({hash: 'already-approved'}); expect(controller.pendingTransactionRequests.size).toBe(0); jest.runAllTimers();
});
test('a signing failure after disconnect cleans up the invalid request', async () => {
    let failSend; send.mockReturnValue(new Promise((resolve, reject) => {failSend = reject;}));
    const pending = queue(); await flush(); const id = onCreated.mock.calls[0][0];
    const approved = controller.approveTransactionRequest(id); active = false; failSend(new Error('device cancelled'));
    await expect(approved).rejects.toThrow('device cancelled'); await expect(pending).resolves.toBe(false);
    expect(controller.pendingTransactionRequests.size).toBe(0);
});
