(function(){
    if (!(window.self !== window.top)) {
        // We are not in an iframe...bail
        return;
    }

    const DEBUG = false;
    let TARGET_ORIGIN = '*';// change this to the origin from the config

    window.onerror = function(message, sourcefile, lineno, colno, error) {
        if(DEBUG){
            // alert("Message: " + message + " - Source: " + sourcefile + " Line: " + lineno + ":" + colno);
        }
        return true;
    };

    function sendDebugMessage(message) {
        if (!DEBUG) {
            return;
        }

        window.parent.postMessage(JSON.stringify({
            type: 'debug',
            message: message
        }), TARGET_ORIGIN);
    }

    const tryToGetAccounts = async () => {
        try {
            const walletAddress = localStorage.getItem('WALLET_ADDRESS');
            if(walletAddress){
                return [walletAddress];
            }
        }
        catch (e){
            return [];
        }
    }

    const InpageProvider = {
        _id: 0,
        _pendingRequests: {},
        isThetaWallet: true,

        _accounts: tryToGetAccounts(),
        _jsonRpcUrl: 'https://eth-rpc-api.thetatoken.org/rpc',
        _chainId: 361,

        setConfig: function (config) {
            TARGET_ORIGIN = config.origin;

            if (config.jsonRpcUrl) {
                this._jsonRpcUrl = config.jsonRpcUrl;
            }
            if (config.chainId) {
                this._chainId = config.chainId;
            }
            if(config.accounts){
                this._accounts = config.accounts;
            }
        },
        on: function(event, callback) {
            // TODO implement this
        },
        get connected() {
            return true;
        },
        isConnected() {
            return true;
        },
        connected: function() {
            return true;
        },
        isConnected: function() {
            return true;
        },
        getSiteName: function () {
            const {document} = window;

            const siteName = document.querySelector(
                'head > meta[property="og:site_name"]',
            );
            if (siteName) {
                return siteName.content;
            }

            const metaTitle = document.querySelector(
                'head > meta[name="title"]',
            );
            if (metaTitle) {
                return metaTitle.content;
            }

            if (document.title && document.title.length > 0) {
                return document.title;
            }

            return window.location.hostname;
        },
        getSiteIcon: async function() {
            const {document} = window;

            const origin = window.location.origin;
            let icons = document.querySelectorAll(
                'head > link[rel~="icon"]',
            );
            const iconUrls = Array.from(icons).map((icon) => {
                return (icon.href.startsWith('/') ? origin : '') + icon.href;
            });
            iconUrls.push(`${origin}/favicon.ico`);
            for (const iconUrl of iconUrls) {
                if (iconUrl && (await this.imgExists(iconUrl))) {
                    return iconUrl;
                }
            }

            return null;
        },
        imgExists: async function(url) {
            return new Promise((resolve, reject) => {
                try {
                    const img = document.createElement('img');
                    img.onload = () => resolve(true);
                    img.onerror = () => resolve(false);
                    img.src = url;
                } catch (error) {
                    reject(error);
                }
            });
        },
        getSiteMetadata: async function() {
            return {
                name: this.getSiteName(),
                icon: await this.getSiteIcon(),
                hostname: window.location.hostname,
            };
        },
        sendSiteMetadata: async function() {
            try {
                const metadata = await this.getSiteMetadata();
                window.parent.postMessage(JSON.stringify({
                    type: 'wallet_sendDomainMetadata',
                    metadata: metadata
                }), TARGET_ORIGIN)
            }
            catch (e){
                console.log(e);
            }
        },
        watchAsset: async function(address, symbol, decimals) {
            window.parent.postMessage(JSON.stringify({
                type: 'wallet_watchAsset',
                address: address,
                symbol: symbol,
                decimals: decimals
            }), TARGET_ORIGIN);
        },
        get chainId() {
            return this._eth_chainId();
        },
        get networkVersion() {
            return this._net_version();
        },
        get selectedAddress() {
            return this._eth_accounts()[0];
        },
        getChainId() {
            return this._chainId;
        },
        _eth_chainId() {
            return `0x${this.getChainId().toString(16)}`;
        },
        _net_version() {
            return `${this.getChainId()}`;
        },
        _eth_accounts() {
            return this._accounts;
        },
        _handleSynchronousMethods(request) {
            const {method} = request;
            const params = request.params || [];

            switch (method) {
                case 'eth_accounts':
                    return this._eth_accounts();
                case 'eth_chainId':
                    return this._eth_chainId();
                case 'net_version':
                    return this._net_version();
                default:
                    return undefined;
            }
        },
        respond: async function (response) {
            const {id} = response;
            const request = this._pendingRequests[id];

            if (!request) {
                return;
            }

            delete this._pendingRequests[id];

            if (response.error) {
                request.reject(response.error);
            } else {
                request.resolve(response.result);
            }
        },
        _sendRemoteRPCRequest: async function (request) {
            return new Promise((resolve, reject) => {
                function handleMessage(event) {
                    const data = JSON.parse(event.data);
                    sendDebugMessage('handleMessage :: data == ');
                    if (data &&
                        (typeof data === 'object') &&
                        data.id === request.id) {
                        window.removeEventListener('message', handleMessage);
                        if (data.error) {
                            reject(data.error);
                        } else {
                            resolve(data);
                        }
                    }
                }

                window.addEventListener('message', handleMessage, false);

                // Send the request
                window.parent.postMessage(JSON.stringify({
                    type: 'request',
                    request: request
                }), TARGET_ORIGIN);
            });
        },
        _wallet_switchEthereumChain: async function (request) {
            return this._sendRemoteRPCRequest(request);
        },
        _wallet_watchAsset: async function (request) {
            return this._sendRemoteRPCRequest(request);
        },
        _eth_requestAccounts: async function (request) {
            return this._sendRemoteRPCRequest(request);
        },
        _personal_sign: async function (request) {
            const [address, message] = request.params;

            return this._sendRemoteRPCRequest(request);
        },
        _eth_sign: async function (request) {
            const [address, message] = request.params;

            return this._sendRemoteRPCRequest(request);
        },
        _eth_signTypedData_v4: async function (request) {
            const [address, message] = request.params;

            return this._sendRemoteRPCRequest(request);
        },
        _eth_sendTransaction: async function (request) {
            return this._sendRemoteRPCRequest(request);
        },
        _eth_signTransaction: async function (request) {
            return this._sendRemoteRPCRequest(request);
        },
        _eth_sendRawTransaction: async function (request) {
            return this._sendRemoteRPCRequest(request);
        },
        _makeEthereumJSONRPCRequest: async function (request, jsonRpcUrl) {
            if (!jsonRpcUrl) throw new Error("Error: No jsonRpcUrl provided");
            return window
                .fetch(jsonRpcUrl, {
                    method: "POST",
                    body: JSON.stringify(request),
                    mode: "cors",
                    headers: {"Content-Type": "application/json"},
                })
                .then(res => res.json())
                .then(json => {
                    if (!json) {
                        throw new Error('No response returned from RPC');
                    }
                    const response = json;

                    const {error} = response;
                    if (error) {
                        throw new Error(error.message);
                    }
                    return response;
                });
        },
        _handleAsynchronousMethods(request) {
            const {method} = request;
            const params = request.params || [];

            this._pendingRequests[request.id] = request;

            switch (method) {
                case 'eth_requestAccounts':
                    return this._eth_requestAccounts(request);
                case 'personal_sign':
                    return this._personal_sign(request);
                case 'eth_signTransaction':
                    return this._eth_signTransaction(request);
                case 'eth_sendRawTransaction':
                    return this._eth_sendRawTransaction(request);
                case 'eth_sendTransaction':
                    return this._eth_sendTransaction(request);
                case 'eth_sign':
                    return this._eth_sign(request);
                case 'eth_signTypedData_v4':
                case 'eth_signTypedData':
                    return this._eth_signTypedData_v4(request);
                case 'wallet_watchAsset':
                    return this._wallet_watchAsset(request);
                case 'wallet_switchEthereumChain':
                    return this._wallet_switchEthereumChain(request);
            }

            return this._makeEthereumJSONRPCRequest(request, this._jsonRpcUrl);
        },
        _sendRequestAsync: async function (request) {
            return new Promise((resolve, reject) => {
                try {
                    const syncResult = this._handleSynchronousMethods(request);
                    if (syncResult !== undefined) {
                        return resolve({
                            jsonrpc: "2.0",
                            id: request.id,
                            result: syncResult,
                        });
                    }
                } catch (err) {
                    return reject(err);
                }

                request.resolve = resolve;
                request.reject = reject;

                this._handleAsynchronousMethods(request).then(res => {
                    res && resolve({...res, id: request.id});
                })
                    .catch(err => reject(err));
            });
        },
        _request: async function (args) {
            if (!args || typeof args !== "object" || Array.isArray(args)) {
                throw new Error("Expected a single, non-array, object argument.");
            }

            const {method, params} = args;

            if (typeof method !== "string" || method.length === 0) {
                throw new Error("'args.method' must be a non-empty string.");
            }

            if (
                params !== undefined &&
                !Array.isArray(params) &&
                (typeof params !== "object" || params === null)
            ) {
                throw new Error("'args.params' must be an object or array if provided.");
            }

            const newParams = params === undefined ? [] : params;

            // Coinbase Wallet Requests
            this._id += 1;
            const id = this._id;

            const response = await this._sendRequestAsync({
                method,
                params: newParams,
                jsonrpc: "2.0",
                id,
            });

            return response.result;
        },
        request: async function (args) {
            try {
                return this._request(args).catch(error => {
                    throw error;
                });
            } catch (error) {
                return Promise.reject(error.message);
            }
        }
    }

    sendDebugMessage('InpageProvider :: initializing');

    const proxiedProvider = new Proxy(InpageProvider, {
        // some common libraries, e.g. web3@1.x, mess with our API
        deleteProperty: () => true,
    });

    sendDebugMessage('InpageProvider :: proxiedProvider == ');
    sendDebugMessage(proxiedProvider);

    window.ethereum = proxiedProvider;
    sendDebugMessage('InpageProvider :: window.ethereum == ');
    sendDebugMessage(window.ethereum);
    try {
        window.dispatchEvent(new Event('ethereum#initialized'));
        sendDebugMessage('InpageProvider :: send event... == ');;
    } catch (error) {
        // swallow the error
        console.error(error);
        sendDebugMessage('InpageProvider :: error... == ');
        sendDebugMessage(error.message);
    }


    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        window.ethereum.sendSiteMetadata();
    } else {
        const domContentLoadedHandler = () => {
            window.ethereum.sendSiteMetadata();
            window.removeEventListener('DOMContentLoaded', domContentLoadedHandler);
        }
        window.addEventListener('DOMContentLoaded', domContentLoadedHandler);
    }

    window.addEventListener('message', function(event) {
        try {
            if(TARGET_ORIGIN === '*' || event.origin === TARGET_ORIGIN){
                const data = JSON.parse(event.data);
                if (data.type === 'wallet_setConfig') {
                    const config = data.config;
                    window.ethereum.setConfig(config);
                }
            }
            else{
                console.log('Ignoring message from origin: ' + event.origin);
            }
        }
        catch (e){

        }
    });

    return true;
})();