import _ from 'lodash';
import React from 'react'
import './TxConfirmationModal.css';
import './DepositStakeConfirmationModal.css';
import connect from "react-redux/es/connect/connect";
import Modal from '../components/Modal'
import GradientButton from "../components/buttons/GradientButton";
import Wallet from '../services/Wallet'
import {createDepositStakeTransaction} from "../state/actions/Transactions";
import {tokenTypeToTokenName} from "../constants/TokenTypes";
import {numberWithCommas} from "../utils/Utils";
import ThetaJS from '../libs/thetajs.esm';

export class DepositStakeConfirmationModal extends React.Component {
    constructor(){
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

    handleConfirmClick = () =>{
        this.props.dispatch(createDepositStakeTransaction(this.props.network, this.props.transaction, this.state.password));
    };

    render() {
        let {transaction, guardianNodeDelegate} = this.props;
        let { tokenType, amount, holder, transactionFee, purpose } = transaction;
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
        let detailRows = (
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

        let holderTitle = null;
        if(purpose === ThetaJS.StakePurposes.StakeForValidator){
            holderTitle = "Validator Node Holder (Address)"
        }
        else if(purpose === ThetaJS.StakePurposes.StakeForGuardian){
            if(guardianNodeDelegate){
                holderTitle = "Delegated Guardian Node";
            }
            else{
                holderTitle = "Guardian Node Holder (Summary)";
            }
        }
        else if(purpose === ThetaJS.StakePurposes.StakeForEliteEdge){
            holderTitle = "Edge Node Holder (Summary)"
        }

        return (
            <Modal>
                <div className="TxConfirmationModal">
                    <div className="TxConfirmationModal__title">
                        Confirm Transaction
                    </div>

                    <div className="TxConfirmationModal__amount-title">You are depositing</div>
                    <div className="TxConfirmationModal__amount">{ numberWithCommas(amount) }</div>
                    <div className="TxConfirmationModal__token-name">{ tokenTypeToTokenName(tokenType) }</div>
                    <div className="TxConfirmationModal__holder-title">{holderTitle}</div>
                    {
                        guardianNodeDelegate &&
                        <div className="TxConfirmationModal__holder">{ `${guardianNodeDelegate.name}` }</div>
                    }
                    {
                        guardianNodeDelegate &&
                        <div className="TxConfirmationModal__holder">{ guardianNodeDelegate.address }</div>
                    }
                    {
                        _.isNil(guardianNodeDelegate) &&
                        <div className="TxConfirmationModal__holder">{ holder }</div>
                    }

                    <div className="TxConfirmationModal__rows">
                        { detailRows }
                    </div>

                    { passwordRow }

                    <GradientButton title="Confirm & Deposit Stake"
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

export default connect(mapStateToProps)(DepositStakeConfirmationModal);
