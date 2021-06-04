import React from 'react'
import './DepositStakeModal.css';
import Modal from '../components/Modal'
import DepositStakeTxForm from '../components/transactions/DepositStakeTxForm'
import Theta from "../services/Theta";
import GradientButton from "../components/buttons/GradientButton";
import Networks, {canGuardianNodeStake} from "../constants/Networks";
import ThetaJS from "../libs/thetajs.esm";
import StakePurposeSelector, {StakePurposeSelectorItem} from '../components/StakePurposeSelector';
import {store} from "../state";
import {showModal} from "../state/actions/Modals";
import ModalTypes from "../constants/ModalTypes";

export default class DepositStakeModal extends React.Component {
    constructor() {
        super();

        this.state = {
            purpose: null,
            selectedPurpose: null,
            selectedGuardianNodeDelegate: null
        };
    }

    handleContinueClick = () => {
        this.setState({
            purpose: this.state.selectedPurpose
        });
    };

    handlePurposeClick = (purpose) => {
        this.setState({
            selectedPurpose: purpose
        });
    };

    handleDelegatedGuardianNodeClick = () => {
        store.dispatch(showModal({
            type: ModalTypes.GUARDIAN_NODE_DELEGATE_SELECTOR,
            props: {
                onSelectNode: (node) => {
                    this.setState({
                        selectedGuardianNodeDelegate: node,
                        purpose: ThetaJS.StakePurposes.StakeForGuardian
                    });
                }
            }
        }));
    }


    render() {
        const {purpose, selectedPurpose, selectedGuardianNodeDelegate, guardianNodeDelegate} = this.state;
        const chainId = Theta.getChainID();
        const isGuardianNodeStakingDisabled = !canGuardianNodeStake(chainId);

        return (
            <Modal>
                <div className="DepositStakeModal">
                    <div className="DepositStakeModal__title">
                        Deposit Stake
                    </div>
                    {
                        purpose && selectedGuardianNodeDelegate &&
                        <div className={"StakePurposeContainer__instructions"}>
                            {`to ${selectedGuardianNodeDelegate.name}'s Node`}
                        </div>
                    }
                    {
                        (purpose !== null) &&
                        <DepositStakeTxForm purpose={purpose}
                                            key={purpose}
                                            guardianNodeDelegate={selectedGuardianNodeDelegate}
                        />
                    }
                    {
                        purpose === null &&
                        <div className={"StakePurposeContainer"}>
                            <div className={"StakePurposeContainer__instructions"}>
                                Please choose the staking purpose
                            </div>
                            <StakePurposeSelector>
                                <StakePurposeSelectorItem purpose={ThetaJS.StakePurposes.StakeForValidator}
                                                          title={"My Validator Node"}
                                                          subtitle={"Deposit stake to your Validator node"}
                                                          isSelected={(selectedPurpose === ThetaJS.StakePurposes.StakeForValidator)}
                                                          onClick={this.handlePurposeClick}
                                />
                                <StakePurposeSelectorItem purpose={ThetaJS.StakePurposes.StakeForGuardian}
                                                          title={"My Guardian Node"}
                                                          subtitle={"Deposit stake to your Guardian node"}
                                                          isSelected={(selectedPurpose === ThetaJS.StakePurposes.StakeForGuardian)}
                                                          isDisabled={isGuardianNodeStakingDisabled}
                                                          onClick={this.handlePurposeClick}
                                />
                                <StakePurposeSelectorItem purpose={ThetaJS.StakePurposes.StakeForGuardian}
                                                          title={"Delegated Guardian Node"}
                                                          subtitle={"Deposit stake to a community run Guardian node"}
                                                          isDisabled={isGuardianNodeStakingDisabled}
                                                          onClick={this.handleDelegatedGuardianNodeClick}
                                />
                            </StakePurposeSelector>
                            <div className={"StakePurposeContainer__footer"}>
                                <GradientButton title="Continue"
                                                disabled={(selectedPurpose === null)}
                                                onClick={this.handleContinueClick}
                                />
                            </div>
                        </div>
                    }
                </div>
            </Modal>
        )
    }
}
