import _ from 'lodash';
import React from "react";
import './WalletTokenListItem.css';
import {NavLink} from 'react-router-dom'
import {Jazzicon} from "@ukstv/jazzicon-react";
import GhostButton from "./buttons/GhostButton";
import FlatButton from "./buttons/FlatButton";
import {formatBalanceString, trimDecimalPlaces} from "../utils/Utils";

class WalletTokenListItem extends React.Component {
    render() {
        const {token, balance, onWrap, onUnwrap, onStake} = this.props;
        let balanceStr = (balance ? formatBalanceString(balance) : null) || "-";

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
                <div className="WalletTokenListItem__button-container">
                    {
                        onWrap &&
                        <FlatButton title={'Wrap'}
                                    size={'xsmall'}
                                    onClick={onWrap}
                        />
                    }
                    {
                        onUnwrap &&
                        <FlatButton title={'Unwrap'}
                                    size={'xsmall'}
                                    onClick={onUnwrap}
                        />
                    }
                    {
                        onStake &&
                        <FlatButton
                            title="Stake"
                            size={'xsmall'}
                            onClick={onStake}/>
                    }

                </div>
            </NavLink>
        );
    }
}

export default WalletTokenListItem;
