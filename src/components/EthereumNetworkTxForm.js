import React from 'react'
import './EthereumNetworkTxForm.css';
import {connect} from 'react-redux'
import Ethereum from '../services/Ethereum'
import TokenTypes from "../constants/TokenTypes";
import FormInputContainer from '../components/FormInputContainer'
import ValueWithTitle from '../components/ValueWithTitle'
import GradientButton from './buttons/GradientButton';
import {hasValidDecimalPlaces} from '../utils/Utils'
import {BigNumber} from 'bignumber.js';
import {store} from "../state";
import {showModal} from "../state/actions/Modals";
import ModalTypes from "../constants/ModalTypes";
import Networks from "../constants/Networks";

export class EthereumNetworkTxForm extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            tokenType: (props.defaultTokenType || TokenTypes.ERC20_THETA),
            to: '',
            amount: '',

            transactionFee: null,
            gasPrice: null,
            gasLimit: null,

            invalidAddress: false,
            insufficientFunds: false,
            invalidAmount: false,
            invalidDecimalPlaces: false,

            showGasDetails: false,
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleGasDetailsClick = this.handleGasDetailsClick.bind(this);
        this.handleSendClick = this.handleSendClick.bind(this);
        this.handleEntireBalanceClick = this.handleEntireBalanceClick.bind(this);
    }

    handleChange(event) {
        let name = event.target.name;
        let value = event.target.value;

        if (name === 'tokenType') {
            //Reset user entered data to ensure they don't send the incorrect amount after changing currency
            let defaults = {
                to: '',
                amount: '',

                transactionFee: null,
                gasPrice: null,
                gasLimit: null,

                invalidAddress: false,
                invalidDecimalPlaces: false,
                invalidAmount: false,
                insufficientFunds: false,
            };

            //Refresh the gas price since the user may have adjusted
            this.updateGasPrice();

            this.setState(Object.assign(defaults, {tokenType: value}));
        }
        else {
            if (name === "amount") {
                value = value.replace(/[^0-9.]/g, '');
            }

            this.setState({[name]: value}, () => {
                this.validate();

                this.updateTransactionFee();
            });
        }
    }

    handleGasDetailsClick() {
        this.setState({showGasDetails: !this.state.showGasDetails});
    }

    handleSendClick() {
        store.dispatch(showModal({
            type: ModalTypes.SEND_CONFIRMATION,
            props: {
                network: Networks.__deprecated__ETHEREUM,
                transaction: {
                    tokenType: this.state.tokenType,

                    to: this.state.to,
                    amount: this.state.amount,

                    gas: this.state.gasLimit,
                    gasPrice: this.state.gasPrice,

                    transactionFee: this.state.transactionFee
                }
            }
        }));
    }

    async updateGasPrice() {
        let gasPrice = await Ethereum.getGasPrice();

        this.setState({gasPrice: gasPrice});

        return gasPrice;
    }

    async updateGasLimit() {
        let txData = {
            tokenType: this.state.tokenType,
            to: this.state.to,
            from: this.props.walletAddress,
            amount: this.state.amount,
            gasPrice: this.state.gasPrice,
        };

        let gas = await Ethereum.estimateGas(txData);

        this.setState({gasLimit: gas});

        return gas;
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

    async updateTransactionFee() {
        if (this.isValid()) {
            let gasPrice = this.state.gasPrice;
            let gasLimit = await this.updateGasLimit();

            if (gasPrice != null && gasLimit != null) {
                let transactionFee = await Ethereum.getTransactionFee(this.state.gasPrice, gasLimit);

                this.setState({transactionFee: transactionFee});

                return transactionFee;
            } else {
                this.setState({transactionFee: null});

                return null;
            }
        }
        else {
            this.setState({transactionFee: null});

            return null;
        }
    }

    async calculateEntireEtherBalance() {
        let transactionFee = await this.updateTransactionFee();
        let balance = this.props.balancesByType[TokenTypes.ETHEREUM];

        if (transactionFee) {
            let transactionFeeBN = new BigNumber(transactionFee);
            let etherBalanceBN = new BigNumber(balance);
            let amountToSendBN = etherBalanceBN.minus(transactionFeeBN);

            this.setState({
                amount: amountToSendBN.toString()
            });
        }
    }

    async handleEntireBalanceClick() {
        if (this.state.tokenType === TokenTypes.ERC20_THETA) {
            let balance = this.props.balancesByType[TokenTypes.ERC20_THETA];

            this.setState({
                amount: balance
            });
        }
        else if (this.state.tokenType === TokenTypes.ETHEREUM) {
            let balance = this.props.balancesByType[TokenTypes.ETHEREUM];

            if (parseFloat(balance) !== 0.0) {
                this.setState({
                    amount: balance
                }, () => {
                    this.calculateEntireEtherBalance()
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
        let isAddress = Ethereum.isAddress(this.state.to);

        this.setState({invalidAddress: (isAddress === false)},
            () => {
                this.updateTransactionFee();
            });
    }

    async validateAmount() {
        let amountFloat = parseFloat(this.state.amount);
        let erc20ThetaBalance = this.props.balancesByType[TokenTypes.ERC20_THETA];
        let ethereumBalance = this.props.balancesByType[TokenTypes.ETHEREUM];
        let balance = null;

        if (this.state.tokenType === TokenTypes.ERC20_THETA) {
            balance = erc20ThetaBalance;
        } else if (this.state.tokenType === TokenTypes.ETHEREUM) {
            balance = ethereumBalance;
        }

        this.setState({
            insufficientFunds: (amountFloat > parseFloat(balance)),
            invalidAmount: (amountFloat === 0.0 || amountFloat < 0.0),
            invalidDecimalPlaces: !hasValidDecimalPlaces(this.state.amount, 18)
        }, () => {
            this.updateTransactionFee();
        });
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.state.to !== prevState.to) {
            this.validateAddress();
        }

        if (this.state.amount !== prevState.amount || this.state.gasPrice !== prevState.gasPrice) {
            this.validateAmount();

            this.updateTransactionFee();
        }
    }

    componentDidMount() {
        this.updateGasPrice();
    }

    render() {
        let hasToAddress = (this.state.to !== null && this.state.to !== '' && this.state.invalidAddress === false);
        let ERC20ThetaTitle = `ERC20 Theta (${ this.props.balancesByType[TokenTypes.ERC20_THETA] })`;
        let EthereumTitle = `Ethereum (${ this.props.balancesByType[TokenTypes.ETHEREUM] })`;
        let transactionFeeValueContent = (
            <React.Fragment>
                <span>Transaction Fee</span>
                <a className="TxForm__toggle-gas-details"
                   onClick={this.handleGasDetailsClick}>
                    {this.state.showGasDetails ? "Hide Gas Details" : "Show Gas Details"}
                </a>
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
            <div className="TxForm TxForm--ethereum-network">
                <FormInputContainer title="Token">
                    <select className="BottomBorderInput" value={this.state.tokenType} onChange={this.handleChange}
                            name="tokenType">
                        <option value={TokenTypes.ERC20_THETA}>{ERC20ThetaTitle}</option>
                        <option value={TokenTypes.ETHEREUM}>{EthereumTitle}</option>
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
                                        value={this.state.transactionFee ? this.state.transactionFee + " ETH" : '--'}/>
                    </div>

                    {
                        (this.state.showGasDetails &&
                            <div className="TxForm__gas-details-container">
                                <ValueWithTitle title="Gas Price"
                                                value={this.state.gasPrice ? this.state.gasPrice + " Gwei" : '--'}/>
                                <ValueWithTitle title="Gas Limit" value={this.state.gasLimit || '--'}/>
                            </div>
                        )
                    }
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
        balancesByType: state.wallet.ethereumBalancesByType,
        walletAddress: state.wallet.address,
    };
};

export default connect(mapStateToProps)(EthereumNetworkTxForm);
