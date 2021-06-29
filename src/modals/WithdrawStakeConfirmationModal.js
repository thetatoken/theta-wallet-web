import React from 'react'
import './TxConfirmationModal.css';
import './WithdrawStakeConfirmationModal.css';
import connect from "react-redux/es/connect/connect";
import Modal from '../components/Modal'
import GradientButton from "../components/buttons/GradientButton";
import Wallet from '../services/Wallet'
import {createWithdrawStakeTransaction} from "../state/actions/Transactions";
import ThetaJS from "../libs/thetajs.esm";

export class WithdrawStakeConfirmationModal extends React.Component {
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
        this.props.dispatch(createWithdrawStakeTransaction(this.props.network, this.props.transaction, this.state.password));
    };

    render() {
        let { purpose, holder, transactionFee } = this.props.transaction;
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
                { renderDataRow("Withdraw To", this.props.walletAddress) }
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
            holderTitle = "Validator Node (Holder)"
        }
        else if(purpose === ThetaJS.StakePurposes.StakeForGuardian){
            holderTitle = "Guardian Node (Holder)"
        }
        else if(purpose === ThetaJS.StakePurposes.StakeForEliteEdge){
            holderTitle = "Edge Node (Holder)"
        }


        return (
            <Modal>
                <div className="TxConfirmationModal">
                    <div className="TxConfirmationModal__title">
                        Confirm Transaction
                    </div>

                    <div className="TxConfirmationModal__amount-title">You are withdrawing stake from</div>
                    <div className="TxConfirmationModal__holder-title">{holderTitle}</div>
                    <div className="TxConfirmationModal__holder">{ holder }</div>

                    <div className="TxConfirmationModal__rows">
                        { detailRows }
                    </div>

                    { passwordRow }

                    <GradientButton title="Confirm & Withdraw Stake"
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

export default connect(mapStateToProps)(WithdrawStakeConfirmationModal);
