import React from 'react'
import './DepositStakeModal.css';
import Modal from '../components/Modal'
import DepositStakeTxForm from '../components/transactions/DepositStakeTxForm'
import Theta from "../services/Theta";
import GradientButton from "../components/buttons/GradientButton";
import Networks from "../constants/Networks";
import ThetaJS from "../libs/thetajs.esm";

const classNames = require('classnames');

class DepositStakePurposeSelectorItem extends React.Component {
    render() {
        const {purpose, title, subtitle, isDisabled, isSelected, onClick} = this.props;
        const className = classNames("DepositStakePurposeSelectorItem", {
            "DepositStakePurposeSelectorItem--is-selected" : isSelected,
            "DepositStakePurposeSelectorItem--is-disabled": isDisabled
        });

        return (
            <a className={className}
               onClick={() => {
                   if(!isDisabled && onClick){
                       onClick(purpose);
                   }
               }}
            >
                <div className={"DepositStakePurposeSelectorItem__title"}>{title}</div>
                <div className={"DepositStakePurposeSelectorItem__subtitle"}>{subtitle}</div>
            </a>
        )
    }
}

export default class DepositStakeModal extends React.Component {
    constructor(){
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
                        <div className={"DepositStakePurposeContainer"}>
                            <div className={"DepositStakePurposeContainer__instructions"}>
                                Please choose the staking purpose
                            </div>
                            <div className={"DepositStakePurposeSelector"}>
                                <DepositStakePurposeSelectorItem purpose={ThetaJS.StakePurposes.StakeForValidator}
                                                                 title={"Validator Node"}
                                                                 subtitle={"Deposit stake to a Validator node"}
                                                                 isSelected={(selectedPurpose === ThetaJS.StakePurposes.StakeForValidator)}
                                                                 onClick={this.handlePurposeClick}
                                />
                                <DepositStakePurposeSelectorItem purpose={ThetaJS.StakePurposes.StakeForGuardian}
                                                                 title={"Guardian Node"}
                                                                 subtitle={"Deposit stake to your Guardian node"}
                                                                 isSelected={(selectedPurpose === ThetaJS.StakePurposes.StakeForGuardian)}
                                                                 isDisabled={isGuardianNodeStakingDisabled}
                                                                 onClick={this.handlePurposeClick}
                                />
                            </div>
                            <div className={"DepositStakePurposeContainer__footer"}>
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
