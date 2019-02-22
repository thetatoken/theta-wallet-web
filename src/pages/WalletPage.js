import React from "react";
import './WalletPage.css';
import {connect} from 'react-redux'
import WalletTokenList from '../components/WalletTokenList'
import PageHeader from '../components/PageHeader'
import TransactionList from '../components/TransactionList'
import {fetchWalletBalances} from "../state/actions/Wallet";
import {fetchERC20Transactions, fetchETHTransactions} from "../state/actions/Transactions";
import {getERC20Transactions, getEthereumTransactions} from "../state/selectors/Transactions";

export class WalletPage extends React.Component {
    fetchTransactions(tokenType){
        if(tokenType === "erc20"){
            this.props.dispatch(fetchERC20Transactions());
        }
        else if(tokenType === "ethereum"){
            this.props.dispatch(fetchETHTransactions());
        }
    }

    componentDidMount(){
        let tokenType = this.props.match.params.tokenType;

        this.props.dispatch(fetchWalletBalances());

        this.fetchTransactions(tokenType);
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
                    <WalletTokenList />
                </div>
                <div className="WalletPage__detail-view">
                    <PageHeader title="Transactions"/>
                    <TransactionList transactions={this.props.transactions}/>
                </div>
            </div>
        );
    }
}

const mapStateToProps = (state, ownProps) => {
    let tokenType = ownProps.match.params.tokenType;
    let localTransactionsByID = (state.transactions.localTransactionsByID || {});
    let transactions = [];

    if(tokenType === "erc20"){
        transactions = getERC20Transactions(state);
    }
    else if(tokenType === "ethereum"){
        transactions = getEthereumTransactions(state);
    }

    return {
        balancesByType: state.wallet.balancesByType,
        localTransactionsAmount: Object.keys(localTransactionsByID).length,

        transactions: transactions,

        isLoading: false
    };
};

export default connect(mapStateToProps)(WalletPage);
