import _ from 'lodash';
import React from "react";
import './WalletTokenList.css';
import WalletTokenListItem from './WalletTokenListItem'
import Theta from '../services/Theta';
import moment from "moment";
import {formatNativeTokenAmountToLargestUnit, formatTNT20TokenAmountToLargestUnit} from "../utils/Utils";

class WalletTokenList extends React.Component {
    render() {
        const {selectedAccount, tokens, assets, balancesRefreshedAt} = this.props;
        const assetsById = _.keyBy(assets, 'id');

        return (
            <div className="WalletTokenList">
                {
                    selectedAccount && selectedAccount.balances &&
                    <React.Fragment>
                        <WalletTokenListItem token={assetsById['theta']}
                                             balance={formatNativeTokenAmountToLargestUnit(selectedAccount.balances.thetawei)}
                                             key={'theta'}
                        />
                        <WalletTokenListItem token={assetsById['tfuel']}
                                             balance={formatNativeTokenAmountToLargestUnit(selectedAccount.balances.tfuelwei)}
                                             key={'tfuel'}
                        />
                    </React.Fragment>
                }

                {
                    selectedAccount && selectedAccount.balances &&
                    tokens.map((token) => {
                        const address = token.address;
                        const decimals = token.decimals;
                        const balanceStr = _.get(selectedAccount.balances, [address], '0');
                        const asset = assetsById[address];

                        return (
                            <WalletTokenListItem token={asset}
                                                 balance={formatTNT20TokenAmountToLargestUnit(balanceStr, decimals)}
                                                 key={address}
                            />
                        );
                    })
                }

                {
                    selectedAccount && _.isEmpty(selectedAccount.balances) &&
                    <div className="WalletTokenList__refreshed-message">Loading balances...</div>
                }

                {
                    !_.isNil(balancesRefreshedAt) &&
                    <div
                        className="WalletTokenList__refreshed-message">{`Balances refreshed ${moment(balancesRefreshedAt).fromNow()}`}</div>
                }

                {
                    selectedAccount &&
                    <a className="WalletTokenList__explorer-link"
                       href={Theta.getAccountExplorerUrl(selectedAccount.address)}
                       target={'_blank'}
                       rel='noopener noreferrer'
                    >
                        View Account on Explorer
                    </a>
                }
            </div>
        );
    }
}

export default WalletTokenList;
