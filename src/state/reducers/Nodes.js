import * as actionTypes from "../types/Nodes";

const INITIAL_STATE = {
    isFetchingGuardianNodeDelegates: false,

    guardianNodeDelegates: [],
};

export const nodesReducer = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        //ERC20 Transactions
        case actionTypes.FETCH_GUARDIAN_NODE_DELEGATES_START: {
            return Object.assign({}, state, {
                isFetchingGuardianNodeDelegates: true
            });
        }
        case actionTypes.FETCH_GUARDIAN_NODE_DELEGATES_END: {
            return Object.assign({}, state, {
                isFetchingGuardianNodeDelegates: false
            });
        }
        case actionTypes.FETCH_GUARDIAN_NODE_DELEGATES_SUCCESS: {
            let body = action.response.body;
            let guardianNodeDelegates = body;

            return Object.assign({}, state, {
                guardianNodeDelegates: guardianNodeDelegates,
            });
        }

        default: {
            return state
        }
    }
};
