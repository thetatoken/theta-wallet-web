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
        let isValid = Theta.isAddress(this.state.holder);

        this.setState({invalidHolder: (isValid === false)});
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.state.holder !== prevState.holder) {
            this.validateHolder();
        }
    }

    render() {
        let transactionFeeValueContent = (
            <React.Fragment>
                <span>Transaction Fee</span>
            </React.Fragment>
        );

        let isValid = this.isValid();
        let holderError = this.state.invalidHolder ? "Invalid guardian node address (holder)" : null;

        return (
            <div className="TxForm">
                <FormInputContainer title="Guardian Node Address (Holder)"
                                    error={holderError}>
                    <input className="BottomBorderInput"
                           name="holder"
                           placeholder="Enter guardian node address"
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

    };
};

export default connect(mapStateToProps)(WithdrawStakeTxForm);
