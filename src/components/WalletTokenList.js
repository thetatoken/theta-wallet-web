import React from "react";
import './WalletTokenList.css';
import WalletTokenListItem from './WalletTokenListItem'
import TokenTypes from '../constants/TokenTypes'

const tokens = [
    {
        type: TokenTypes.ERC20_THETA,
        name: "ERC20 Theta",
        iconUrl: "/img/tokens/theta_large@2x.png",
        href: "/wallet/tokens/" + TokenTypes.ERC20_THETA
    },
    {
        type: TokenTypes.ETHEREUM,
        name: "Ethereum",
        iconUrl: "/img/tokens/eth_large@2x.png",
        href: "/wallet/tokens/" + TokenTypes.ETHEREUM
    }];

class WalletTokenList extends React.Component {
    render() {
        let balancesByType = this.props.balancesByType;
        var content = tokens.map(function(token){
            let balance = balancesByType[token.type];

            return <WalletTokenListItem token={token}
                                        tokenBalance={balance}
                                        key={token.type}
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
