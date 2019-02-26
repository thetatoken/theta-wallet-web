import React from "react";
import './WalletTokenList.css';
import WalletTokenListItem from './WalletTokenListItem'
import TokenTypes from '../constants/TokenTypes'
import {tokenTypeToTokenName} from '../constants/TokenTypes'

const tokens = [
    {
        type: TokenTypes.ERC20_THETA,
        name: tokenTypeToTokenName(TokenTypes.ERC20_THETA),
        iconUrl: `/img/tokens/${TokenTypes.ERC20_THETA}_large@2x.png`,
        href: "/wallet/tokens/" + TokenTypes.ERC20_THETA
    },
    {
        type: TokenTypes.ETHEREUM,
        name: tokenTypeToTokenName(TokenTypes.ETHEREUM),
        iconUrl: `/img/tokens/${TokenTypes.ETHEREUM}_large@2x.png`,
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
