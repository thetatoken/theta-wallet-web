//TODO this is not really needed since we don't need the bridge


class DeferredPromise {
    constructor() {
        this._promise = new Promise((resolve, reject) => {
            // assign the resolve and reject functions to `this`
            // making them usable on the class instance
            this.resolve = resolve;
            this.reject = reject;
        });
        // bind `then` and `catch` to implement the same interface as Promise
        this.then = this._promise.then.bind(this._promise);
        this.catch = this._promise.catch.bind(this._promise);
        this[Symbol.toStringTag] = 'Promise';
    }
}

export default class Web3 {
    /**
     * A Web3WebView instance.
     * @var {Web3WebView} webView
     */
    static _webView = null;

    static _isBridgeReady = false;
    static _queuedMessages = [];
    static _promisesByMessageID = {};

    /**
     * @param {Web3WebView} webView
     */
    static setWebView(webView) {
        this._webView = webView;
    }

    /**
     * @param {Object} message
     */
    static postMessage(message) {
        //Queued messages will already ahve an _id and a stored promise we should resolve
        let id = message['_id'] || Math.random().toString(36).substring(6);

        let promise = this._promisesByMessageID[id] || new DeferredPromise();

        //Store the promise
        this._promisesByMessageID[id] = promise;

        //Inject the _id
        message['_id'] = id;

        if (this._webView && this._isBridgeReady) {
            let messageStr = JSON.stringify(message);
            this._webView.postMessage(messageStr);
        }
        else {
            this._queuedMessages.push(message);
        }

        return promise;
    }

    static dequeueMessages(){
        for(let i = 0; i < this._queuedMessages.length; i++){
            let message = this._queuedMessages[i];

            this.postMessage(message);
        }
    }

    static enableBridge(){
        this._isBridgeReady = true;

        this.dequeueMessages();
    }

    /**
     * @param {Object} message
     */
    static handleInternalMessage(message) {
        let messageType = message['type'];

        switch (messageType) {
            case "_BRIDGE_IS_READY_":
                this.enableBridge();
                break;
            default:
                console.log("handleInternalMessage :: Unknown internal message.type, ignoring.");
        }
    }

    /**
     * @param {Object} message
     */
    static handleMessage(message) {
        let id = message["_id"];
        let response = message["_response"];

        let promise = this._promisesByMessageID[id];
        if (promise) {
            promise.resolve(response);
            //Remove the promise since it is now
            delete this._promisesByMessageID[id];
        }
    }

    /**
     * @param {Object} message
     */
    static onMessage(message) {
        try {
            let parsedMessage = JSON.parse(message);

            if(parsedMessage['isInternal']){
                this.handleInternalMessage(parsedMessage);
            }
            else{
                this.handleMessage(parsedMessage);
            }
        }
        catch (e) {
            //We could not parse the message, most likely not ours
        }
    }

    static async createWallet(data) {
        return await this.postMessage({
            type: "CREATE_WALLET",
            data: data
        });
    }

    static async estimateGas(data) {
        return await this.postMessage({
            type: "ESTIMATE_GAS",
            data: data
        });
    }

    static async getGasPrice(data) {
        return await this.postMessage({
            type: "GET_GAS_PRICE",
            data: data
        });
    }

    static async checkValidAddress(data) {
        return await this.postMessage({
            type: "CHECK_VALID_ADDRESS",
            data: data
        });
    }

    static async getTransactionFee(data) {
        return await this.postMessage({
            type: "GET_TRANSACTION_FEE",
            data: data
        });
    }

    static async signTransaction(data) {
        return await this.postMessage({
            type: "SIGN_TRANSACTION",
            data: data
        });
    }
}