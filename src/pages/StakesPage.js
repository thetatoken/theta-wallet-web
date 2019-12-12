import React from "react";
import {connect} from 'react-redux'
import './StakesPage.css';
import PageHeader from "../components/PageHeader";
import {fetchStakes} from "../state/actions/Stakes";
import GhostButton from "../components/buttons/GhostButton";

class StakesPage extends React.Component {
    handleStakeClick = () => {

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
                            <GhostButton title="Stake"
                                         iconUrl="/img/icons/send@2x.png"
                                         onClick={this.handleStakeClick}/>
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
