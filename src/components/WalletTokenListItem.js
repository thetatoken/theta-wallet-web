import _ from 'lodash';
import React from "react";
import './WalletTokenListItem.css';
import {NavLink} from 'react-router-dom'
import {BigNumber} from 'bignumber.js';
import {numberWithCommas} from "../utils/Utils";

class WalletTokenListItem extends React.Component {
    render() {
        let tokenBalanceStr = "-";

        if(!_.isNil(this.props.tokenBalance)){
            const tokenBalance = (this.props.tokenBalance || "0");
            tokenBalanceStr = numberWithCommas(new BigNumber(tokenBalance).toString());
        }

        return (
            <NavLink to={this.props.token.href}
                     className="WalletTokenListItem"
                     activeClassName="WalletTokenListItem--is-active">
                <div className="WalletTokenListItem__token-container">
                    <div className="WalletTokenListItem__active-indicator"/>
                    <img src={this.props.token.iconUrl}
                         className="WalletTokenListItem__token-icon"
                    />
                    <div className="WalletTokenListItem__token-balance-container">
                        <div className="WalletTokenListItem__token-name">
                            {this.props.token.name}
                        </div>
                        <div className="WalletTokenListItem__token-balance">
                            {tokenBalanceStr}
                        </div>
                    </div>
                </div>
            </NavLink>
        );
    }
}

export default WalletTokenListItem;
