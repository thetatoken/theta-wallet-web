import React from 'react'
import './TxForm.css';
import './WithdrawStakeTxForm.css';
import _ from 'lodash'
import {connect} from 'react-redux'
import Theta from '../../services/Theta'
import TokenTypes from "../../constants/TokenTypes";
import FormInputContainer from '../FormInputContainer'
import ValueWithTitle from '../ValueWithTitle'
import GradientButton from '../buttons/GradientButton';
import {hasValidDecimalPlaces} from '../../utils/Utils'
import {BigNumber} from 'bignumber.js';
import {store} from "../../state";
import {showModal} from "../../state/actions/Modals";
import ModalTypes from "../../constants/ModalTypes";
import Config from "../../Config";
import ThetaJS from "../../libs/thetajs.esm";

export class WithdrawStakeTxForm extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            holder: '',

            transactionFee: Theta.getTransactionFee(),

            invalidHolder: false,
        };

        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(event) {
        let name = event.target.name;
        let value = event.target.value;

        this.setState({[name]: value}, () => {
            this.validate();
        });
    }

    handleWithdrawStakeClick = () => {
        store.dispatch(showModal({
            type: ModalTypes.WITHDRAW_STAKE_CONFIRMATION,
            props: {
                network: Theta.getChainID(),
                transaction: {
                    purpose: this.props.purpose,

                    from: this.props.walletAddress,

                    holder: this.state.holder,

                    transactionFee: this.state.transactionFee
                }
            }
        }));
    };

    isValid() {
        return (
            this.state.holder.length > 0 &&
            this.state.invalidHolder === false
        );
    }

    validate() {
        if (this.state.holder.length > 0) {
            this.validateHolder();
        }
    }

    async validateHolder() {
        let isValid = false;

        isValid = Theta.isAddress(this.state.holder);

        this.setState({invalidHolder: (isValid === false)});
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.state.holder !== prevState.holder) {
            this.validateHolder();
        }
    }

    render() {
        const {purpose} = this.props;
        let transactionFeeValueContent = (
            <React.Fragment>
                <span>Transaction Fee</span>
            </React.Fragment>
        );

        let isValid = this.isValid();
        let holderError = null;

        if(this.state.invalidHolder){
            if(purpose === ThetaJS.StakePurposes.StakeForValidator){
                holderError = "Invalid validator node address (holder)";
            }
            else if(purpose === ThetaJS.StakePurposes.StakeForGuardian){
                holderError = "Invalid guardian node address (holder)";
            }
            else if(purpose === ThetaJS.StakePurposes.StakeForEliteEdge){
                holderError = "Invalid guardian node address (holder)";
            }
        }

        let holderTitle = "";
        let holderPlaceholder = "";

        if(purpose === ThetaJS.StakePurposes.StakeForValidator){
            holderTitle = "Validator Node Address (Holder)";
            holderPlaceholder = "Enter validator node address";
        }
        else if(purpose === ThetaJS.StakePurposes.StakeForGuardian){
            holderTitle = "Guardian Node Address (Holder)";
            holderPlaceholder = "Enter guardian node address";
        }
        else if(purpose === ThetaJS.StakePurposes.StakeForEliteEdge){
            holderTitle = "Edge Node Address (Holder)";
            holderPlaceholder = "Enter edge node address";
        }

        return (
            <div className="TxForm">
                <FormInputContainer title={holderTitle}
                                    error={holderError}>
                    <input className="BottomBorderInput"
                           name="holder"
                           placeholder={holderPlaceholder}
                           value={this.state.holder}
                           onChange={this.handleChange}/>
                </FormInputContainer>

                <div className="TxForm__fee-container">
                    <div className="">
                        <ValueWithTitle title={transactionFeeValueContent}
                                        value={this.state.transactionFee + " TFuel"}/>
                    </div>
                </div>
                <GradientButton title="Withdraw Stake"
                                disabled={isValid === false}
                                onClick={this.handleWithdrawStakeClick}
                />
            </div>
        )
    }
}

const mapStateToProps = state => {
    return {
        walletAddress: state.wallet.address,
    };
};

export default connect(mapStateToProps)(WithdrawStakeTxForm);
