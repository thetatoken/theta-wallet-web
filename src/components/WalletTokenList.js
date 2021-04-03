import _ from 'lodash';
import React from "react";
import './WalletTokenList.css';
import WalletTokenListItem from './WalletTokenListItem'
import TokenTypes from '../constants/TokenTypes'
import {tokenTypeToTokenName} from '../constants/TokenTypes'
import Theta from '../services/Theta';
import Wallet from "../services/Wallet";
import moment from "moment";

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

class WalletTokenList extends React.Component {
    constructor(){
        super();
    }

    render() {
        const { balancesRefreshedAt } = this.props;
        let address = Wallet.getWalletAddress();
        let tokens = ThetaNetworkTokens;
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
                {}

                {content}

                {
                    _.isNil(balancesRefreshedAt) &&
                    <div className="WalletTokenList__refreshed-message">Loading balances...</div>
                }

                {
                    !_.isNil(balancesRefreshedAt) &&
                    <div className="WalletTokenList__refreshed-message">{`Balances refreshed ${ moment(balancesRefreshedAt).fromNow() }` }</div>
                }

                <a className="WalletTokenList__explorer-link"
                   href={Theta.getAccountExplorerUrl(address)}
                   target={'_blank'}
                   rel='noopener noreferrer'
                >
                    View Account on Explorer
                </a>
            </div>
        );
    }
}

export default WalletTokenList;
