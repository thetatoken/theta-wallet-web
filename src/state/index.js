import thunkMiddleware from 'redux-thunk'
import { createLogger } from 'redux-logger'
import { createStore, applyMiddleware } from 'redux'
import { rootReducer } from './reducers';
import _ from 'lodash';

const loggerMiddleware = createLogger();

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const middlewares = [
    thunkMiddleware,
    //Only add the logged if not PROD
    (!IS_PRODUCTION && loggerMiddleware)
].filter(middleware => _.isFunction(middleware));

export const store = createStore(
    rootReducer,
    applyMiddleware(...middlewares)
);
