import React from "react";
import './TransactionList.css';
import EthereumTransactionListItem from './EthereumTransactionListItem'
import ThetaTransactionListItem from './ThetaTransactionListItem'

class TransactionList extends React.Component {
    createList(){
        return this.props.transactions.map(function(transaction, index){
            if(transaction.timestamp){
                //Ethereum Network
                return <ThetaTransactionListItem key={ transaction.hash }
                                                 transaction={transaction}
                />;
            }
            else{
                //Ethereum Network
                return <EthereumTransactionListItem key={ transaction.hash }
                                                    transaction={transaction}
                />;
            }
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
