import React from "react";
import './WalletTokenList.css';
import WalletTokenListItem from './WalletTokenListItem'
import TokenTypes from '../constants/TokenTypes'
import {tokenTypeToTokenName} from '../constants/TokenTypes'
import Config from '../Config'

const ThetaNetworkTokens = [
    {
        type: TokenTypes.THETA,
        name: tokenTypeToTokenName(TokenTypes.THETA),
        iconUrl: `/img/tokens/${TokenTypes.THETA}_large@2x.png`,
        href: "/wallet/tokens/" + TokenTypes.THETA
    },
    {
        type: TokenTypes.THETA_FUEL,
        name: tokenTypeToTokenName(TokenTypes.THETA_FUEL),
        iconUrl: `/img/tokens/${TokenTypes.THETA_FUEL}_large@2x.png`,
        href: "/wallet/tokens/" + TokenTypes.THETA_FUEL
    }];

const EthereumNetworkTokens = [
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

const liveTokens = (Config.isThetaNetworkLive ? ThetaNetworkTokens : EthereumNetworkTokens);
const allTokens =  (Config.isThetaNetworkLive ? ThetaNetworkTokens.concat(EthereumNetworkTokens) : EthereumNetworkTokens);

class WalletTokenList extends React.Component {
    constructor(){
        super();

        this.state = {
          showEthereumTokens: false
        };

        this.toggleEthereumTokens = this.toggleEthereumTokens.bind(this);
    }

    toggleEthereumTokens(){
        this.setState({showEthereumTokens: !this.state.showEthereumTokens});
    }

    render() {
        let tokens = (this.state.showEthereumTokens ? allTokens : liveTokens);
        let balancesByType = this.props.balancesByType;
        var content = tokens.map(function (token) {
            let balance = balancesByType[token.type];

            return <WalletTokenListItem token={token}
                                        tokenBalance={balance}
                                        key={token.type}
            />;
        });

        return (
            <div className="WalletTokenList">
                {content}

                {Config.isThetaNetworkLive &&
                <a className="WalletTokenList__ethereum-balances-toggle"
                   onClick={this.toggleEthereumTokens}>
                    { (this.state.showEthereumTokens ? 'Hide Ethereum Tokens' : 'Show Ethereum Tokens') }
                </a>}

                {
                    this.state.showEthereumTokens &&
                    <div className="WalletTokenList__ethereum-balances-warning">
                        Ethereum token support will be removed in a future version of this wallet.
                    </div>
                }
            </div>
        );
    }
}

export default WalletTokenList;
