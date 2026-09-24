import React from 'react';
import {constants} from '@thetalabs/theta-js';
import ReactDOM from 'react-dom';
import {act, Simulate} from 'react-dom/test-utils';
import ConfirmTransactionModal from './ConfirmTransactionModal';
import PersonalSignModal from './PersonalSignModal';
import Wallet from '../services/Wallet';
import config from '../Config';
import TemporaryState from '../services/TemporaryState';
import {store} from '../state';
import {approveTransactionRequest, rejectTransactionRequest, executeSignMessage} from '../state/actions/Transactions';

jest.mock('react-redux/es/connect/connect', () => ({__esModule: true, default: map => component => {component.mapForTest = map; return component;}}));
jest.mock('../services/Wallet', () => ({__esModule: true, default: {getWalletHardware: jest.fn()}}));
jest.mock('../state', () => ({store: {dispatch: jest.fn()}}));
jest.mock('../state/actions/Transactions', () => ({approveTransactionRequest: jest.fn(), rejectTransactionRequest: jest.fn(), executeSignMessage: jest.fn()}));
jest.mock('../utils/Utils', () => ({formatNativeTokenAmountToLargestUnit: x => x, formatTNT20TokenAmountToLargestUnit: x => x,
    transactionRequestToTransactionType: () => 'Call Contract', transactionTypeToName: () => 'Send', truncate: x => x}));
jest.mock('../constants/assets', () => ({getAllAssets: () => []}));
jest.mock('../constants/contracts', () => ({TNT20ABI: []}));
jest.mock('../Config', () => ({__esModule: true, default: {isEmbedMode: false}}));
jest.mock('../services/TemporaryState', () => ({__esModule: true, default: {getWalletData: jest.fn()}}));
jest.mock('../libs/tns', () => ({__esModule: true, default: {getDomainName: jest.fn()}}));
jest.mock('../components/SettingContext', () => ({useSettings: () => ({tnsEnable: false})}));

let root, dispatch, onAccept, onReject, props;
beforeEach(() => {
    jest.clearAllMocks(); root = document.createElement('div'); document.body.appendChild(root);
    Wallet.getWalletHardware.mockReturnValue(null); config.isEmbedMode = false;
    window.Web3Bridge = {projectMetadata: {hostname: 'spoofed.example', name: 'Imposter'}};
    dispatch = jest.fn().mockResolvedValue(false); store.dispatch.mockResolvedValue('local-signature');
    onAccept = jest.fn(); onReject = jest.fn();
    props = {selectedAddress: 'sender', transactionRequest: {id: 'correct-id', txType: constants.TxType.Send, txData: {outputs: [{address: 'recipient', tfuelWei: '100'}]}, gasFeeData: {totalGasFee: '1'}},
        assets: [], network: {name: 'Testnet'}, dispatch, onAccept, onReject, origin: 'https://actual.example', dappRequestId: 'dapp-1', isValid: () => true};
});
afterEach(() => {act(() => {ReactDOM.unmountComponentAtNode(root);});root.remove();});
const render = (Component, values = props) => act(() => {ReactDOM.render(<Component {...values}/>, root);});
const button = text => [...root.querySelectorAll('a')].find(a => a.textContent === text);
const password = value => act(() => {Simulate.change(root.querySelector('input'), {target: {name: 'password', value}});});
const click = async text => act(async () => {Simulate.click(button(text));await Promise.resolve();});

