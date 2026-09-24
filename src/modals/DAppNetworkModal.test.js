import React from 'react';
import ReactDOM from 'react-dom';
import {act, Simulate} from 'react-dom/test-utils';
import DAppNetworkModal from './DAppNetworkModal';

test('network decision is submitted once and cannot be rejected after submission', () => {
    const root = document.createElement('div'), onAccept = jest.fn(), onReject = jest.fn();
    act(() => {ReactDOM.render(<DAppNetworkModal origin="https://site.example" network={{name: 'Testnet'}} onAccept={onAccept} onReject={onReject}/>, root);});
    act(() => {
        const accept = root.querySelector('.GradientButton');
        Simulate.click(accept); Simulate.click(accept); Simulate.click(root.querySelector('.FlatButton'));
    });
    expect(onAccept).toHaveBeenCalledTimes(1); expect(onReject).not.toHaveBeenCalled();
    act(() => {ReactDOM.unmountComponentAtNode(root);});
});
