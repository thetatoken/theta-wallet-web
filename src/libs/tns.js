import TNS from 'tns-resolver';
import { ethers } from 'ethers';

const endpoint = "https://eth-rpc-api.thetatoken.org/rpc";

const tns = new TNS({ customRpcEndpoint: endpoint });

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
        state.domain = await tns.getDomainName(val);
    } else if(val.endsWith(".theta")) {
        state.address = await tns.getAddress(val);
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