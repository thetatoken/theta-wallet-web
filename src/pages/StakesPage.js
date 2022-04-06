import _ from 'lodash';
import React from "react";
import {connect} from 'react-redux'
import './StakesPage.css';
import PageHeader from "../components/PageHeader";
import {fetchStakes} from "../state/actions/Stakes";
import GhostButton from "../components/buttons/GhostButton";
import {showModal} from "../state/actions/ui";
import ModalTypes from "../constants/ModalTypes";
import StakesTable from "../components/StakesTable";
import EmptyState from "../components/EmptyState";
import MDSpinner from "react-md-spinner";
import Wallet from "../services/Wallet";
import {canStakeFromHardwareWallet} from '../Flags';
import {updateAccountStakes} from "../state/actions/Wallet";
import {DefaultAssets, getAllAssets, TDropAsset, tokenToAsset} from "../constants/assets";
import {Jazzicon} from "@ukstv/jazzicon-react";
import {formatTNT20TokenAmountToLargestUnit, trimDecimalPlaces, truncate} from "../utils/Utils";

const sampleStakes = [
    {
        "_id": "vcp_0xe8a650b6e34650f4be29eb5dc97a60263085cea1_0x95944d0f9c86794284abc375616c83b0e6a1a8b7",
        "amount": "10000000000000000000000",
        "holder": "0xe8a650b6e34650f4be29eb5dc97a60263085cea1",
        "return_height": "18446744073709551615",
        "source": "0x95944d0f9c86794284abc375616c83b0e6a1a8b7",
        "type": "vcp",
        "withdrawn": false
    },
    {
        "_id": "gcp_0xe8a650b6e34650f4be29eb5dc97a60263085cea1_0x95944d0f9c86794284abc375616c83b0e6a1a8b7",
        "amount": "2000000000000000000000000",
        "holder": "0xe8a650b6e34650f4be29eb5dc97a60263085cea1",
        "return_height": "18446744073709551615",
        "source": "0x95944d0f9c86794284abc375616c83b0e6a1a8b7",
        "type": "gcp",
        "withdrawn": false
    },
    {
        "_id": "eenp_0xe8a650b6e34650f4be29eb5dc97a60263085cea1_0x95944d0f9c86794284abc375616c83b0e6a1a8b7",
        "amount": "10000000000000000000000",
        "holder": "0xe8a650b6e34650f4be29eb5dc97a60263085cea1",
        "return_height": "18446744073709551615",
        "source": "0x95944d0f9c86794284abc375616c83b0e6a1a8b7",
        "type": "eenp",
        "withdrawn": false
    }
];

class StakesPage extends React.Component {
    handleDepositStakeClick = () => {
        const hardware = Wallet.getWalletHardware();

        if(hardware === "ledger" && canStakeFromHardwareWallet() === false){
            alert("Staking from hardware Ledger Wallet will be supported soon. Stay tuned!");
        }
        else{
            this.props.dispatch(showModal({
                type: ModalTypes.CREATE_TRANSACTION,
                props: {
                    transactionType: 'deposit-stake'
                }
            }));
        }
    };

    handleWithdrawStakeClick = () => {
        const hardware = Wallet.getWalletHardware();

        if(hardware === "ledger" && canStakeFromHardwareWallet() === false){
            alert("Staking from hardware Ledger Wallet will be supported soon. Stay tuned!");
        }
        else{
            this.props.dispatch(showModal({
                type: ModalTypes.CREATE_TRANSACTION,
                props: {
                    transactionType: 'withdraw-stake'
                }
            }));
        }
    };

    handleChangeTDROPVoteDelegateClick = () => {
        this.props.dispatch(showModal({
            type: ModalTypes.CREATE_TRANSACTION,
            props: {
                transactionType: 'delegate-tdrop-vote'
            }
        }));
    };

    fetchStakes = () => {
        const {selectedAddress} = this.props;
        this.props.dispatch(updateAccountStakes(selectedAddress, false));
    };

    startPollingStakes(){
        //Fetch it immediately
        this.fetchStakes();

        this.pollStakesIntervalId = setInterval(this.fetchStakes, 60000);
    }

    stopPollingStakes(){
        if(this.pollStakesIntervalId){
            clearInterval(this.pollStakesIntervalId);
        }
    }

    componentDidMount(){
        this.startPollingStakes()
    }

    componentWillUnmount(){
        this.stopPollingStakes();
    }

