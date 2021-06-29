import React from 'react'
import './WithdrawStakeModal.css';
import Modal from '../components/Modal'
import WithdrawStakeTxForm from '../components/transactions/WithdrawStakeTxForm'
import Theta from "../services/Theta";
import GradientButton from "../components/buttons/GradientButton";
import Networks, {canGuardianNodeStake} from "../constants/Networks";
import ThetaJS from "../libs/thetajs.esm";
import StakePurposeSelector, {StakePurposeSelectorItem} from '../components/StakePurposeSelector';

export default class WithdrawStakeModal extends React.Component {
    constructor() {
        super();

        this.state = {
            purpose: null,
            selectedPurpose: null
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

    render() {
        const {purpose, selectedPurpose} = this.state;
        const chainId = Theta.getChainID();
        const isGuardianNodeStakingDisabled = !canGuardianNodeStake(chainId);

        return (
            <Modal>
                <div className="WithdrawStakeModal">
                    <div className="WithdrawStakeModal__title">
                        Withdraw Stake
                    </div>
                    {
                        (purpose !== null) &&
                        <WithdrawStakeTxForm purpose={purpose}
                                             key={purpose}/>
                    }
                    {
                        purpose === null &&
                        <div className={"StakePurposeContainer"}>
                            <div className={"StakePurposeContainer__instructions"}>
                                Please choose the staking purpose
                            </div>
                            <StakePurposeSelector>
                                <StakePurposeSelectorItem purpose={ThetaJS.StakePurposes.StakeForEliteEdge}
                                                          title={"Edge Node"}
                                                          subtitle={"Withdraw stake from a Edge node"}
                                                          isSelected={(selectedPurpose === ThetaJS.StakePurposes.StakeForEliteEdge)}
                                                          onClick={this.handlePurposeClick}
                                />
                                <StakePurposeSelectorItem purpose={ThetaJS.StakePurposes.StakeForValidator}
                                                          title={"Validator Node"}
                                                          subtitle={"Withdraw stake from a Validator node"}
                                                          isSelected={(selectedPurpose === ThetaJS.StakePurposes.StakeForValidator)}
                                                          onClick={this.handlePurposeClick}
                                />
                                <StakePurposeSelectorItem purpose={ThetaJS.StakePurposes.StakeForGuardian}
                                                          title={"Guardian Node"}
                                                          subtitle={"Withdraw stake from your Guardian node"}
                                                          isSelected={(selectedPurpose === ThetaJS.StakePurposes.StakeForGuardian)}
                                                          isDisabled={isGuardianNodeStakingDisabled}
                                                          onClick={this.handlePurposeClick}
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
