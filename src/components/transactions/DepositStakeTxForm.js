import React from 'react'
import './TxForm.css';
import './DepositStakeTxForm.css';
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

const TRANSACTION_FEE = 0.000001;
const MIN_DEPOSIT_STAKE_AMOUNT = 0.0;//TODO this should be 10,000.0

export class DepositStakeTxForm extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            tokenType: (props.defaultTokenType || TokenTypes.THETA),
            holder: '',
            amount: '',

            transactionFee: Theta.getTransactionFee(),

            invalidHolder: false,
            insufficientFunds: false,
            invalidAmount: false,
            invalidDecimalPlaces: false,
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleEntireBalanceClick = this.handleEntireBalanceClick.bind(this);
    }

    getBalanceOfTokenType(tokenType){
        return _.get(this.props.balancesByType, tokenType, 0);
    }

    handleChange(event) {
        let name = event.target.name;
        let value = event.target.value;

        if (name === 'tokenType') {
            //Reset user entered data to ensure they don't send the incorrect amount after changing currency
            let defaults = {
                holder: '',
                amount: '',

                transactionFee: TRANSACTION_FEE,

                invalidHolder: false,
                invalidDecimalPlaces: false,
                invalidAmount: false,
                insufficientFunds: false,
            };

            this.setState(Object.assign(defaults, {tokenType: value}));
        }
        else {
            if (name === "amount") {
                value = value.replace(/[^0-9.]/g, '');
            }

            this.setState({[name]: value}, () => {
                this.validate();
            });
        }
    }

    handleDepositStakeClick = () => {
        store.dispatch(showModal({
            type: ModalTypes.DEPOSIT_STAKE_CONFIRMATION,
            props: {
                network: Theta.getChainID(),
                transaction: {
                    tokenType: this.state.tokenType,

                    from: this.props.walletAddress,

                    holder: this.state.holder,
                    amount: this.state.amount,

                    transactionFee: this.state.transactionFee
                }
            }
        }));
    };

    isValid() {
        return (
            this.state.holder.length > 0 &&
            this.state.amount.length > 0 &&
            this.state.invalidHolder === false &&
            this.state.insufficientFunds === false &&
            this.state.invalidDecimalPlaces === false &&
            this.state.invalidAmount === false);
    }

    async calculateEntireTFuelBalance() {
        let transactionFee = this.state.transactionFee;
        let balance = this.getBalanceOfTokenType(TokenTypes.THETA_FUEL);

        if (transactionFee) {
            let transactionFeeBN = new BigNumber(transactionFee);
            let tfuelBalanceBN = new BigNumber(balance);
            let amountToSendBN = tfuelBalanceBN.minus(transactionFeeBN);

            this.setState({
                amount: amountToSendBN.toString()
            });
        }
    }

    async handleEntireBalanceClick() {
        if (this.state.tokenType === TokenTypes.THETA) {
            let balance = this.getBalanceOfTokenType(TokenTypes.THETA);

            this.setState({
                amount: balance
            });
        }
    }

    validate() {
        if (this.state.holder.length > 0) {
            this.validateHolderSummary();
        }

        if (this.state.amount.length > 0) {
            this.validateAmount();
        }
    }

    async validateHolderSummary() {
        let isValid = Theta.isHolderSummary(this.state.holder);

        this.setState({invalidHolder: (isValid === false)});
    }

    async validateAmount() {
        let amountFloat = parseFloat(this.state.amount);
        let thetaBalance = this.getBalanceOfTokenType(TokenTypes.THETA);
        let balance = null;

        if (this.state.tokenType === TokenTypes.THETA) {
            balance = thetaBalance;
        }

        this.setState({
            insufficientFunds: (amountFloat > parseFloat(balance)),
            //TODO this stake amount should be 10,000
            invalidAmount: (amountFloat === 0.0 || amountFloat < MIN_DEPOSIT_STAKE_AMOUNT),
            invalidDecimalPlaces: !hasValidDecimalPlaces(this.state.amount, 18)
        });
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.state.holder !== prevState.holder) {
            this.validateHolderSummary();
        }

        if (this.state.amount !== prevState.amount || this.state.gasPrice !== prevState.gasPrice) {
            this.validateAmount();
        }
    }

    render() {
        let hasHolder = (this.state.holder !== null && this.state.holder !== '' && this.state.invalidHolder === false);
        let thetaTitle = `Theta (${ this.getBalanceOfTokenType(TokenTypes.THETA) })`;
        let transactionFeeValueContent = (
            <React.Fragment>
                <span>Transaction Fee</span>
            </React.Fragment>
        );
        let amountTitleContent = (
            <React.Fragment>
                <span>Amount</span>
                {
                    hasHolder &&
                    <a className="TxForm__entire-balance"
                       onClick={this.handleEntireBalanceClick}>
                        Entire Balance
                    </a>
                }
            </React.Fragment>
        );

        let isValid = this.isValid();
        let toError = this.state.invalidHolder ? "Invalid holder summary" : null;
        let amountError = null;

        if (this.state.insufficientFunds) {
            amountError = "Insufficient funds";
        }
        else if (this.state.invalidDecimalPlaces) {
            amountError = "Invalid denomination";
        }
        else if (this.state.invalidAmount) {
            amountError = "Invalid amount";
        }

        return (
            <div className="TxForm">
                <FormInputContainer title="Token">
                    <select className="BottomBorderInput" value={this.state.tokenType} onChange={this.handleChange}
                            name="tokenType">
                        <option value={TokenTypes.THETA}>{thetaTitle}</option>
                    </select>
                </FormInputContainer>
                <FormInputContainer title="Guardian Node Holder (Summary)"
                                    error={toError}>
                    <input className="BottomBorderInput"
                           name="holder"
                           placeholder="Enter guardian node summary"
                           value={this.state.holder}
                           onChange={this.handleChange}/>
                </FormInputContainer>
                <FormInputContainer title={amountTitleContent}
                                    error={amountError}>
                    <input className="BottomBorderInput" type="text" value={this.state.amount}
                           name="amount"
                           placeholder="Enter amount to stake"
                           onChange={this.handleChange}/>
                </FormInputContainer>

                <div className="TxForm__fee-container">
                    <div className="">
                        <ValueWithTitle title={transactionFeeValueContent}
                                        value={this.state.transactionFee + " TFuel"}/>
                    </div>
                </div>
                <GradientButton title="Deposit Stake"
                                disabled={isValid === false}
                                onClick={this.handleDepositStakeClick}
                />
            </div>
        )
    }
}

const mapStateToProps = state => {
    return {
        balancesByType: state.wallet.balancesByType,
        walletAddress: state.wallet.address,
    };
};

export default connect(mapStateToProps)(DepositStakeTxForm);
