import React from "react";
import './WalletTokenListItem.css';
import {NavLink} from 'react-router-dom'
import {BigNumber} from 'bignumber.js';

class WalletTokenListItem extends React.Component {
    render() {
        let tokenBalance = (this.props.tokenBalance || "0");
        tokenBalance = new BigNumber(tokenBalance).toString();

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
                            {tokenBalance}
                        </div>
                    </div>
                </div>
            </NavLink>
        );
    }
}

export default WalletTokenListItem;
