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
import TransactionList from "../components/TransactionList";

const sampleStakes = [
    {
        "_id": "5df2c62336472e14bfc85ad2",
        "holder": "0x4b6aa6b26572709082ef9c94fccdc494f4c8bfdb",
        "source": "0xfa7393eb179fdb4202229ef00607b41c1ccedc7f",
        "amount": "50000000000000000000000000",
        "withdrawn": false,
        "return_height": "18446744073709551615"
    },
    {
        "_id": "5df2c62336472e14bfc85ad3",
        "holder": "0x3eadf9fb7645b9e255e30d8278485e8c2f2672a4",
        "source": "0xfa7393eb179fdb4202229ef00607b41c1ccedc7f",
        "amount": "50000000000000000000000000",
        "withdrawn": false,
        "return_height": "18446744073709551615"
    },
    {
        "_id": "5df2c62336472e14bfc85ad4",
        "holder": "0x20c487d00f9e3b4bdca94f4e32f9cb3c09380360",
        "source": "0xfa7393eb179fdb4202229ef00607b41c1ccedc7f",
        "amount": "50000000000000000000000000",
        "withdrawn": false,
        "return_height": "18446744073709551615"
    },
    {
        "_id": "5df2c62336472e14bfc85ad5",
        "holder": "0x1d6101e76cbbf15915e768dffb1764197fc1715b",
        "source": "0xfa7393eb179fdb4202229ef00607b41c1ccedc7f",
        "amount": "50000000000000000000000000",
        "withdrawn": false,
        "return_height": "18446744073709551615"
    }
];

class StakesPage extends React.Component {
    handleDepositStakeClick = () => {
        this.props.dispatch(showModal({
            type: ModalTypes.DEPOSIT_STAKE,
        }));
    };

    handleWithdrawStakeClick = () => {
        this.props.dispatch(showModal({
            type: ModalTypes.WITHDRAW_STAKE,
        }));
    };

    componentDidMount(){
        this.props.dispatch(fetchStakes());
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
