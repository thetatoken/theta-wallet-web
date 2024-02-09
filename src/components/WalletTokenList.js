import _ from 'lodash';
import React from "react";
import './WalletTokenList.css';
import WalletTokenListItem from './WalletTokenListItem'
import Theta from '../services/Theta';
import moment from "moment";
import {formatNativeTokenAmountToLargestUnit, formatTNT20TokenAmountToLargestUnit} from "../utils/Utils";
import {showModal} from "../state/actions/ui";
import ModalTypes from "../constants/ModalTypes";
import {store} from "../state";
import {WThetaAsset} from "../constants/assets";
import config from "../Config";
import {StakePurposeForTDROP} from "../constants";
import {StakePurpose} from "@thetalabs/theta-js/src/constants";
import {DAPPS_ENABLED} from "../Flags";

class WalletTokenList extends React.Component {
    onAddTokenClick = () => {
        store.dispatch(showModal({
            type: ModalTypes.TRACK_TOKEN
        }))
    }

    onWrapTHETAClick = () => {
        store.dispatch(showModal({
            type: ModalTypes.CREATE_TRANSACTION,
            props: {
                transactionType: 'wrap-theta'
            }
        }));
    }

    onUnwrapWTHETAClick = () => {
        store.dispatch(showModal({
            type: ModalTypes.CREATE_TRANSACTION,
            props: {
                transactionType: 'unwrap-theta'
            }
        }));
    }

    buildOnStake = (asset) => {
        if(asset.id === 'theta'){
            return () => {
                store.dispatch(showModal({
                    type: ModalTypes.CREATE_TRANSACTION,
                    props: {
                        transactionType: 'deposit-stake',
                        defaultValues: {
                            purpose: StakePurpose.StakeForGuardian
                        }
                    }
                }));
            }
        }
        else if(asset.id === 'tfuel'){
            return () => {
                store.dispatch(showModal({
                    type: ModalTypes.CREATE_TRANSACTION,
                    props: {
                        transactionType: 'deposit-stake',
                        defaultValues: {
                            purpose: StakePurpose.StakeForEliteEdge
                        }
                    }
                }));
            }
        }
        else if(_.toLower(asset.symbol) === 'tdrop'){
            return () => {
                store.dispatch(showModal({
                    type: ModalTypes.CREATE_TRANSACTION,
                    props: {
                        transactionType: 'deposit-stake',
                        defaultValues: {
                            purpose: StakePurposeForTDROP
                        }
                    }
                }));
            }
        }
        else if(DAPPS_ENABLED && asset.externalStaking){
            return () => {
                store.dispatch(showModal({
                    type: ModalTypes.DAPP,
                    props: {
                        uri: asset.externalStaking, // 'http://localhost:3002/'
                        closeable: false
                    }
                }));
            }
        }
        else{

        }
    }

    render() {
        const {selectedAccount, tokens, assets, balancesRefreshedAt, chainId, style, dispatch} = this.props;
        const wThetaAsset = WThetaAsset(chainId);
        const isSubchain = chainId.startsWith('tsub');

        return (
            <div className="WalletTokenList"
                 style={style}>
                {
                    selectedAccount && selectedAccount.balances &&
                    assets.map((asset) => {
                        const decimals = asset.decimals;
                        const balanceStr = _.get(selectedAccount.balances, [asset.balanceKey], '0');

                        // Hide 0 balances in embed mode
                        if(config.isEmbedMode && !(asset.symbol === 'TFUEL' || asset.symbol === 'vTFUEL') && balanceStr === "0"){
                            return null;
                        }

                        return (
                            <WalletTokenListItem key={asset.id}
                                                 token={asset}
                                                 balance={formatTNT20TokenAmountToLargestUnit(balanceStr, decimals)}
                                                 onWrap={(asset.id === 'theta' && !_.isNil(wThetaAsset)) && this.onWrapTHETAClick}
                                                 onUnwrap={(asset.id === wThetaAsset?.id) && this.onUnwrapWTHETAClick}
                                                 onStake={!isSubchain && this.buildOnStake(asset)}
                            />
                        )
                    })
                }

                {
                    !config.isEmbedMode &&
                    <a className='AddTokenCTA'
                       onClick={this.onAddTokenClick}
                    >
                        <img className={'AddTokenCTA__icon'}
                             src={'/img/icons/add-token.svg'}/>
                        <div className={'AddTokenCTA__name'}>Add Token</div>
                    </a>
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
                    selectedAccount && !config.isEmbedMode &&
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
