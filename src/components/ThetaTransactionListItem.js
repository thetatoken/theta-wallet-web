import React from "react";
import './ThetaTransactionListItem.css';
import moment from 'moment';
import TransactionStatus from './TransactionStatus'
import ERC20Badge from './ERC20Badge'
import {truncate} from "../utils/Utils";

class ThetaTransactionListItem extends React.Component {
    render() {
        let { transaction } = this.props;
        let {from, to, token_symbol, token_decimal, dec_value, type, time_stamp, bound, hash, is_local} = transaction;
        let isReceived = (bound === "inbound");
        let iconUrl = `/img/tokens/${type}_small@2x.png`;
        let explorerUrl = `https://etherscan.io/tx/${transaction.hash}`;

        //Truncate the addresses to help reduce the run ons
        from = truncate(from, 23, '...');
        to = truncate(to, 23, '...');

        return (
            <a className="ThetaTransactionListItem"
               href={explorerUrl}
               target="_blank"
            >
                <div className="ThetaTransactionListItem__left-container">
                    <div className="ThetaTransactionListItem__top-container">
                        <TransactionStatus bound={bound} isLocal={is_local}/>
                    </div>
                    <div className="ThetaTransactionListItem__middle-container">
                        <div className="ThetaTransactionListItem__address-container">
                            <div className="ThetaTransactionListItem__address-prefix" >{isReceived ? "FROM:" : "TO:"}</div>
                            <div className="ThetaTransactionListItem__address">{isReceived ? from : to}</div>
                        </div>
                    </div>
                    <div className="ThetaTransactionListItem__bottom-container">
                        <div className="ThetaTransactionListItem__date">{moment.unix(time_stamp).fromNow()}</div>
                    </div>
                </div>

                <div className="ThetaTransactionListItem__right-container">
                    <div className="ThetaTransactionListItem__amount">{dec_value}</div>
                    <div className="ThetaTransactionListItem__amount">{dec_value}</div>
                </div>
            </a>
        );
    }
}

export default ThetaTransactionListItem;