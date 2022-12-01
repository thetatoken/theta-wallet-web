import './CrossChainTransferPage.css';
import * as thetajs from "@thetalabs/theta-js";
import _ from 'lodash';
import React from "react";
import './SettingsPage.css';
import PageHeader from "../components/PageHeader";
import {getAllAssets} from "../constants/assets";
import {connect} from "react-redux";
import CrossChainTransferTxForm from "../components/transactions/CrossChainTransferTxForm";
import {getCrossTransferFee, getSubchains} from "../constants/Metachain";
import GradientButton from "../components/buttons/GradientButton";
import {cfg, setMetachainCfg} from "../services/metachain/configs";
import {formatNativeTokenAmountToLargestUnit} from "../utils/Utils";
import Alerts from "../services/Alerts";
import {getNetworkForChainId} from '@thetalabs/theta-js/src/networks';
import Router from "../services/Router";

const {transferTFuel} = require("../services/metachain/tfuelUtils");
const {transferTNT20} = require("../services/metachain/transferTNT20");


class CrossChainTransferPage extends React.Component {
    constructor() {
        super();

        this.formRef = React.createRef();
    }

    onSubmit = async (formData) => {
        const {chainId, network, selectedAddress, chains} = this.props;
        let {mainchainChainId} = network;
        let {targetChainId, to, assetId, amount} = formData;

        to = selectedAddress;
        const subchain = _.find(chains, ({subchainIDStr, subchainID}) => {
            return ((subchainIDStr === chainId) || (subchainID === parseInt(targetChainId)))
        });
        setMetachainCfg((mainchainChainId || chainId), subchain);

        if(assetId === 'tfuel'){
            // TFUEL transfer
            if(mainchainChainId){
                // Grab the integer chain ID
                mainchainChainId = getNetworkForChainId(mainchainChainId)?.chainIdNum;
                // Subchain -> mainchain
                await transferTFuel(selectedAddress, parseInt(mainchainChainId), to, thetajs.utils.toWei(amount));
            }
            else{
                // Mainchain -> subchain
                await transferTFuel(selectedAddress, parseInt(targetChainId), to, thetajs.utils.toWei(amount));
            }
        }
        else{
            // TNT20 transfer
            if(mainchainChainId){
                // Grab the integer chain ID
                mainchainChainId = getNetworkForChainId(mainchainChainId)?.chainIdNum;
                // Subchain -> mainchain
                await transferTNT20(selectedAddress, assetId, parseInt(mainchainChainId), selectedAddress, thetajs.utils.toWei(amount));
            }
            else{
                // Mainchain -> subchain
                await transferTNT20(selectedAddress, assetId, parseInt(targetChainId), selectedAddress, thetajs.utils.toWei(amount));
            }
        }

        Router.push('/wallet');
    };

    onNextClick = () => {
        this.formRef.current.dispatchEvent(new Event('submit', {cancelable: true, bubbles: true}));
    };

    render() {
        const {selectedIdentity, selectedAddress, selectedAccount, assets, chainId, collectible, chains, crossTransferFeeInTFuel} = this.props;

        return (
            <div className="CrossChainTransferPage">
                <div className="SettingsPage__detail-view">
                    <PageHeader title="Cross Chain Transfer"
                                sticky={true}
                    />

                    <div style={{marginTop: 12, marginBottom: 12}}>
                        <CrossChainTransferTxForm formRef={this.formRef}
                                                  selectedAccount={selectedAccount}
                                                  assets={assets}
                                                  chains={chains}
                                                  chainId={chainId}
                                                  crossTransferFeeInTFuel={crossTransferFeeInTFuel}
                                                  onSubmit={this.onSubmit}/>
                    </div>

                    <div className="CrossChainTransferPage__fees">
                        <span>Cross Chain Transfer Fee: </span>
                        <span>{`${crossTransferFeeInTFuel} TFUEL + Gas Fees`}</span>
                    </div>

                    <div className={'CreateTransactionModal__footer'}
                         style={{paddingBottom: 20}}
                    >
                        <GradientButton onClick={this.onNextClick}
                                        title={'Transfer'}
                        />
                    </div>
                </div>
            </div>
        );
    }
}

const mapStateToProps = (state, ownProps) => {
    const {thetaWallet} = state;
    const selectedAddress = thetaWallet.selectedAddress;
    const identities = thetaWallet.identities;
    const accounts = thetaWallet.accounts;
    const tokens = thetaWallet.tokens;
    const chainId = thetaWallet.network?.chainId;
    const mainchainChainId = thetaWallet.network?.mainchainChainId;

    return {
        chainId: chainId,
        network: thetaWallet.network,

        selectedAddress: selectedAddress,
        selectedIdentity: identities[selectedAddress],
        selectedAccount: accounts[selectedAddress],

        tokens: tokens,
        assets: _.filter(getAllAssets(chainId, tokens), ({id}) => {
            return (id !== 'theta');
        }),

        chains: getSubchains((mainchainChainId || chainId)),

        crossTransferFeeInTFuel: getCrossTransferFee((mainchainChainId || chainId), chainId)
    }
};

export default connect(mapStateToProps)(CrossChainTransferPage);