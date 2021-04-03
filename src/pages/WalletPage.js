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
import {showModal} from "../state/actions/Modals";
import ModalTypes from "../constants/ModalTypes";

export class WalletPage extends React.Component {
    constructor(){
        super();

        this.pollWalletBalancesIntervalId = null;

        this.fetchBalances = this.fetchBalances.bind(this);
        this.handleSendClick = this.handleSendClick.bind(this);
        this.handleReceiveClick = this.handleReceiveClick.bind(this);
    }

    fetchTransactions(tokenType){
        if(tokenType === TokenTypes.THETA || tokenType === TokenTypes.THETA_FUEL){
            this.props.dispatch(fetchThetaTransactions());
        }
    }

    fetchBalances(){
        this.props.dispatch(fetchWalletBalances());
    }

    startPollingWalletBalances(){
        //Fetch it immediately
        this.fetchBalances();

        this.pollWalletBalancesIntervalId = setInterval(this.fetchBalances, 15000);
    }

    stopPollingWalletBalances(){
        if(this.pollWalletBalancesIntervalId){
            clearInterval(this.pollWalletBalancesIntervalId);
        }
    }

    handleSendClick(){
        this.props.dispatch(showModal({
            type: ModalTypes.SEND,
            props: {
                tokenType: this.props.match.params.tokenType
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

        this.startPollingWalletBalances();
        this.fetchTransactions(tokenType);
    }

    componentWillUnmount(){
        this.stopPollingWalletBalances();
    }

    componentWillReceiveProps(nextProps){
        let nextTokenType = nextProps.match.params.tokenType;

        if(this.props.match.params.tokenType !== nextTokenType){
            this.fetchTransactions(nextTokenType);
        }
    }

    render() {
        const { isFetchingBalances, balancesByType, balancesRefreshedAt } = this.props;

        return (
            <div className="WalletPage">
                <div className="WalletPage__master-view">
                    {
                        isFetchingBalances && _.isEmpty(balancesByType) &&
                        <MDSpinner singleColor="#ffffff"
                                   className="WalletPage__master-view-spinner"
                                   size={20}/>
                    }

                    <WalletTokenList balancesByType={this.props.balancesByType}
                                     balancesRefreshedAt={balancesRefreshedAt}
                    />
                </div>
                <div className="WalletPage__detail-view">
                    <PageHeader title="Transactions"
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
                        this.props.isLoadingTransactions &&
                        <MDSpinner singleColor="#ffffff" className="WalletPage__detail-view-spinner"/>
                    }

                    {
                        this.props.transactions.length > 0 &&
                        <TransactionList transactions={this.props.transactions}/>
                    }

                    {
                        (this.props.transactions.length === 0 && this.props.isLoadingTransactions === false) &&
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
    let tokenType = ownProps.match.params.tokenType;
    let localTransactionsByHash = (state.transactions.localTransactionsByHash || {});
    let transactions = [];
    let isLoadingTransactions = false;

    if(tokenType === TokenTypes.ERC20_THETA){
        transactions = getERC20Transactions(state);
        isLoadingTransactions = state.transactions.isFetchingERC20Transactions;
    }
    else if(tokenType === TokenTypes.ETHEREUM){
        transactions = getEthereumTransactions(state);
        isLoadingTransactions = state.transactions.isFetchingEthereumTransactions;
    }
    else if(tokenType === TokenTypes.THETA || tokenType === TokenTypes.THETA_FUEL){
        transactions = getThetaNetworkTransactions(state);
        isLoadingTransactions = state.transactions.isFetchingTransactions;
    }

    return {
        balancesByType: Object.assign({}, state.wallet.balancesByType, state.wallet.ethereumBalancesByType),

        localTransactionsAmount: Object.keys(localTransactionsByHash).length,

        transactions: transactions,

        isLoadingTransactions: isLoadingTransactions,
        isFetchingBalances: state.wallet.isFetchingBalances,

        balancesRefreshedAt: state.wallet.balancesRefreshedAt
    };
};

export default connect(mapStateToProps)(WalletPage);
