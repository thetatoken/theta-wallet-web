const TokenTypes = {
    ETHEREUM: 'ethereum',
    ERC20_THETA: 'erc20',
    THETA: 'theta',
    THETA_FUEL: 'tfuel',
};


export function tokenTypeToTokenName(tokenType){
    if(tokenType === TokenTypes.ETHEREUM){
        return "Ethereum";
    }
    else if(tokenType === TokenTypes.ERC20_THETA){
        return "ERC20 Theta";
    }
    else if(tokenType === TokenTypes.THETA){
        return "Theta";
    }
    else if(tokenType === TokenTypes.THETA_FUEL){
        return "TFuel";
    }
}

export default TokenTypes;