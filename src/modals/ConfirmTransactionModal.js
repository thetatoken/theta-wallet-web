import _ from 'lodash';
import React, { useState, useEffect } from 'react';
import * as thetajs from '@thetalabs/theta-js';
import './TxConfirmationModal.css';
import connect from "react-redux/es/connect/connect";
import Modal from '../components/Modal'
import GradientButton from "../components/buttons/GradientButton";
import Wallet from '../services/Wallet'
import {
    approveTransactionRequest,
    rejectTransactionRequest
} from "../state/actions/Transactions";
import {
    formatNativeTokenAmountToLargestUnit, formatTNT20TokenAmountToLargestUnit,
    transactionRequestToTransactionType,
    transactionTypeToName, truncate
} from "../utils/Utils";
import {DefaultAssets, getAllAssets, tokenToAsset} from "../constants/assets";
import {TNT20ABI} from '../constants/contracts';
import FlatButton from "../components/buttons/FlatButton";
import {store} from "../state";
import MDSpinner from "react-md-spinner";
import BigNumber from "bignumber.js";
import config from "../Config";
import TemporaryState from "../services/TemporaryState";
import tns from "../libs/tns"
import { useSettings } from "../components/SettingContext";

const renderDataRow = (title, value, suffix = '', isLarge = false) => {
    suffix = suffix ? suffix : '';

    if(value){
        return (
            <div className={`TxDataRow ${isLarge ? 'TxDataRow--large' : ''}`}>
                <div className="TxDataRow__title">
                    {title}
                </div>
                <div className="TxDataRow__value">
                    {typeof value === 'object' && value}
                    {typeof value !== 'object' && (value + suffix || '')}
                </div>
            </div>
        );
    }
    return null;
};

