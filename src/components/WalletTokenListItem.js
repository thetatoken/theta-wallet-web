import _ from 'lodash';
import React from "react";
import './WalletTokenListItem.css';
import {NavLink} from 'react-router-dom'
import {Jazzicon} from "@ukstv/jazzicon-react";
import GhostButton from "./buttons/GhostButton";
import FlatButton from "./buttons/FlatButton";
import {formatBalanceString, trimDecimalPlaces} from "../utils/Utils";
import {store} from "../state";
import {showModal} from "../state/actions/ui";
import ModalTypes from "../constants/ModalTypes";
import CTABanner from "./CTABanner";

class WalletTokenListItem extends React.Component {
    render() {
        const {token, balance, onWrap, onUnwrap, onStake} = this.props;
        let balanceStr = (balance ? formatBalanceString(balance) : null) || "-";

        return (
            <NavLink to={`/wallet/tokens/${token.id}`}
                     className="Balance">
                <div className={'Balance__container'}>
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
                </div>
                {
                    token.id === 'tfuel' &&
                    <a className={'EliteBoosterCTA'}
                       onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                           store.dispatch(showModal({
                               type: ModalTypes.DAPP,
                               props: {
                                   uri: 'https://elite-booster.thetatoken.org',
                                   closeable: false
                               }
                           }));
                       }}
                    >
                        <div className={'EliteBoosterCTA__title'}>
                            Elite Booster
                        </div>
                        <div className={'EliteBoosterCTA__description'}>
                            Earn Boosted EdgeCloud rewards by locking TFUEL.
                        </div>
                        <div className={'EliteBoosterCTA__button'}>
                            Lock TFUEL
                        </div>
                    </a>
                }

            </NavLink>
        );
    }
}

export default WalletTokenListItem;
