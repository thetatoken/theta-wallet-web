import React from 'react'
import './TxConfirmationModal.css';
import './SendConfirmationModal.css';
import connect from "react-redux/es/connect/connect";
import Modal from '../components/Modal'
import GradientButton from "../components/buttons/GradientButton";
import Wallet from '../services/Wallet'
import {createSendTransaction} from "../state/actions/Transactions";
import {tokenTypeToTokenName} from "../constants/TokenTypes";
import {numberWithCommas} from "../utils/Utils";

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
        this.props.dispatch(createSendTransaction(this.props.network, this.props.transaction, this.state.password));
    }

    render() {
        let { tokenType, amount, to, transactionFee } = this.props.transaction;
        let isValid = Wallet.getWalletHardware() || this.state.password.length > 0;
        let isLoading = this.props.isCreatingTransaction;
        let renderDataRow = (title, value) =>{
            return (
                <div className="TxConfirmationModal__row">
                    <div className="TxConfirmationModal__row-title">
                        {title}
                    </div>
                    <div className="TxConfirmationModal__row-value">
                        {value}
                    </div>
                </div>
            );
        };
        let detailRows = null;

        detailRows = (
            <React.Fragment>
                { renderDataRow("From", this.props.walletAddress) }
                { renderDataRow("Transaction Fee", transactionFee + " TFUEL") }
            </React.Fragment>
        );

        let passwordRow = null;

        if(!Wallet.getWalletHardware()){
            passwordRow = (
                <div className="TxConfirmationModal__password-container">
                    <div className="TxConfirmationModal__password-title">Enter your wallet password to sign this transaction</div>
                    <input className="ChoosePasswordCard__password-input"
                           placeholder="Enter wallet password"
                           name="password"
                           type="password"
                           value={this.state.password}
                           onChange={this.handleChange.bind(this)}
                    />
                </div>
            );
        }

        return (
            <Modal>
                <div className="TxConfirmationModal">
                    <div className="TxConfirmationModal__title">
                        Confirm Transaction
                    </div>

                    <div className="TxConfirmationModal__amount-title">You are sending</div>
                    <div className="TxConfirmationModal__amount">{ numberWithCommas(amount) }</div>
                    <div className="TxConfirmationModal__token-name">{ tokenTypeToTokenName(tokenType) }</div>
                    <div className="TxConfirmationModal__to-title">To recipient</div>
                    <div className="TxConfirmationModal__to">{ to }</div>

                    <div className="TxConfirmationModal__rows">
                        { detailRows }
                    </div>

                    { passwordRow }

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