const ConfirmTransactionModal = ({selectedAddress, transactionRequest, assets, dispatch}) => {
    const { tnsEnable } = useSettings();
  
    const [password, setPassword] = useState(
        config.isEmbedMode ? TemporaryState.getWalletData().password : ''
    );
    const [estimatedGasFee, setEstimatedGasFee] = useState(null);
    const [fromTns, setFromTns] = useState(false);
    const [toTns, setToTns] = useState(false);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setPassword(value);
    };
    

    const setTnsState = async () => {
        if (!transactionRequest || !selectedAddress) return;
        if (!fromTns) {
          const fromTnsResult = await tns.getDomainName(selectedAddress);
          setFromTns(fromTnsResult);
        }
        if (!toTns) {
          let toPath = 'txData.holder';
          if (!transactionRequest.txData.holder) {
            toPath = 'txData.outputs[0].address';
          }
          const toTnsResult = await tns.getDomainName(
            _.get(transactionRequest, toPath)
          );
          setToTns(toTnsResult);
        }
    };
    
    const onConfirmClick = () => {
        // TODO approve the request if the password matches
        // this.props.dispatch(createSendTransaction(this.props.network, this.props.transaction, this.state.password));
        dispatch(approveTransactionRequest(transactionRequest.id, password));
    }

    const onRejectClick = () => {
        dispatch(rejectTransactionRequest(transactionRequest.id));
    }

    const renderDataRows = () => {
        // const {selectedAddress, transactionRequest, assets} = this.props;
        const txType = _.get(transactionRequest, 'txType');
        const txData = _.get(transactionRequest, 'txData');
        const stakePurpose = _.get(transactionRequest, 'txData.purpose');
    

        if(txType === thetajs.constants.TxType.Send){
            const thetaWei = _.get(transactionRequest, 'txData.outputs[0].thetaWei', null);
            const tfuelWei = _.get(transactionRequest, 'txData.outputs[0].tfuelWei', null);
            const fromAddress = truncate(selectedAddress);
            const toAddress = truncate(_.get(transactionRequest, 'txData.outputs[0].address'));

            return (
                <>
                    { renderDataRow('Transaction Type', transactionTypeToName(txType)) }
                    {renderDataRow('From', fromTns ? <p>{fromTns}<br />{fromAddress}</p> : fromAddress)}
                    {renderDataRow('To', toTns ? <p>{toTns}<br />{toAddress}</p> : toAddress)}
                    { thetaWei && (thetaWei !== '0') && renderDataRow('Amount', formatNativeTokenAmountToLargestUnit(thetaWei), ' THETA') }
                    { tfuelWei && (tfuelWei !== '0') && renderDataRow('Amount', formatNativeTokenAmountToLargestUnit(tfuelWei), ' TFUEL') }
                </>
            );
        }
        if(txType === thetajs.constants.TxType.SmartContract){
            const transactionName = transactionRequestToTransactionType(transactionRequest);
            const contractAddress = _.get(transactionRequest, 'txData.to', null);
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
                <>
                    { renderDataRow('Transaction Type', transactionName) }
                    { !_.isNil(contractAddress) && renderDataRow('Contract', truncate(_.get(transactionRequest, 'txData.to'))) }
                    { renderDataRow('From', truncate(selectedAddress)) }
                    { !_.isNil(transferToAddress) && renderDataRow('To', truncate(transferToAddress)) }
                    { (!_.isNil(transferToAddress) && symbol && transferToValue) && renderDataRow('Token Amount', formatTNT20TokenAmountToLargestUnit(transferToValue, decimals), ` ${symbol}`) }
                    { (!_.isNil(value) && value > 0) && renderDataRow('Value', formatNativeTokenAmountToLargestUnit(value), ' TFUEL') }
                    { renderDataRow('Data', _.get(transactionRequest, 'txData.data'), null, true) }
                </>
            );
        }
        if(txType === thetajs.constants.TxType.WithdrawStake) {
            const fromAddress = truncate(selectedAddress);
            const holderAddress = truncate(_.get(transactionRequest, 'txData.holder'));
            return (
                <>
                    { renderDataRow('Transaction Type', transactionTypeToName(txType)) }
                    { renderDataRow('From', fromTns ? <p>{fromTns}<br/>{fromAddress}</p> : fromAddress) }
                    { renderDataRow('Holder', toTns ? <p>{toTns}<br/>{holderAddress}</p> : holderAddress) }
                </>
            );
        }
        if(txType === thetajs.constants.TxType.DepositStake){
            const fromAddress = truncate(selectedAddress);
            const holderAddress = truncate(_.get(transactionRequest, 'txData.holder'));

            return (
                <>
                    { renderDataRow('Transaction Type', transactionTypeToName(txType)) }
                    { renderDataRow('Purpose', 'Validator Node') }
                    { renderDataRow('From', fromTns ? <p>{fromTns}<br/>{fromAddress}</p> : fromAddress) }
                    { renderDataRow('Holder', toTns ? <p>{toTns}<br/>{holderAddress}</p> : holderAddress) }
                    { renderDataRow('Amount', formatNativeTokenAmountToLargestUnit(_.get(transactionRequest, 'txData.amount')), ' THETA') }
                </>
            );
        }
        if(txType === thetajs.constants.TxType.DepositStakeV2){
            const fromAddress = truncate(selectedAddress);

            return (
                <>
                    { renderDataRow('Transaction Type', transactionTypeToName(txType)) }
                    {
                        (stakePurpose === thetajs.constants.StakePurpose.StakeForEliteEdge) &&
                        renderDataRow('Purpose', 'Edge Node')
                    }
                    {
                        (stakePurpose === thetajs.constants.StakePurpose.StakeForGuardian) &&
                        renderDataRow('Purpose', 'Guardian Node')
                    }
                    { renderDataRow('From', fromTns ? <p>{fromTns}<br/>{fromAddress}</p> : fromAddress) }
                    { renderDataRow('Holder summary', _.get(transactionRequest, 'txData.holderSummary'), null, true) }
                    {
                        (stakePurpose === thetajs.constants.StakePurpose.StakeForEliteEdge) &&
                        renderDataRow('Amount', formatNativeTokenAmountToLargestUnit(_.get(transactionRequest, 'txData.amount')), ' TFUEL')
                    }
                    {
                        (stakePurpose === thetajs.constants.StakePurpose.StakeForGuardian) &&
                        renderDataRow('Amount', formatNativeTokenAmountToLargestUnit(_.get(transactionRequest, 'txData.amount')), ' THETA')
                    }
                </>
            );
        }
    };

    const calculateTotalGasPrice = () => {
        if(transactionRequest?.gasFeeData?.totalGasFee){
            const dependencyGasFee = new BigNumber(_.get(transactionRequest, ['dependencies', 0, 'gasFeeData', 'totalGasFee'], '0'));

            return (new BigNumber(transactionRequest.gasFeeData.totalGasFee || '0')).plus(dependencyGasFee);
        }
    }


    useEffect(() => {
        if (tnsEnable) {
            setTnsState();
        }
      }, [transactionRequest, selectedAddress, tnsEnable]);
    

    let isValid = Wallet.getWalletHardware() || password.length > 0;
    let txDataRows = renderDataRows();
    let passwordRow = null;


    if (!Wallet.getWalletHardware() && !config.isEmbedMode) {
        passwordRow = (
          <div className="TxConfirmationModal__password-container">
            <div className="TxConfirmationModal__password-title">
              Enter your wallet password to sign this transaction
            </div>
            <input
              className="ChoosePasswordCard__password-input"
              placeholder="Enter wallet password"
              name="password"
              type="password"
              value={password}
              onChange={handleChange}
            />
          </div>
        );
      }

    return (
        <Modal closeable={false}>
            <div className="TxConfirmationModal">
                <div className="ModalTitle">
                    Confirm Transaction
                </div>

                <div className={'TxDataRows'}>
                    {
                        txDataRows
                    }
                    <div className={`TxDataRow`}>
                        <div className="TxDataRow__title">
                            Estimated Gas Fee
                        </div>
                        {
                            _.isNil(transactionRequest?.gasFeeData) &&
                            <div className="TxDataRow__value">
                                <MDSpinner singleColor={'#1BDED0'} size={20}/>
                            </div>
                        }
                        {
                            !_.isNil(transactionRequest?.gasFeeData) &&
                            <div className="TxDataRow__value">
                                <span>{`${formatNativeTokenAmountToLargestUnit(calculateTotalGasPrice())} TFUEL`}</span>
                            </div>
                        }
                    </div>
                </div>

                { passwordRow }

                <div className={'TxConfirmationModal__footer'}>
                    <FlatButton title={'Reject'}
                                className={'ConfirmTransactionPage__reject-button'}
                                size={'large'}
                                onClick={onRejectClick}
                                borderless centered/>
                    <GradientButton title={'Confirm'}
                                    className={'ConfirmTransactionPage__confirm-button'}
                                    disabled={isValid === false}
                                    onClick={onConfirmClick}
                    />
                </div>

            </div>
        </Modal>
    )
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
        assets: getAllAssets(chainId, tokens),
        transactionRequest: transactionRequest,
    };
};

export default connect(mapStateToProps)(ConfirmTransactionModal);
