import _ from 'lodash';
import React from "react";
import './WalletPage.css';
import {connect} from 'react-redux'
import WalletTokenList from '../components/WalletTokenList'
import PageHeader from '../components/PageHeader'
import TransactionList from '../components/TransactionList'
import {fetchWalletBalances} from "../state/actions/Wallet";
import {fetchThetaTransactions} from "../state/actions/Transactions";
import {getERC20Transactions, getEthereumTransactions, getThetaNetworkTransactions} from "../state/selectors/Transactions";
import EmptyState from "../components/EmptyState";
import TokenTypes from "../constants/TokenTypes";
import MDSpinner from "react-md-spinner";
import GhostButton from "../components/buttons/GhostButton";
import {showModal} from "../state/actions/ui";
import ModalTypes from "../constants/ModalTypes";
import {DefaultAssets, getAllAssets, tokenToAsset} from "../constants/assets";
import Theta from "../services/Theta";

export class WalletPage extends React.Component {
    constructor(){
        super();

        this.pollWalletBalancesIntervalId = null;

        // this.fetchBalances = this.fetchBalances.bind(this);
        this.handleSendClick = this.handleSendClick.bind(this);
        this.handleReceiveClick = this.handleReceiveClick.bind(this);
    }

    fetchTransactions(tokenType){
        if(tokenType === TokenTypes.THETA || tokenType === TokenTypes.THETA_FUEL){
            this.props.dispatch(fetchThetaTransactions());
        }
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
        const { selectedAccount, assets, tokens, isFetchingBalances, balancesRefreshedAt, transactions, isLoadingTransactions } = this.props;

        return (
            <div className="WalletPage">
                <div className="WalletPage__master-view">
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
                    />
                </div>
                <div className="WalletPage__detail-view">
                    <PageHeader title="Theta/Tfuel Transactions"
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
        selectedAddress: selectedAddress,
        selectedIdentity: identities[selectedAddress],
        selectedAccount: accounts[selectedAddress],

        tokens: tokens,
        assets: getAllAssets(chainId, tokens),

        transactions: transactions,
    }
};

export default connect(mapStateToProps)(WalletPage);
