import _ from 'lodash';
import React from 'react';
import * as thetajs from '@thetalabs/theta-js';
import './TxConfirmationModal.css';
import './SendConfirmationModal.css';
import connect from "react-redux/es/connect/connect";
import Modal from '../components/Modal'
import GradientButton from "../components/buttons/GradientButton";
import Wallet from '../services/Wallet'
import {
    approveTransactionRequest,
    createSendTransaction,
    createTransactionRequest,
    rejectTransactionRequest
} from "../state/actions/Transactions";
import {
    formatNativeTokenAmountToLargestUnit, formatTNT20TokenAmountToLargestUnit,
    transactionRequestToTransactionType,
    transactionTypeToName, truncate
} from "../utils/Utils";
import {DefaultAssets, tokenToAsset} from "../constants/assets";
import {TNT20ABI} from '../constants/contracts';
import FlatButton from "../components/buttons/FlatButton";
import {store} from "../state";


const renderDataRow = (title, value, suffix = '', isLarge = false) => {
    suffix = suffix ? suffix : '';

    if(value){
        return (
            <div className={`TxDataRow ${isLarge ? 'TxDataRow--large' : ''}`}>
                <div className="TxDataRow__title">
                    {title}
                </div>
                <div className="TxDataRow__value">
                    {value + suffix || ''}
                </div>
            </div>
        );
    }
    return null;
};

export class ConfirmTransactionModal extends React.Component {
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

    onConfirmClick = () => {
        // TODO approve the request if the password matches
        // this.props.dispatch(createSendTransaction(this.props.network, this.props.transaction, this.state.password));
        const {transactionRequest} = this.props;
        this.props.dispatch(approveTransactionRequest(transactionRequest.id, this.state.password));
    }

    onRejectClick = () => {
        const {transactionRequest} = this.props;
        this.props.dispatch(rejectTransactionRequest(transactionRequest.id));
    }

