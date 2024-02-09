import * as actionTypes from '../types/ui';
import Modals from "../../components/Modals";
import ModalTypes from "../../constants/ModalTypes";

const INITIAL_STATE = {
    modals : [],

    isLoading: false,
    loadingMessage: null
};

export const uiReducer = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case actionTypes.SET_EMBED_MODE:{
            return Object.assign({}, state, {
                isEmbedMode: true
            })
        }
        case actionTypes.SHOW_MODAL:{
            let { type, props } = action.modal;

            return Object.assign({}, state, {
                modals: [...state.modals, {
                    type: type,
                    props: props
                }]
            });
        }
        case actionTypes.HIDE_MODAL:{
            return Object.assign({}, state, {
                modals: state.modals.slice(0, -1)
            });
        }
        case actionTypes.HIDE_MODALS:{
            return Object.assign({}, state, {
                modals: []
            });
        }
        case actionTypes.HIDE_MODALS_EXCEPT_DAPP:{
            return Object.assign({}, state, {
                modals: state.modals.filter(modal => modal.type === ModalTypes.DAPP)
            });
        }

        case actionTypes.SHOW_LOADER:
            return {
                ...state,
                isLoading: true,
                loadingMessage: action.message,
            };

        case actionTypes.HIDE_LOADER:
            return {
                ...state,
                isLoading: false,
                loadingMessage: null
            };

        default:{
            return state;
        }
    }
};
