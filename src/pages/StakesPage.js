import React from "react";
import {connect} from 'react-redux'
import './StakesPage.css';
import PageHeader from "../components/PageHeader";
import {fetchStakes} from "../state/actions/Stakes";
import GhostButton from "../components/buttons/GhostButton";
import {showModal} from "../state/actions/Modals";
import ModalTypes from "../constants/ModalTypes";

class StakesPage extends React.Component {
    handleDepositStakeClick = () => {
        this.props.dispatch(showModal({
            type: ModalTypes.DEPOSIT_STAKE,
        }));
    };

    handleWithdrawStakeClick = () => {
        this.props.dispatch(showModal({
            type: ModalTypes.DEPOSIT_STAKE,
        }));
    };

    componentDidMount(){
        this.props.dispatch(fetchStakes());
    }

    render() {
        return (
            <div className="StakesPage">
                <div className="StakesPage__detail-view">
                    <PageHeader title="Stakes"
                                sticky={true}
                    >
                        <div className="StakesPage__header-buttons">
                            <GhostButton title="Deposit Stake"
                                         iconUrl="/img/icons/send@2x.png"
                                         onClick={this.handleDepositStakeClick}/>
                            <GhostButton title="Withdraw Stake"
                                         iconUrl="/img/icons/send@2x.png"
                                         style={{marginLeft: 12}}
                                         onClick={this.handleWithdrawStakeClick}/>
                        </div>
                    </PageHeader>
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
