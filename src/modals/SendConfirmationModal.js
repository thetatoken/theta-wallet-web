import React from 'react'
import './SendConfirmationModal.css';
import connect from "react-redux/es/connect/connect";
import Modal from '../components/Modal'
import GradientButton from "../components/buttons/GradientButton";
import Wallet from '../services/Wallet'
import {createTransaction} from "../state/actions/Transactions";
import {tokenTypeToTokenName} from "../constants/TokenTypes";
import Networks, {isEthereumNetwork, isThetaNetwork} from "../constants/Networks";

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
        let { tokenType, amount, to, gas, gasPrice, transactionFee } = this.props.transaction;
        let isValid = this.state.password.length > 0;
        let isLoading = this.props.isCreatingTransaction;
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
        let detailRows = null;

        if(isEthereumNetwork(this.props.network)){
            detailRows = (
                <React.Fragment>
                    { renderDataRow("From", this.props.walletAddress) }
                    { renderDataRow("Transaction Type", "Asset Transfer") }
                    { renderDataRow("Gas Limit", gas) }
                    { renderDataRow("Gas Price", gasPrice + " Gwei") }
                    { renderDataRow("Transaction Fee", transactionFee + " ETH") }
                </React.Fragment>
            );
        }
        else if(isThetaNetwork(this.props.network)){
            detailRows = (
                <React.Fragment>
                    { renderDataRow("From", this.props.walletAddress) }
                    { renderDataRow("Transaction Fee", transactionFee + " TFUEL") }
                </React.Fragment>
            );
        }

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
                        { detailRows }
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
                                    disabled={isLoading || isValid === false}
                                    onClick={this.handleSendClick}
                                    loading={isLoading}
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