    renderTDROPCard = () => {
        const {selectedAccount, chainId} = this.props;
        const tDropAsset = TDropAsset(chainId);
        const address = tDropAsset.contractAddress;
        const symbol = tDropAsset.symbol;
        const decimals = tDropAsset.decimals;
        const tnt20stakes = _.get(selectedAccount, ['tnt20Stakes'], {});
        const balanceStr = _.get(tnt20stakes, 'tdrop.balance', '0');
        const votingPowerStr = _.get(tnt20stakes, 'tdrop.votingPower', '0');
        const estimatedTDROPStr = _.get(tnt20stakes, 'tdrop.estimatedTokenOwnedWithRewards', '0');
        const votingDelegate = _.get(tnt20stakes, 'tdrop.votingDelegate', null);


        return (
            <div className={'Balance'}
                 key={address}
            >
                <div className='Balance__icon-wrapper'>
                    {
                        tDropAsset.iconUrl &&
                        <img className={'Balance__icon'}
                             src={tDropAsset.iconUrl}/>
                    }
                    {
                        _.isNil(tDropAsset.iconUrl) &&
                        <Jazzicon address={address} />
                    }
                </div>
                <div className={'Balance__name'}>{symbol}</div>
                {
                    (balanceStr === '0') &&
                    <div className={'Balance__amount'} style={{marginLeft: 'auto'}}>
                        <div className={'Balance__amount-title-and-value'}>
                            <span className={'Balance__amount-title'}>Staked: </span><span className={'Balance__amount-value'}>0</span>
                        </div>
                    </div>
                }
                {
                    (balanceStr !== '0') &&
                    <div className={'Balance__amount'} style={{marginLeft: 'auto'}}>
                        <div className={'Balance__amount-title-and-value'}>
                            <span className={'Balance__amount-title'}>Voting power: </span><span className={'Balance__amount-value'}>{`${trimDecimalPlaces(votingPowerStr, 5)}%`}</span>
                        </div>
                        <div className={'Balance__amount-title-and-value'}>
                            <span className={'Balance__amount-title'}>Staked + reward (est.): </span><span className={'Balance__amount-value'}>{trimDecimalPlaces(formatTNT20TokenAmountToLargestUnit(estimatedTDROPStr, decimals), 5)}</span>
                        </div>
                        <div className={'Balance__amount-title-and-value'}>
                            <span className={'Balance__amount-title'}>Votes delegated to:</span><span className={'Balance__amount-value'}>{truncate(votingDelegate)}</span>
                            <a style={{marginLeft: 6}}
                               onClick={this.handleChangeTDROPVoteDelegateClick}
                            >Change</a>
                        </div>
                    </div>
                }
            </div>
        );
    }

    render() {
        const {selectedAddress, selectedIdentity, selectedAccount, assets, chainId, isLoading} = this.props;
        const stakes = _.get(selectedAccount, ['stakes'], []);
        const tDropAsset = TDropAsset(chainId);
        const isFetchingStakes = false;

        return (
            <div className="StakesPage">
                <div className="StakesPage__detail-view">
                    <PageHeader title="Stakes"
                                sticky={true}
                    >
                        <div className="StakesPage__header-buttons">
                            <GhostButton title="Deposit Stake"
                                         iconUrl="/img/icons/stake-deposit@2x.png"
                                         onClick={this.handleDepositStakeClick}/>
                            <GhostButton title="Withdraw Stake"
                                         iconUrl="/img/icons/stake-withdraw@2x.png"
                                         style={{marginLeft: 12}}
                                         onClick={this.handleWithdrawStakeClick}/>
                        </div>
                    </PageHeader>

                    <div>
                    {
                        tDropAsset &&
                        this.renderTDROPCard()
                    }
                    </div>


                    {
                        (stakes.length === 0 && isFetchingStakes === false) &&
                        <EmptyState title={'No THETA/TFUEL Stakes'}
                                    subtitle={'Stake to earn tokens'}
                        />
                    }

                    {
                        isFetchingStakes &&
                        <MDSpinner singleColor="#ffffff" className="StakesPage__detail-view-spinner"/>
                    }

                    {
                        stakes.length > 0 &&
                        <StakesTable stakes={stakes}/>
                    }

                </div>
            </div>
        );
    }
}

const mapStateToProps = (state, ownProps) => {
    const {thetaWallet} = state;
    const selectedAddress = thetaWallet.selectedAddress;
    const identities = thetaWallet.identities;
    const accounts = thetaWallet.accounts;
    const tokens = thetaWallet.tokens;
    const chainId = thetaWallet.network.chainId;

    return {
        selectedAddress: selectedAddress,
        selectedIdentity: identities[selectedAddress],
        selectedAccount: accounts[selectedAddress],
        chainId: chainId,

        assets: getAllAssets(chainId, tokens),
    };
};

export default connect(mapStateToProps)(StakesPage);
