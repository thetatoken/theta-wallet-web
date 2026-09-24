jest.mock('../Config', () => ({__esModule: true, default: {}}));
import Web3Bridge from './Web3Bridge';
import {store} from '../state';
import Wallet from './Wallet';
import {createTransactionRequest} from '../state/actions/Transactions';
import {getChainByChainIdNum} from '../utils/Utils';
import {getNetworkForChainId} from '@thetalabs/theta-js/src/networks';

jest.mock('../state', () => ({store: {getState: jest.fn(), dispatch: jest.fn(), subscribe: jest.fn()}}));
jest.mock('../utils/Utils', () => ({getChainByChainIdNum: jest.fn(id => id === 365 ? {chainId: 'testnet', name: 'Testnet'} : null)}));
jest.mock('../state/actions/Wallet', () => ({setNetwork: network => ({type: 'SET_NETWORK', network})}));
jest.mock('@thetalabs/theta-js/src/networks', () => ({getNetworkForChainId: jest.fn(chain => ({chainIdNum: chain === 'mainnet' ? 361 : 365, ethRpcUrl: 'https://rpc.invalid'}))}));
jest.mock('./Wallet', () => ({__esModule: true, default: {unlocked: jest.fn(), controller: {RPCApi: {rejectTransactionRequest: jest.fn()}}}}));
jest.mock('../state/actions/Transactions', () => ({createTransactionRequest: jest.fn()}));
jest.mock('@thetalabs/theta-js/src/constants', () => ({TxType: {SmartContract: 7}}));

const address = '0x0000000000000000000000000000000000000001';
let bridge, state, frame, notify;
const request = (method, params = [], extra = {}) => bridge.handleMessage({
    origin: 'https://dapp.example', source: frame.contentWindow,
    data: JSON.stringify({type: 'request', request: {id: 1, method, params}}), ...extra
});
const responses = () => frame.contentWindow.postMessage.mock.calls.map(([s]) => JSON.parse(s));
const modal = () => store.dispatch.mock.calls.map(([a]) => a).filter(a => a?.modal).pop()?.modal;
beforeEach(() => {
    jest.clearAllMocks();
    getNetworkForChainId.mockImplementation(chain => ({chainIdNum: chain === 'mainnet' ? 361 : 365, ethRpcUrl: 'https://rpc.invalid'}));
    getChainByChainIdNum.mockImplementation(id => id === 365 ? {chainId: 'testnet', name: 'Testnet'} : null);
    state = {thetaWallet: {selectedAddress: address, network: {chainId: 'mainnet'}, transactionRequests: []}, ui: {modals: [{type: 'dapp'}]}};
    store.getState.mockImplementation(() => state);
    store.subscribe.mockImplementation(fn => {notify = fn; return jest.fn();});
    store.dispatch.mockImplementation(action => {
        if (action?.type === 'SET_NETWORK') {state.thetaWallet.network = action.network; notify();}
        return Promise.resolve(action);
    });
    Wallet.unlocked.mockReturnValue(true);
    createTransactionRequest.mockImplementation((tx, opts) => ({type: 'TX', tx, opts}));
    frame = {contentWindow: {postMessage: jest.fn()}};
    bridge = new Web3Bridge();
});
afterEach(() => bridge.endSession());
const connect = () => bridge.startSession(frame, 'https://dapp.example/path');

