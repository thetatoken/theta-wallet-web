import React from "react";
import './TransactionList.css';
import EthereumTransactionListItem from './EthereumTransactionListItem'

class TransactionList extends React.Component {
    createList(){
        return this.props.transactions.map(function(transaction, index){
            return <EthereumTransactionListItem key={ transaction.hash }
                                                transaction={transaction}
            />;
        })
    };

    render() {
        return (
            <div className="TransactionList">
                {this.createList()}
            </div>
        );
    }
}

export default TransactionList;
