import React from 'react'
import './SendConfirmationModal.css';
import connect from "react-redux/es/connect/connect";
import Modal from '../components/Modal'
import GradientButton from "../components/buttons/GradientButton";
import Wallet from '../services/Wallet'
import {createTransaction} from "../state/actions/Transactions";
import {tokenTypeToTokenName} from "../constants/TokenTypes";

export class SendConfirmationModal extends React.Component {
    constructor(){
        super();

        this.state = {
            password: ''
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleSendClick = this.handleSendClick.bind(this);
    }

    handleChange(event) {
        let name = event.target.name;
        let value = event.target.value;

        this.setState({[name]: value});
    }

    handleSendClick(){
        this.props.dispatch(createTransaction(this.props.transaction, this.state.password));
    }

    render() {
        var { tokenType, amount, to, gas, gasPrice, transactionFee } = this.props.transaction;

        let renderDataRow = (title, value) =>{
            return (
                <div className="SendConfirmationModal__row">
                    <div className="SendConfirmationModal__row-title">
                        {title}
                    </div>
                    <div className="SendConfirmationModal__row-value">
                        {value}
                    </div>
                </div>
            );
        };

        return (
            <Modal>
                <div className="SendConfirmationModal">
                    <div className="SendConfirmationModal__title">
                        Confirm Transaction
                    </div>

                    <div className="SendConfirmationModal__amount-title">You are sending</div>
                    <div className="SendConfirmationModal__amount">{ amount }</div>
                    <div className="SendConfirmationModal__token-name">{ tokenTypeToTokenName(tokenType) }</div>
                    <div className="SendConfirmationModal__to-title">To recipient</div>
                    <div className="SendConfirmationModal__to">{ to }</div>

                    <div className="SendConfirmationModal__rows">
                        { renderDataRow("From", this.props.walletAddress) }
                        { renderDataRow("Transaction Type", "Asset Transfer") }
                        { renderDataRow("Gas Limit", gas) }
                        { renderDataRow("Gas Price", gasPrice) }
                        { renderDataRow("Transaction Fee", transactionFee + " ETH") }
                    </div>

                    <div className="SendConfirmationModal__password-container">
                        <div className="SendConfirmationModal__password-title">Enter your wallet password to sign this transaction</div>
                        <input className="ChoosePasswordCard__password-input"
                               placeholder="Enter wallet password"
                               name="password"
                               type="password"
                               value={this.state.password}
                               onChange={this.handleChange.bind(this)}
                        />
                    </div>

                    <GradientButton title="Confirm & Send"
                                    onClick={this.handleSendClick}
                                    loading={this.props.isCreatingTransaction}
                    />
                </div>
            </Modal>
        )
    }
}

const mapStateToProps = state => {
    return {
        walletAddress: state.wallet.address,
        isCreatingTransaction: state.transactions.isCreatingTransaction,
    };
};

export default connect(mapStateToProps)(SendConfirmationModal);
