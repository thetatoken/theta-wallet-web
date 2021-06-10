import React from 'react'
import './TxForm.css';
import './SendTxForm.css';
import _ from 'lodash'
import {connect} from 'react-redux'
import Theta from '../../services/Theta'
import TokenTypes from "../../constants/TokenTypes";
import FormInputContainer from '../FormInputContainer'
import ValueWithTitle from '../ValueWithTitle'
import GradientButton from '../buttons/GradientButton';
import {hasValidDecimalPlaces, numberWithCommas} from '../../utils/Utils'
import {BigNumber} from 'bignumber.js';
import {store} from "../../state";
import {showModal} from "../../state/actions/Modals";
import ModalTypes from "../../constants/ModalTypes";

export class SendTxForm extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            tokenType: (props.defaultTokenType || TokenTypes.THETA),
            to: '',
            amount: '',

            transactionFee: Theta.getTransactionFee(),

            invalidAddress: false,
            insufficientFunds: false,
            invalidAmount: false,
            invalidDecimalPlaces: false,
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleSendClick = this.handleSendClick.bind(this);
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
                to: '',
                amount: '',

                transactionFee: Theta.getTransactionFee(),

                invalidAddress: false,
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

    handleSendClick() {
        let to = this.state.to.toLowerCase();
        if(to.startsWith("0x") === false){
            to = "0x" + to;
        }

        store.dispatch(showModal({
            type: ModalTypes.SEND_CONFIRMATION,
            props: {
                network: Theta.getChainID(),
                transaction: {
                    tokenType: this.state.tokenType,

                    from: this.props.walletAddress,

                    to: to,
                    amount: this.state.amount,

                    transactionFee: this.state.transactionFee
                }
            }
        }));
    }

    isValid() {
        return (
            this.state.to.length > 0 &&
            this.state.amount.length > 0 &&
            this.state.invalidAddress === false &&
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
        else if (this.state.tokenType === TokenTypes.THETA_FUEL) {
            let balance = this.getBalanceOfTokenType(TokenTypes.THETA_FUEL);

            if (parseFloat(balance) !== 0.0) {
                this.setState({
                    amount: balance
                }, () => {
                    this.calculateEntireTFuelBalance()
                });
            }
        }
    }

    validate() {
        if (this.state.to.length > 0) {
            this.validateAddress();
        }

        if (this.state.amount.length > 0) {
            this.validateAmount();
        }
    }

    async validateAddress() {
        let isAddress = Theta.isAddress(this.state.to);

        this.setState({invalidAddress: (isAddress === false)});
    }

    async validateAmount() {
        let amountFloat = parseFloat(this.state.amount);
        let thetaBalance = this.getBalanceOfTokenType(TokenTypes.THETA);
        let tfuelBalance = this.getBalanceOfTokenType(TokenTypes.THETA_FUEL);
        let balance = null;

        if (this.state.tokenType === TokenTypes.THETA) {
            balance = thetaBalance;
        } else if (this.state.tokenType === TokenTypes.THETA_FUEL) {
            balance = tfuelBalance;
        }

        this.setState({
            insufficientFunds: (amountFloat > parseFloat(balance)),
            invalidAmount: (amountFloat === 0.0 || amountFloat < 0.0),
            invalidDecimalPlaces: !hasValidDecimalPlaces(this.state.amount, 18)
        });
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.state.to !== prevState.to) {
            this.validateAddress();
        }

        if (this.state.amount !== prevState.amount || this.state.gasPrice !== prevState.gasPrice) {
            this.validateAmount();
        }
    }

    render() {
        const { balancesLoaded } = this.props;
        let hasToAddress = (this.state.to !== null && this.state.to !== '' && this.state.invalidAddress === false);
        let thetaTitle =  (balancesLoaded ? `Theta (${ numberWithCommas(this.getBalanceOfTokenType(TokenTypes.THETA)) })` : 'Theta (Loading...)') ;
        let tfuelTitle = (balancesLoaded ? `TFuel (${ numberWithCommas(this.getBalanceOfTokenType(TokenTypes.THETA_FUEL)) })` : 'TFuel (loading...)');
        let transactionFeeValueContent = (
            <React.Fragment>
                <span>Transaction Fee</span>
            </React.Fragment>
        );
        let amountTitleContent = (
            <React.Fragment>
                <span>Amount</span>
                {
                    hasToAddress &&
                    <a className="TxForm__entire-balance"
                       onClick={this.handleEntireBalanceClick}>
                        Entire Balance
                    </a>
                }
            </React.Fragment>
        );

        let isValid = this.isValid();
        let toError = this.state.invalidAddress ? "Invalid address" : null;
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
                        <option value={TokenTypes.THETA_FUEL}>{tfuelTitle}</option>
                    </select>
                </FormInputContainer>
                <FormInputContainer title="To"
                                    error={toError}>
                    <input className="BottomBorderInput"
                           name="to"
                           placeholder="Enter address"
                           value={this.state.to}
                           onChange={this.handleChange}/>
                </FormInputContainer>
                <FormInputContainer title={amountTitleContent}
                                    error={amountError}>
                    <input className="BottomBorderInput" type="text" value={this.state.amount}
                           name="amount"
                           placeholder="Enter amount to send"
                           onChange={this.handleChange}/>
                </FormInputContainer>

                <div className="TxForm__fee-container">
                    <div className="">
                        <ValueWithTitle title={transactionFeeValueContent}
                                        value={this.state.transactionFee + " TFuel"}/>
                    </div>
                </div>
                <GradientButton title="Send"
                                disabled={isValid === false}
                                onClick={this.handleSendClick}
                />
            </div>
        )
    }
}

const mapStateToProps = state => {
    return {
        balancesByType: state.wallet.balancesByType,
        walletAddress: state.wallet.address,

        balancesLoaded: !_.isNil(state.wallet.balancesRefreshedAt)
    };
};

export default connect(mapStateToProps)(SendTxForm);
