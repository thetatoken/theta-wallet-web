import _ from 'lodash';
import React, { useState, useEffect } from 'react';
import * as thetajs from '@thetalabs/theta-js';
import './TxConfirmationModal.css';
import connect from "react-redux/es/connect/connect";
import Modal from '../components/Modal'
import GradientButton from "../components/buttons/GradientButton";
import Wallet from '../services/Wallet'
import {
    approveTransactionRequest, executeSignMessage,
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
import {ProjectInfoCard} from "../components/ProjectInfoCard";

const renderDataRow = (title, value, suffix = '', isLarge = false) => {
    suffix = suffix ? suffix : '';

    if(value){
        return (
            <div className={`TxDataRow ${isLarge ? 'TxDataRow--large' : ''}`}>
                {
                    title &&
                    <div className="TxDataRow__title">
                        {title}
                    </div>
                }

                <div className="TxDataRow__value"
                     style={{
                         whiteSpace: 'pre',
                         textAlign: 'center',
                         width: '100%'
                }}
                >
                    {typeof value === 'object' && value}
                    {typeof value !== 'object' && (value + suffix || '')}
                </div>
            </div>
        );
    }
    return null;
};

const PersonalSignModal = ({selectedAddress, transactionRequest, assets, network, dispatch, onAccept, onReject, message}) => {
    const [password, setPassword] = useState(
        config.isEmbedMode ? TemporaryState.getWalletData().password : ''
    );

    const handleChange = (event) => {
        const { name, value } = event.target;
        setPassword(value);
    };

    const onConfirmClick = async () => {
        const signedMessage = await store.dispatch(executeSignMessage(message));
        if(onAccept){
            onAccept(signedMessage);
        }
    }

    const onRejectClick = () => {
        if(onReject){
            onReject();
        }
    }

    const renderDataRows = () => {
        return (
            <>
                { renderDataRow(null, message, null, true) }
            </>
        );
    };

    let txDataRows = renderDataRows();

    return (
        <Modal closeable={false}>
            <div className="TxConfirmationModal">
                {
                    window.Web3Bridge.projectMetadata &&
                    <ProjectInfoCard metadata={window.Web3Bridge.projectMetadata}
                                     chainInfo={network}
                    />
                }
                <div className="ModalTitle">
                    Sign Message
                </div>

                <div className={'TxDataRows'}>
                    {
                        txDataRows
                    }
                </div>

                <div className={'TxConfirmationModal__footer'}>
                    <FlatButton title={'Reject'}
                                className={'ConfirmTransactionPage__reject-button'}
                                size={'large'}
                                onClick={onRejectClick}
                                borderless centered/>
                    <GradientButton title={'Confirm'}
                                    className={'ConfirmTransactionPage__confirm-button'}
                                    onClick={onConfirmClick}
                    />
                </div>

            </div>
        </Modal>
    )
}

const mapStateToProps = (state, props) => {
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
        onAccept: props?.onAccept,
        onReject: props?.onReject,
        network: thetaWallet.network,
        message: props.message
    };
};

export default connect(mapStateToProps)(PersonalSignModal);
