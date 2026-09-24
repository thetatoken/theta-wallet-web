jest.mock('../Config', () => ({__esModule: true, default: {}}));
import React from 'react';
import ReactDOM from 'react-dom';
import {act, Simulate} from 'react-dom/test-utils';
import {DAppModal} from './DAppModal';
jest.mock('../state/actions/Wallet', () => ({updateAccountBalances: () => ({type: 'BALANCES'})}));
let root, component, dispatch, session;
beforeEach(() => {
    jest.useFakeTimers(); root = document.createElement('div'); document.body.appendChild(root); dispatch = jest.fn();
    session = {};
    window.Web3Bridge = {startSession: jest.fn(() => session), endSession: jest.fn(), sendConfig: jest.fn()};
});
afterEach(() => {act(() => {ReactDOM.unmountComponentAtNode(root);}); root.remove(); jest.useRealTimers();});
function render(uri = 'https://dapp.example/path') {
    act(() => {component = ReactDOM.render(<DAppModal uri={uri} dispatch={dispatch}/>, root);});
}
function click(title) {act(() => Simulate.click([...root.querySelectorAll('a')].find(a => a.textContent === title)));}
test('requires consent before creating the iframe or publishing config', () => {
    render(); expect(root.textContent).toContain('https://dapp.example'); expect(root.querySelector('iframe')).toBeNull();
    expect(window.Web3Bridge.startSession).not.toHaveBeenCalled();
    click('Connect'); expect(root.querySelector('iframe').src).toBe('https://dapp.example/path');
    expect(window.Web3Bridge.startSession).toHaveBeenCalledTimes(1); expect(window.Web3Bridge.sendConfig).toHaveBeenCalledWith(session);
});
test('cancel does not load or connect the website', () => {
    render(); click('Cancel'); expect(root.querySelector('iframe')).toBeNull(); expect(window.Web3Bridge.startSession).not.toHaveBeenCalled();
});
test('rejects unsupported URL without mounting a frame', () => {
    render('javascript:alert(1)'); expect(root.textContent).toContain('Unable to Connect'); expect(root.querySelector('iframe')).toBeNull();
});
test('a second document load revokes the session and unmount clears timers', () => {
    render(); click('Connect'); act(() => Simulate.load(root.querySelector('iframe')));
    expect(window.Web3Bridge.endSession).not.toHaveBeenCalled();
    act(() => Simulate.load(root.querySelector('iframe'))); expect(window.Web3Bridge.endSession).toHaveBeenCalledWith(session);
    act(() => component.onEnd()); expect(root.querySelector('iframe')).toBeNull(); expect(jest.getTimerCount()).toBe(0);
});
test('unmounting an unapproved modal does not target another active session', () => {
    render(); act(() => {ReactDOM.unmountComponentAtNode(root);});
    expect(window.Web3Bridge.endSession).not.toHaveBeenCalled();
});

test('unsupported wallet network fails closed with a readable message', () => {
    window.Web3Bridge.startSession.mockReturnValue(null); render(); click('Connect');
    expect(root.querySelector('iframe')).toBeNull();
    expect(root.textContent).toContain('This wallet network does not support dApp connections');
    expect(window.Web3Bridge.sendConfig).not.toHaveBeenCalled();
});
