import _ from 'lodash';
import * as actionTypes from "../types/Stakes";

const INITIAL_STATE = {
    isFetchingStakes: false,

    stakes: [],
};

export const stakesReducer = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        //ERC20 Transactions
        case actionTypes.FETCH_STAKES_START: {
            return Object.assign({}, state, {
                isFetchingStakes: true
            });
        }
        case actionTypes.FETCH_STAKES_END: {
            return Object.assign({}, state, {
                isFetchingStakes: false
            });
        }
        case actionTypes.FETCH_STAKES_SUCCESS: {
            let body = action.response.body;
            let stakes = _.get(body, ['stakes', 'sourceRecords'], []);

            return Object.assign({}, state, {
                stakes: stakes,
            });
        }

        //Reset all state (useful when recovering a wallet which may have another wallet's state stored in memory))
        case actionTypes.RESET: {
            return INITIAL_STATE;
        }

        default: {
            return state
        }
    }
};
