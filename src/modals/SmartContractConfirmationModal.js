import React from 'react'
import './TxConfirmationModal.css';
import './SmartContractConfirmationModal.css';
import connect from "react-redux/es/connect/connect";
import Modal from '../components/Modal'
import GradientButton from "../components/buttons/GradientButton";
import Wallet from '../services/Wallet'
import {createSmartContractTransaction} from "../state/actions/Transactions";
import {tokenTypeToTokenName} from "../constants/TokenTypes";
import {numberWithCommas} from "../utils/Utils";
import ThetaJS from '../libs/thetajs.esm';
import ContractModes from "../constants/ContractModes";

export class SmartContractConfirmationModal extends React.Component {
    constructor() {
        super();

        this.state = {
            password: ''
        };

        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(event) {
        let name = event.target.name;
        let value = event.target.value;

        this.setState({[name]: value});
    }

    handleConfirmClick = () => {
        this.props.dispatch(createSmartContractTransaction(this.props.network, this.props.contractMode, this.props.contractAbi, this.props.transaction, this.state.password));
    };

    render() {
        let {transaction, contractMode, contractAbi} = this.props;
        let {to, from, data, gasLimit, transactionFee, value} = transaction;
        let isValid = Wallet.getWalletHardware() || this.state.password.length > 0;
        let isLoading = this.props.isCreatingTransaction;
        let renderDataRow = (title, value) => {
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
        let detailRows = (
            <React.Fragment>
                {renderDataRow("From", this.props.walletAddress)}
                {to && renderDataRow("To", to)}
                {renderDataRow("Data", (
                    <div style={{
                        maxWidth: 315,
                        overflowY: 'auto',
                        height: "100",
                        maxHeight: 100,
                        overflowWrap: "break-word"
                    }}>
                        {data}
                    </div>
                ))}
                {renderDataRow("Transaction Fee", transactionFee + " TFUEL")}
                {renderDataRow("Gas Limit", gasLimit)}
            </React.Fragment>
        );
        let title = null;
        let actionButtonTitle = null;

        if (contractMode === ContractModes.DEPLOY) {
            title = "You are deploying a smart contract";
            actionButtonTitle = "Confirm & Deploy";
        } else if (contractMode === ContractModes.EXECUTE) {
            title = "You are executing a smart contract";
            actionButtonTitle = "Confirm & Execute";
        } else if (contractMode === ContractModes.CALL) {
            title = "You are calling a smart contract";
            actionButtonTitle = "Confirm & Call";
        }

        let passwordRow = null;

        if (!Wallet.getWalletHardware()) {
            passwordRow = (
                <div className="TxConfirmationModal__password-container">
                    <div className="TxConfirmationModal__password-title">Enter your wallet password to sign this
                        transaction
                    </div>
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
                    <div className="TxConfirmationModal__amount-title">
                        {title}
                    </div>

                    <div className="TxConfirmationModal__rows">
                        {detailRows}
                    </div>

                    {passwordRow}

                    <GradientButton title={actionButtonTitle}
                                    disabled={isLoading || isValid === false}
                                    onClick={this.handleConfirmClick}
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

export default connect(mapStateToProps)(SmartContractConfirmationModal);
