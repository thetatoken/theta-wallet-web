import React from "react";
import './WalletTokenListItem.css';
import {NavLink} from 'react-router-dom'

class WalletTokenListItem extends React.Component {
    render() {
        return (
            <NavLink to={this.props.token.href}
                     className="WalletTokenListItem"
                     activeClassName="WalletTokenListItem--is-active">
                <div className="WalletTokenListItem__token-container">
                    <img src={this.props.token.iconUrl}
                         className="WalletTokenListItem__token-icon"
                    />
                    <div className="WalletTokenListItem__token-balance-container">
                        <div className="WalletTokenListItem__token-name">
                            {this.props.token.name}
                        </div>
                        <div className="WalletTokenListItem__token-balance">
                            {this.props.tokenBalance || "0.0000"}
                        </div>
                    </div>
                </div>
            </NavLink>
        );
    }
}

export default WalletTokenListItem;
