import React from "react";
import './TransactionListItem.css';

class TransactionListItem extends React.Component {
    render() {
        return (
            <a className="TransactionListItem">
                {this.props.transaction.hash}
            </a>
        );
    }
}

export default TransactionListItem;
