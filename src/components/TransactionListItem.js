import React from "react";
import './TransactionListItem.css';
import moment from 'moment';
import TransactionStatus from './TransactionStatus'
import ERC20Badge from './ERC20Badge'

class TransactionListItem extends React.Component {
    render() {
        let { transaction } = this.props;
        let {from, to, token_symbol, token_decimal, dec_value, type, time_stamp, bound, hash, is_local} = transaction;
        let isReceived = (bound === "inbound");
        let icon = null;
        let explorerUrl = `https://etherscan.io/tx/${transaction.hash}`;

        return (
            <a className="TransactionListItem"
               href={explorerUrl}
               target="_blank"
            >
                <div className="TransactionListItem__top-container">
                    <TransactionStatus bound={bound} isLocal={is_local}/>
                    {type === "erc20" &&
                    <ERC20Badge/>
                    }
                </div>
                <div className="TransactionListItem__middle-container">
                    <div className="TransactionListItem__address-container">
                        <div className="TransactionListItem__address-prefix" >{isReceived ? "FROM:" : "TO:"}</div>
                        <div className="TransactionListItem__address">{isReceived ? from : to}</div>
                    </div>
                    <div className="TransactionListItem__amount-container">
                        <div className="TransactionListItem__amount">{dec_value}</div>
                    </div>
                </div>
                <div className="TransactionListItem__bottom-container">
                    <div className="TransactionListItem__date">{moment.unix(time_stamp).fromNow()}</div>
                    <div className="TransactionListItem__token-container">
                        <div className="TransactionListItem__token-symbol">{token_symbol}</div>
                        {icon &&
                        <img src={icon}
                             className="TransactionListItem__token-icon"/>
                        }
                    </div>
                </div>
            </a>
        );
    }
}

export default TransactionListItem;