import _ from 'lodash';
import React from 'react'
import './GuardianNodeDelegatesModal.css';
import Modal from '../components/Modal'
import GradientButton from "../components/buttons/GradientButton";
import GuardianNodeDelegateSelector, {GuardianNodeDelegateItem} from "../components/GuardianNodeDelegateItem";
import {connect} from "react-redux";
import {fetchGuardianNodeDelegates} from "../state/actions/Nodes";
import Alert from "../components/Alert";
import Notification from "../components/Notification";

export class GuardianNodeDelegatesModal extends React.Component {
    constructor() {
        super();

        this.state = {
            selectedGuardianNodeDelegate: null
        };
    }

    componentDidMount() {
        this.props.dispatch(fetchGuardianNodeDelegates());
    }

    handleDelegateClick = (node) => {
        this.setState({
            selectedGuardianNodeDelegate: node
        });
    };

    handleContinueClick = () => {
        this.props.onSelectNode(this.state.selectedGuardianNodeDelegate);
        this.props.closeModal();
    };

    render() {
        const { guardianNodeDelegates, isFetchingGuardianNodeDelegates } = this.props;
        const { selectedGuardianNodeDelegate } = this.state;

        return (
            <Modal>
                <div className="GuardianNodeDelegatesModal">
                    <div className="GuardianNodeDelegatesModal__title">
                        Delegated Guardian Nodes
                    </div>
                    <div className={"GuardianNodeDelegatesContainer"}>
                        <div className={"GuardianNodeDelegatesContainer__instructions"}>
                            Select a Guardian Node delegate
                        </div>
                        <Notification message={'Delegated staking Guardian Nodes are nodes run by Theta community volunteers. Uptime of these nodes is not guaranteed, and you may not receive full TFUEL rewards if the node you delegate to has significant downtime.'}
                               color={'orange'}/>
                        <GuardianNodeDelegateSelector>
                            {
                                guardianNodeDelegates.map((guardianNodeDelegate, index) => {
                                    return (
                                        <GuardianNodeDelegateItem node={guardianNodeDelegate}
                                                                  isSelected={(selectedGuardianNodeDelegate && guardianNodeDelegate.id === selectedGuardianNodeDelegate.id)}
                                                                  onClick={this.handleDelegateClick}
                                        />
                                    );
                                })
                            }
                        </GuardianNodeDelegateSelector>
                        <div className={"GuardianNodeDelegatesContainer__footer"}>
                            <GradientButton title="Continue"
                                            disabled={(selectedGuardianNodeDelegate === null)}
                                            onClick={this.handleContinueClick}
                            />
                        </div>
                    </div>
                </div>
            </Modal>
        )
    }
}

const mapStateToProps = (state, ownProps) => {
    return {
        guardianNodeDelegates: state.nodes.guardianNodeDelegates,
        isFetchingGuardianNodeDelegates: state.nodes.isFetchingGuardianNodeDelegates
    };
};

export default connect(mapStateToProps)(GuardianNodeDelegatesModal);
