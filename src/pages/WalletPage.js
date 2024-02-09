import _ from 'lodash';
import React from "react";
import './WalletPage.css';
import {connect} from 'react-redux'
import WalletTokenList from '../components/WalletTokenList'
import PageHeader from '../components/PageHeader'
import TransactionList from '../components/TransactionList'
import {fetchWalletBalances} from "../state/actions/Wallet";
import {fetchThetaTransactions} from "../state/actions/Transactions";
import {
    getERC20Transactions,
    getEthereumTransactions,
    getThetaNetworkTransactions,
    transformThetaNetworkTransaction
} from "../state/selectors/Transactions";
import EmptyState from "../components/EmptyState";
import TokenTypes from "../constants/TokenTypes";
import MDSpinner from "react-md-spinner";
import GhostButton from "../components/buttons/GhostButton";
import {showModal} from "../state/actions/ui";
import ModalTypes from "../constants/ModalTypes";
import {DefaultAssets, getAllAssets, tokenToAsset} from "../constants/assets";
import Theta from "../services/Theta";
import config from "../Config";

export class WalletPage extends React.Component {
    constructor(){
        super();

        this.pollWalletBalancesIntervalId = null;

        // this.fetchBalances = this.fetchBalances.bind(this);
        this.handleSendClick = this.handleSendClick.bind(this);
        this.handleReceiveClick = this.handleReceiveClick.bind(this);
    }

    fetchTransactions(tokenType){
        // if(tokenType === TokenTypes.THETA || tokenType === TokenTypes.THETA_FUEL){
            this.props.dispatch(fetchThetaTransactions());
        // }
    }

    fetchBalances(){
        // this.props.dispatch(fetchWalletBalances());
    }

    startPollingWalletBalances(){
        //Fetch it immediately
        // this.fetchBalances();

        // this.pollWalletBalancesIntervalId = setInterval(this.fetchBalances, 15000);
    }

    stopPollingWalletBalances(){
        // if(this.pollWalletBalancesIntervalId){
        //     clearInterval(this.pollWalletBalancesIntervalId);
        // }
    }

    handleSendClick(){
        this.props.dispatch(showModal({
            type: ModalTypes.CREATE_TRANSACTION,
            props: {
                transactionType: 'send'
            }
        }));
    }

    handleReceiveClick(){
        this.props.dispatch(showModal({
            type: ModalTypes.RECEIVE,
        }));
    }

    componentDidMount(){
        let tokenType = this.props.match.params.tokenType;

        // this.startPollingWalletBalances();
        this.fetchTransactions(tokenType);
    }

    componentWillUnmount(){
        // this.stopPollingWalletBalances();
    }

    componentWillReceiveProps(nextProps){
        let nextTokenType = nextProps.match.params.tokenType;

        if(this.props.match.params.tokenType !== nextTokenType){
            this.fetchTransactions(nextTokenType);
        }
    }

    render() {
        const { selectedAccount, assets, tokens, isFetchingBalances, balancesRefreshedAt, transactions, isLoadingTransactions, chainId } = this.props;

        return (
            <div className="WalletPage">
                <div className="WalletPage__master-view"
                style={config.isEmbedMode ? {width: '100%'} : null}>
                    {
                        isFetchingBalances && _.isEmpty(selectedAccount) &&
                        <MDSpinner singleColor="#ffffff"
                                   className="WalletPage__master-view-spinner"
                                   size={20}/>
                    }

                    <WalletTokenList selectedAccount={selectedAccount}
                                     tokens={tokens}
                                     assets={assets}
                                     balancesRefreshedAt={balancesRefreshedAt}
                                     chainId={chainId}
                                     style={config.isEmbedMode ? {marginRight: 0} : null}
                    />
                </div>
                {
                    !config.isEmbedMode &&
                    <div className="WalletPage__detail-view">
                        <PageHeader title="Token Transactions"
                                    sticky={true}>
                            <div className="WalletPage__header-buttons">
                                <GhostButton title="Send"
                                             iconUrl="/img/icons/send@2x.png"
                                             onClick={this.handleSendClick}/>
                                <GhostButton title="Receive"
                                             iconUrl="/img/icons/receive@2x.png"
                                             style={{marginLeft: 12}}
                                             onClick={this.handleReceiveClick}/>
                            </div>
                        </PageHeader>

                        {
                            isLoadingTransactions &&
                            <MDSpinner singleColor="#ffffff" className="WalletPage__detail-view-spinner"/>
                        }

                        <a href={Theta.getAccountExplorerUrl(selectedAccount.address)}
                           target={"_blank"}
                           style={{marginTop: 12, marginBottom: 12}}
                        >View all transactions on explorer</a>
                        {
                            transactions.length > 0 &&
                            <TransactionList transactions={transactions}/>
                        }

                        {
                            (transactions.length === 0 && isLoadingTransactions === false) &&
                            <EmptyState icon="/img/icons/empty-transactions@2x.png"
                                        title="No Transactions"
                            />
                        }
                    </div>
                }
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
    const transactions = _.get(thetaWallet, ['transactions', selectedAddress], []);

    return {
        chainId: chainId,

        selectedAddress: selectedAddress,
        selectedIdentity: identities[selectedAddress],
        selectedAccount: accounts[selectedAddress],

        tokens: tokens,
        assets: getAllAssets(chainId, tokens),

        transactions: _.map(transactions, (tx) => {
            return transformThetaNetworkTransaction(selectedAddress, tx);
        }),
    }
};

export default connect(mapStateToProps)(WalletPage);
