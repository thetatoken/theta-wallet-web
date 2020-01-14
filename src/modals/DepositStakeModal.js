import React from 'react'
import './DepositStakeModal.css';
import Modal from '../components/Modal'
import DepositStakeTxForm from '../components/transactions/DepositStakeTxForm'
import Theta from "../services/Theta";
import GradientButton from "../components/buttons/GradientButton";
import Networks from "../constants/Networks";
import ThetaJS from "../libs/thetajs.esm";
import StakePurposeSelector, {StakePurposeSelectorItem} from '../components/StakePurposeSelector';

export default class DepositStakeModal extends React.Component {
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
        const isGuardianNodeStakingDisabled = (chainId !== Networks.THETA_TESTNET_AMBER);

        return (
            <Modal>
                <div className="DepositStakeModal">
                    <div className="DepositStakeModal__title">
                        Deposit Stake
                    </div>
                    {
                        (purpose !== null) &&
                        <DepositStakeTxForm purpose={purpose}
                                            key={purpose}/>
                    }
                    {
                        purpose === null &&
                        <div className={"StakePurposeContainer"}>
                            <div className={"StakePurposeContainer__instructions"}>
                                Please choose the staking purpose
                            </div>
                            <StakePurposeSelector>
                                <StakePurposeSelectorItem purpose={ThetaJS.StakePurposes.StakeForValidator}
                                                          title={"Validator Node"}
                                                          subtitle={"Deposit stake to a Validator node"}
                                                          isSelected={(selectedPurpose === ThetaJS.StakePurposes.StakeForValidator)}
                                                          onClick={this.handlePurposeClick}
                                />
                                <StakePurposeSelectorItem purpose={ThetaJS.StakePurposes.StakeForGuardian}
                                                          title={"Guardian Node"}
                                                          subtitle={"Deposit stake to your Guardian node"}
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
