import React from "react";
import './WalletPage.css';
import {connect} from 'react-redux'
import WalletTokenList from '../components/WalletTokenList'
import PageHeader from '../components/PageHeader'
import TransactionList from '../components/TransactionList'
import {fetchWalletBalances} from "../state/actions/Wallet";
import {fetchERC20Transactions, fetchETHTransactions} from "../state/actions/Transactions";
import {getERC20Transactions, getEthereumTransactions} from "../state/selectors/Transactions";
import EmptyState from "../components/EmptyState";
import TokenTypes from "../constants/TokenTypes";
import MDSpinner from "react-md-spinner";

export class WalletPage extends React.Component {
    constructor(){
        super();

        this.pollWalletBalancesIntervalId = null;

        this.fetchBalances = this.fetchBalances.bind(this);
    }

    fetchTransactions(tokenType){
        if(tokenType === TokenTypes.ERC20_THETA){
            this.props.dispatch(fetchERC20Transactions());
        }
        else if(tokenType === TokenTypes.ETHEREUM){
            this.props.dispatch(fetchETHTransactions());
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
        console.log("THIS.match == ");
        console.log(this.props.match);

        console.log("transactions == ");
        console.log(this.props.transactions);

        return (
            <div className="WalletPage">
                <div className="WalletPage__master-view">
                    <WalletTokenList balancesByType={this.props.balancesByType}/>
                </div>
                <div className="WalletPage__detail-view">
                    <PageHeader title="Transactions"
                                sticky={true}
                    />

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
    let localTransactionsByID = (state.transactions.localTransactionsByID || {});
    let transactions = [];
    let isLoadingTransactions = false;

    if(tokenType === TokenTypes.ERC20_THETA){
        transactions = getERC20Transactions(state);
        isLoadingTransactions = state.transactions.isFetchingERC20Transactions;
    }
    else if(tokenType === TokenTypes.ETHEREUM){
        transactions = getEthereumTransactions(state);
        isLoadingTransactions = state.transactions.isFetchingETHTransactions;
    }

    return {
        balancesByType: state.wallet.balancesByType,
        localTransactionsAmount: Object.keys(localTransactionsByID).length,

        transactions: transactions,

        isLoadingTransactions: isLoadingTransactions
    };
};

export default connect(mapStateToProps)(WalletPage);
