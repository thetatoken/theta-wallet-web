import React from "react";
import './TransactionList.css';
import ThetaTransactionListItem from './ThetaTransactionListItem'

class TransactionList extends React.Component {
    createList(){
        return this.props.transactions.map(function(transaction, index){
            return <ThetaTransactionListItem key={ transaction.hash }
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
