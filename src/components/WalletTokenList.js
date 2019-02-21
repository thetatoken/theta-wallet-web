import React from "react";
import './WalletTokenList.css';
import WalletTokenListItem from './WalletTokenListItem'

const tokens = [
    {
        id: "erc20",
        name: "ERC20 Theta",
        iconUrl: "/img/tokens/theta_large@2x.png",
        href: "/wallet/tokens/erc20"
    },
    {
        id: "ethereum",
        name: "Ethereum",
        iconUrl: "/img/tokens/eth_large@2x.png",
        href: "/wallet/tokens/ethereum"
    }];

class WalletTokenList extends React.Component {
    render() {
        var content = tokens.map(function(token){
            return <WalletTokenListItem token={token}
                                        key={token.id}
            />;
        });

        return (
            <div className="WalletTokenList">
                {content}
            </div>
        );
    }
}

export default WalletTokenList;
