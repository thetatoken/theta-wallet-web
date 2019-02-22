import React from "react";
import './WalletPage.css';
import {connect} from 'react-redux'
import WalletTokenList from '../components/WalletTokenList'
import PageHeader from '../components/PageHeader'
import TransactionList from '../components/TransactionList'
import {fetchWalletBalances} from "../state/actions/Wallet";
import {fetchERC20Transactions, fetchETHTransactions} from "../state/actions/Transactions";


export class WalletPage extends React.Component {
    componentDidMount(){
        this.props.dispatch(fetchWalletBalances());
    }

    componentWillReceiveProps(nextProps){
        let nextTokenType = nextProps.match.params.tokenType;

        if(this.props.match.params.tokenType !== nextTokenType){
            if(nextTokenType === "erc20"){
                this.props.dispatch(fetchERC20Transactions());
            }
            else if(nextTokenType === "ethereum"){
                this.props.dispatch(fetchETHTransactions());
            }
        }
    }

    render() {
        console.log("THIS.match == ");
        console.log(this.props.match);

        return (
            <div className="WalletPage">
                <div className="WalletPage__master-view">
                    <WalletTokenList />
                </div>
                <div className="WalletPage__detail-view">
                    <PageHeader title="Transactions"/>
                    <TransactionList transactions={this.props.transactions}>

                    </TransactionList>
                </div>
            </div>
        );
    }
}

const mapStateToProps = state => {
    return {
        balancesByType: state.wallet.balancesByType,
        localTransactionsAmount: Object.keys(state.transactions.localTransactionsByID).length,

        transactionsByType: state.transactions.transactionsByType,
        localTransactionsByID: (state.transactions.localTransactionsByID || {}),

        isLoading: (state.transactions.isFetchingERC20Transactions || state.transactions.isFetchingETHTransactions)
    };
};

export default connect(mapStateToProps)(WalletPage);