    renderDataRows = () => {
        const {selectedAddress, transactionRequest, assets} = this.props;
        const txType = _.get(transactionRequest, 'txType');
        const txData = _.get(transactionRequest, 'txData');
        const stakePurpose = _.get(transactionRequest, 'txData.purpose');

        console.log('transactionRequest == ');
        console.log(transactionRequest);

        if(txType === thetajs.constants.TxType.Send){
            const thetaWei = _.get(transactionRequest, 'txData.outputs[0].thetaWei', null);
            const tfuelWei = _.get(transactionRequest, 'txData.outputs[0].tfuelWei', null);

            return (
                <React.Fragment>
                    { renderDataRow('Transaction Type', transactionTypeToName(txType)) }
                    { renderDataRow('From', truncate(selectedAddress)) }
                    { renderDataRow('To', truncate(_.get(transactionRequest, 'txData.outputs[0].address'))) }
                    { thetaWei && (thetaWei !== '0') && renderDataRow('Amount', formatNativeTokenAmountToLargestUnit(thetaWei), ' THETA') }
                    { tfuelWei && (tfuelWei !== '0') && renderDataRow('Amount', formatNativeTokenAmountToLargestUnit(tfuelWei), ' TFUEL') }
                </React.Fragment>
            );
        }
        if(txType === thetajs.constants.TxType.SmartContract){
            const transactionName = transactionRequestToTransactionType(transactionRequest);
            const contractAddress = _.get(transactionRequest, 'txData.to');
            const value = _.get(transactionRequest, 'txData.value');
            const asset = _.find(assets, function (a) {
                return a.contractAddress === contractAddress;
            });
            let transferToAddress = null;
            let transferToValue = null;
            let symbol = null;
            let decimals = null;

            try {
                const contractData = _.get(txData, 'data');
                const tnt20Contract = new thetajs.Contract(null, TNT20ABI, null);
                const data = tnt20Contract.interface.decodeFunctionData('transfer(address,uint256)',contractData);
                transferToAddress = data[0];
                transferToValue = data[1].toString();
                symbol = asset && asset.symbol;
                decimals = asset && asset.decimals;
            }
            catch (e) {

            }

            return (
                <React.Fragment>
                    { renderDataRow('Transaction Type', transactionName) }
                    { contractAddress && renderDataRow('Contract', truncate(_.get(transactionRequest, 'txData.to'))) }
                    { renderDataRow('From', truncate(selectedAddress)) }
                    { transferToAddress && renderDataRow('To', truncate(transferToAddress)) }
                    { (symbol && transferToValue) && renderDataRow('Token Amount', formatTNT20TokenAmountToLargestUnit(transferToValue, decimals), ` ${symbol}`) }
                    { value && renderDataRow('Value', formatNativeTokenAmountToLargestUnit(value), ' TFUEL') }
                    { renderDataRow('Data', _.get(transactionRequest, 'txData.data'), null, true) }

                </React.Fragment>
            );
        }
        if(txType === thetajs.constants.TxType.WithdrawStake){
            return (
                <React.Fragment>
                    { renderDataRow('Transaction Type', transactionTypeToName(txType)) }
                    { renderDataRow('From', truncate(selectedAddress)) }
                    { renderDataRow('Holder', truncate(_.get(transactionRequest, 'txData.holder'))) }
                </React.Fragment>
            );
        }
        if(txType === thetajs.constants.TxType.DepositStake){
            return (
                <React.Fragment>
                    { renderDataRow('Transaction Type', transactionTypeToName(txType)) }
                    { renderDataRow('Purpose', 'Validator Node') }
                    { renderDataRow('From', truncate(selectedAddress)) }
                    { renderDataRow('Holder', truncate(_.get(transactionRequest, 'txData.holder'))) }
                    { renderDataRow('Amount', formatNativeTokenAmountToLargestUnit(_.get(transactionRequest, 'txData.amount')), ' THETA') }
                </React.Fragment>
            );
        }
        if(txType === thetajs.constants.TxType.DepositStakeV2){
            return (
                <React.Fragment>
                    { renderDataRow('Transaction Type', transactionTypeToName(txType)) }
                    {
                        (stakePurpose === thetajs.constants.StakePurpose.StakeForEliteEdge) &&
                        renderDataRow('Purpose', 'Edge Node')
                    }
                    {
                        (stakePurpose === thetajs.constants.StakePurpose.StakeForGuardian) &&
                        renderDataRow('Purpose', 'Guardian Node')
                    }
                    { renderDataRow('From', truncate(selectedAddress)) }
                    { renderDataRow('Holder summary', _.get(transactionRequest, 'txData.holderSummary'), null, true) }
                    {
                        (stakePurpose === thetajs.constants.StakePurpose.StakeForEliteEdge) &&
                        renderDataRow('Amount', formatNativeTokenAmountToLargestUnit(_.get(transactionRequest, 'txData.amount')), ' TFUEL')
                    }
                    {
                        (stakePurpose === thetajs.constants.StakePurpose.StakeForGuardian) &&
                        renderDataRow('Amount', formatNativeTokenAmountToLargestUnit(_.get(transactionRequest, 'txData.amount')), ' THETA')
                    }
                </React.Fragment>
            );
        }
    };

    render() {
        let isValid = Wallet.getWalletHardware() || this.state.password.length > 0;
        let isLoading = this.props.isCreatingTransaction;
        let txDataRows = this.renderDataRows();
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
                    <div className="ModalTitle">
                        Confirm Transaction
                    </div>

                    <div className={'TxDataRows'}>
                        {
                            txDataRows
                        }
                    </div>

                    { passwordRow }

                    <div className={'TxConfirmationModal__footer'}>
                        <FlatButton title={'Reject'}
                                    className={'ConfirmTransactionPage__reject-button'}
                                    size={'large'}
                                    disabled={isLoading}
                                    onClick={this.onRejectClick}
                                    borderless centered/>
                        <GradientButton title={'Confirm'}
                                        className={'ConfirmTransactionPage__confirm-button'}
                                        disabled={isLoading || isValid === false}
                                        onClick={this.onConfirmClick}
                        />
                    </div>

                </div>
            </Modal>
        )
    }
}

const mapStateToProps = state => {
    const { thetaWallet } = state;
    const selectedAddress = thetaWallet.selectedAddress;
    const identities = thetaWallet.identities;
    const accounts = thetaWallet.accounts;
    const transactionRequest = state.thetaWallet.transactionRequests[0];
    const tokens = thetaWallet.tokens;
    const chainId = thetaWallet.network.chainId;

    return {
        selectedAddress: selectedAddress,
        selectedIdentity: identities[selectedAddress],
        selectedAccount: accounts[selectedAddress],
        assets: _.concat(DefaultAssets(chainId), tokens.map(tokenToAsset)),
        transactionRequest: transactionRequest,

        isCreatingTransaction: state.transactions.isCreatingTransaction,
    };
};

export default connect(mapStateToProps)(ConfirmTransactionModal);
