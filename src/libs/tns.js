import TNS from 'tns-resolver';
import { ethers } from 'ethers';

const endpoint = "https://eth-rpc-api.thetatoken.org/rpc";

const tns = new TNS({ customRpcEndpoint: endpoint });

// Cache support
function withCacheAndInFlightHandling(asyncFn, cacheKeyFn, isCacheEnabled = true) {
    const cache = {};
    const inFlightRequests = {};

    return async function(...args) {
        const key = cacheKeyFn(...args);

        // Check if caching is enabled and if the result is already cached
        if (isCacheEnabled && cache.hasOwnProperty(key)) {
            console.log('Returning from cache for key:', key);
            return cache[key];
        }

        // Check if there's an in-flight request for the same key
        if (inFlightRequests[key]) {
            console.log('Returning in-flight promise for key:', key);
            return inFlightRequests[key];
        }

        try {
            // Store the promise of the in-flight request
            inFlightRequests[key] = asyncFn.call(tns, ...args);

            // Wait for the result
            const result = await inFlightRequests[key];

            // Cache the result and remove from in-flight requests if caching is enabled
            if (isCacheEnabled) {
                cache[key] = result;
            }
            delete inFlightRequests[key];

            return result;
        } catch (error) {
            // Handle any errors here??
            console.error(`Error in function ${asyncFn.name} with args ${args}:`, error);
            // Remove from in-flight requests on error as well
            delete inFlightRequests[key];
            throw error;
        }
    };
}

tns.getAddressWithCache = withCacheAndInFlightHandling(tns.getAddress, (domain) => domain, true);
tns.getDomainNameWithCache = withCacheAndInFlightHandling(tns.getDomainName, (address) => address, true);

tns.getAddressWithoutCache = withCacheAndInFlightHandling(tns.getAddress, (domain) => domain, false);
tns.getAddress = async (domain, allowCache = true) => {
    if (allowCache) {
        return await tns.getAddressWithCache(domain);
    } else {
        return await tns.getAddressWithoutCache(domain);
    }
}

tns.getDomainNameWithoutCache = withCacheAndInFlightHandling(tns.getDomainName, (address) => address, false);
tns.getDomainName = async (address, allowCache = true) => {
    if (allowCache) {
        return await tns.getDomainNameWithCache(address);
    } else {
        return await tns.getDomainNameWithoutCache(address);
    }
}

export const validateInput = async (val) => {
    let result = false;
    let state = {
        domain: '',
        address: '',
        isTnsDomain: false,
        loading: false,
    };

    if(ethers.utils.isAddress(val)) {
        state.address = val;
        state.domain = await tns.getDomainName(val, false);
    } else if(val && val.endsWith(".theta")) {
        state.address = await tns.getAddress(val, false);
        if (!state.address) {
            return {
                result: result,
                state: state
            };
        }
        state.domain = val;
        state.isTnsDomain = true;
    } else {
        return {
            result: result,
            state: state
        };
    }
    return {
        result: true,
        state: state
    };
}

export default tns;