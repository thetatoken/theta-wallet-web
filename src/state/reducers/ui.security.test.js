import {uiReducer} from './ui';
import * as types from '../types/ui';
jest.mock('../../components/Modals', () => ({__esModule: true, default: () => null}));
const state = {modals: [{type: 'dapp'}, {type: 'personal-sign', props: {dappRequestId: 'dapp-1'}}, {type: 'receive', props: {}}]};
test('ending a dApp request removes only its dialog, preserving other wallet dialogs', () => {
    expect(uiReducer(state, {type: types.HIDE_MODAL, dappRequestId: 'dapp-1'}).modals.map(x => x.type)).toEqual(['dapp', 'receive']);
});
test('late close for an old request cannot dismiss a new approval', () => {
    expect(uiReducer(state, {type: types.HIDE_MODAL, dappRequestId: 'old-request'}).modals).toEqual(state.modals);
});
test('ordinary native modal close still pops the current modal', () => {
    expect(uiReducer(state, {type: types.HIDE_MODAL}).modals.map(x => x.type)).toEqual(['dapp', 'personal-sign']);
});