test('transaction UI uses pinned origin, recipient/value and correct request id', async () => {
    render(ConfirmTransactionModal); expect(root.textContent).toContain('https://actual.example'); expect(root.textContent).not.toContain('spoofed.example');
    expect(root.textContent).toContain('recipient'); expect(root.textContent).toContain('100');
    password('test-password'); await click('Confirm');
    expect(approveTransactionRequest).toHaveBeenCalledWith('correct-id', 'test-password', 'dapp-1');
});
test('software wallet still requires a password before enabling confirmation', async () => {
    render(ConfirmTransactionModal); await click('Confirm'); expect(approveTransactionRequest).not.toHaveBeenCalled();
    password('temporary'); await click('Confirm'); expect(approveTransactionRequest).toHaveBeenCalledTimes(1);
});
test.each(['trezor', 'ledger'])('%s keeps its hardware confirmation path without a software-password input', async hardware => {
    Wallet.getWalletHardware.mockReturnValue(hardware); render(ConfirmTransactionModal);
    expect(root.querySelector('input')).toBeNull(); await click('Confirm');
    expect(approveTransactionRequest).toHaveBeenCalledWith('correct-id', '', 'dapp-1');
});
test('embed mode keeps its supplied session password', async () => {
    config.isEmbedMode = true; TemporaryState.getWalletData.mockReturnValue({password: 'embed-test-password'});
    render(ConfirmTransactionModal); expect(root.querySelector('input')).toBeNull(); await click('Confirm');
    expect(approveTransactionRequest).toHaveBeenCalledWith('correct-id', 'embed-test-password', 'dapp-1');
});
test('rejection references the displayed transaction and performs no approval', async () => {
    render(ConfirmTransactionModal); await click('Reject');
    expect(rejectTransactionRequest).toHaveBeenCalledWith('correct-id', 'dapp-1'); expect(onReject).toHaveBeenCalledTimes(1); expect(approveTransactionRequest).not.toHaveBeenCalled();
});
test('invalidated request cannot be confirmed even with a password', async () => {
    props.isValid = () => false; render(ConfirmTransactionModal); password('test'); await click('Confirm'); expect(approveTransactionRequest).not.toHaveBeenCalled();
});
test('transaction double-click has one in-flight action', async () => {
    let finish; dispatch.mockReturnValue(new Promise(resolve => {finish = resolve;})); render(ConfirmTransactionModal); password('test');
    act(() => {Simulate.click(button('Confirm')); Simulate.click(button('Confirm'));});
    expect(approveTransactionRequest).toHaveBeenCalledTimes(1);
    await act(async () => {finish({hash: 'synthetic'}); await Promise.resolve();}); expect(onAccept).toHaveBeenCalledWith('synthetic');
});
test('transaction selector binds id even when another request is first', () => {
    const state = {thetaWallet: {selectedAddress: 'sender', identities: {}, accounts: {}, transactionRequests: [{id: 'wrong'}, {id: 'right'}], tokens: [], network: {chainId: 'testnet'}}};
    expect(ConfirmTransactionModal.mapForTest(state, {transactionRequestId: 'right'}).transactionRequest.id).toBe('right');
    expect(ConfirmTransactionModal.mapForTest(state, {transactionRequestId: 'missing'}).transactionRequest).toBeUndefined();
});
test('native confirmation without a dApp origin does not show stale project metadata', () => {
    props.origin = undefined; props.isValid = undefined; render(ConfirmTransactionModal);
    expect(root.textContent).not.toContain('Requesting website'); expect(root.textContent).not.toContain('spoofed.example');
});
test('personal signing displays origin and exact text; rejection never invokes signing', async () => {
    render(PersonalSignModal, {...props, message: 'Local test message'});
    expect(root.textContent).toContain('Local test message'); expect(root.textContent).toContain('https://actual.example');
    expect(root.textContent).not.toContain('spoofed.example'); await click('Reject'); expect(executeSignMessage).not.toHaveBeenCalled(); expect(onReject).toHaveBeenCalledTimes(1);
});
test('personal sign confirmation is explicit and rechecks validity', async () => {
    let valid = true; render(PersonalSignModal, {...props, message: 'Local test', isValid: () => valid}); valid = false;
    await click('Confirm'); expect(executeSignMessage).not.toHaveBeenCalled();
});
test('personal signing double-click executes once', async () => {
    let finish; store.dispatch.mockReturnValue(new Promise(resolve => {finish = resolve;})); render(PersonalSignModal, {...props, message: 'Local test'});
    act(() => {Simulate.click(button('Confirm')); Simulate.click(button('Confirm'));}); expect(executeSignMessage).toHaveBeenCalledTimes(1);
    await act(async () => {finish('synthetic-signature'); await Promise.resolve();}); expect(onAccept).toHaveBeenCalledWith('synthetic-signature');
});
