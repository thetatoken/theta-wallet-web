import _ from 'lodash';
import React from "react";
import './WalletTokenListItem.css';
import {NavLink} from 'react-router-dom'
import {Jazzicon} from "@ukstv/jazzicon-react";

class WalletTokenListItem extends React.Component {
    render() {
        const {token, balance} = this.props;
        let balanceStr = balance || "-";

        return (
            <NavLink to={`/wallet/tokens/${token.id}`}
                     className="Balance">
                <div className='Balance__icon-wrapper'>
                    {
                        token.iconUrl &&
                        <img src={token.iconUrl}
                             className="Balance__icon"
                        />
                    }
                    {
                        _.isNil(token.iconUrl) &&
                        <Jazzicon address={token.contractAddress} className="Balance__icon"/>
                    }
                </div>
                <div className="WalletTokenListItem__token-balance-container">
                    <div className="Balance__name">
                        {token.symbol}
                    </div>
                    <div className="Balance__amount">
                        {balanceStr}
                    </div>
                </div>
            </NavLink>
        );
    }
}

export default WalletTokenListItem;