test('does not publish accounts or accept requests before approval', async () => {
    bridge.sendConfig();
    await request('eth_requestAccounts');
    expect(responses()).toEqual([]);
    expect(store.dispatch).not.toHaveBeenCalled();
});
test('approved frame gets selected address and exact target origin', async () => {
    connect(); bridge.sendConfig(); await request('eth_requestAccounts');
    expect(responses()[0].config.accounts).toEqual([address]);
    expect(responses()[1].result).toEqual([address]);
    expect(frame.contentWindow.postMessage.mock.calls.every(([, target]) => target === 'https://dapp.example')).toBe(true);
});
test.each([
    {origin: 'https://evil.example'}, {source: {postMessage: jest.fn()}}, {origin: 'null'},
])('drops wrong origin or source without state change: %p', async extra => {
    connect(); await request('wallet_switchEthereumChain', [{chainId: '0x16d'}], extra);
    expect(store.dispatch).not.toHaveBeenCalled(); expect(responses()).toEqual([]);
});
test('ignores untrusted identity metadata', async () => {
    connect(); await bridge.handleMessage({origin: 'https://dapp.example', source: frame.contentWindow,
        data: JSON.stringify({type: 'wallet_sendDomainMetadata', metadata: {hostname: 'theta.thetatoken.org'}})});
    await request('personal_sign', ['0x74657374', address]);
    expect(modal().props.origin).toBe('https://dapp.example');
    expect(bridge.projectMetadata).toBeUndefined();
});
test('network switch needs explicit approval and sends updated config', async () => {
    connect(); await request('wallet_switchEthereumChain', [{chainId: '0x16d'}]);
    expect(state.thetaWallet.network.chainId).toBe('mainnet');
    expect(modal().type).toBe('dapp-network');
    await modal().props.onAccept();
    expect(state.thetaWallet.network.chainId).toBe('testnet');
    expect(responses().find(x => x.config)?.config.chainId).toBe(365);
    expect(responses().at(-1).result).toBeNull();
});
test('rejecting a network switch keeps the network unchanged', async () => {
    connect(); await request('wallet_switchEthereumChain', [{chainId: '0x16d'}]); modal().props.onReject();
    expect(state.thetaWallet.network.chainId).toBe('mainnet'); expect(responses().at(-1).error.code).toBe(4001);
});
test.each(['0x16dgarbage', '365', '', null])('rejects invalid chain IDs: %p', async chainId => {
    connect(); await request('wallet_switchEthereumChain', [{chainId}]);
    expect(responses().at(-1).error.code).toBe(-32602); expect(modal()).toBeUndefined();
});
test('unsupported chain fails without opening a prompt', async () => {
    connect(); await request('wallet_switchEthereumChain', [{chainId: '0x123'}]);
    expect(responses().at(-1).error.code).toBe(4902); expect(modal()).toBeUndefined();
});
test('reject-only signing returns 4001 and releases request slot', async () => {
    connect(); await request('personal_sign', ['0x74657374', address]);
    expect(modal().props.message).toBe('test'); modal().props.onReject();
    expect(responses().at(-1).error.code).toBe(4001); expect(bridge.session.pending).toBeNull();
});
test.each([['bad', address], ['0x1', address], ['0x00', '0xwrong']])('rejects invalid signing input: %p', async (message, account) => {
    connect(); await request('personal_sign', [message, account]);
    expect(responses().at(-1).error.code).toBe(-32602);
});
test('serializes sensitive prompts; native dialogs and queued transactions also block requests', async () => {
    connect(); await request('personal_sign', ['0x00', address]);
    await request('wallet_switchEthereumChain', [{chainId: '0x16d'}]);
    expect(responses().at(-1).error.code).toBe(-32002);
    modal().props.onReject(); state.ui.modals.push({type: 'receive'});
    await request('personal_sign', ['0x00', address]); expect(responses().at(-1).error.code).toBe(-32002);
    state.ui.modals.pop(); state.thetaWallet.transactionRequests.push({id: 'native'});
    await request('personal_sign', ['0x00', address]); expect(responses().at(-1).error.code).toBe(-32002);
});
test('transaction props bind immutable origin and session validity', async () => {
    const s = connect(); await request('eth_sendTransaction', [{from: address, to: address, value: '0x0'}]);
    const [, opts] = createTransactionRequest.mock.calls[0];
    expect(opts.origin).toBe(s.origin); expect(opts.isValid()).toBe(true);
    opts.onCreated('tx1'); bridge.endSession(s);
    expect(opts.isValid()).toBe(false);
    expect(Wallet.controller.RPCApi.rejectTransactionRequest).toHaveBeenCalledWith({transactionRequestId: 'tx1'});
});
test('transaction preparation failure releases slot and reports failure', async () => {
    connect(); await request('eth_sendTransaction', [{to: address}]);
    createTransactionRequest.mock.calls[0][1].onError();
    expect(responses().at(-1).error.code).toBe(-32603); expect(bridge.session.pending).toBeNull();
});
test.each(['account', 'network', 'lock'])('invalidates approval when wallet state changes: %s', async change => {
    const onEnd = jest.fn(); bridge.startSession(frame, 'https://dapp.example', onEnd);
    await request('personal_sign', ['0x00', address]); const props = modal().props;
    if (change === 'account') state.thetaWallet.selectedAddress = '0xother';
    if (change === 'network') state.thetaWallet.network.chainId = 'testnet';
    if (change === 'lock') Wallet.unlocked.mockReturnValue(false);
    notify(); expect(props.isValid()).toBe(false); expect(bridge.session).toBeNull(); expect(onEnd).toHaveBeenCalledTimes(1);
    await request('eth_requestAccounts'); expect(responses()).toEqual([]);
});
test('old session callbacks cannot reply to a new connection', async () => {
    connect(); await request('personal_sign', ['0x00', address]); const old = modal().props;
    bridge.endSession(); connect(); old.onAccept('stale');
    expect(responses()).toEqual([]); expect(old.isValid()).toBe(false);
});
test('init is idempotent', () => {
    const add = jest.spyOn(window, 'addEventListener'), remove = jest.spyOn(window, 'removeEventListener');
    bridge.init(); bridge.init(); expect(remove).toHaveBeenCalledWith('message', bridge.listener);
    expect(add).toHaveBeenCalledWith('message', bridge.listener); window.removeEventListener('message', bridge.listener);
    add.mockRestore(); remove.mockRestore();
});

test('unsupported subchain is rejected before any network mutation', async () => {
    connect();
    getChainByChainIdNum.mockReturnValueOnce({chainId: 'tsub360888', name: 'Subchain'});
    getNetworkForChainId.mockReturnValueOnce(undefined);
    await request('wallet_switchEthereumChain', [{chainId: '0x581b8'}]);
    expect(responses().at(-1).error.code).toBe(4902); expect(modal()).toBeUndefined();
    expect(state.thetaWallet.network.chainId).toBe('mainnet');
});
test('unsupported starting network cannot open a session or share account config', () => {
    getNetworkForChainId.mockReturnValueOnce(undefined);
    expect(connect()).toBeNull(); bridge.sendConfig(); expect(responses()).toEqual([]);
});
