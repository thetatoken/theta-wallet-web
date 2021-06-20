import React from "react";
import {connect} from 'react-redux'
import './StakesPage.css';
import PageHeader from "../components/PageHeader";
import {fetchStakes} from "../state/actions/Stakes";
import GhostButton from "../components/buttons/GhostButton";
import {showModal} from "../state/actions/Modals";
import ModalTypes from "../constants/ModalTypes";
import StakesTable from "../components/StakesTable";
import EmptyState from "../components/EmptyState";
import MDSpinner from "react-md-spinner";
import Wallet from "../services/Wallet";
import {canStakeFromHardwareWallet} from '../Flags';

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
                type: ModalTypes.DEPOSIT_STAKE,
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
                type: ModalTypes.WITHDRAW_STAKE,
            }));
        }
    };

    fetchStakes = () => {
        this.props.dispatch(fetchStakes());
    };

    startPollingStakes(){
        //Fetch it immediately
        this.fetchStakes();

        this.pollStakesIntervalId = setInterval(this.fetchStakes, 15000);
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

    render() {
        const {stakes, isFetchingStakes} = this.props;

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

                    {
                        (stakes.length === 0 && isFetchingStakes === false) &&
                        <EmptyState icon="/img/icons/empty-stakes@2x.png"
                                    title="No Stakes"
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
    return {
        stakes: state.stakes.stakes,

        isFetchingStakes: state.stakes.isFetchingStakes
    };
};

export default connect(mapStateToProps)(StakesPage);
