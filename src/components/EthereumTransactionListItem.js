import React from "react";
import './EthereumTransactionListItem.css';
import moment from 'moment';
import TransactionStatus from './TransactionStatus'
import ERC20Badge from './ERC20Badge'
import {truncate} from "../utils/Utils";

class EthereumTransactionListItem extends React.Component {
    render() {
        let { transaction } = this.props;
        let {from, to, token_symbol, dec_value, type, time_stamp, bound, is_local} = transaction;
        let isReceived = (bound === "inbound");
        let iconUrl = `/img/tokens/${type}_small@2x.png`;
        let explorerUrl = `https://etherscan.io/tx/${transaction.hash}`;

        //Truncate the addresses to help reduce the run ons
        from = truncate(from, 23, '...');
        to = truncate(to, 23, '...');

        return (
            <a className="EthereumTransactionListItem"
               href={explorerUrl}
               target="_blank"
            >
                <div className="EthereumTransactionListItem__top-container">
                    <TransactionStatus bound={bound} isLocal={is_local}/>
                    {type === "erc20" &&
                    <ERC20Badge/>
                    }
                </div>
                <div className="EthereumTransactionListItem__middle-container">
                    <div className="EthereumTransactionListItem__address-container">
                        <div className="EthereumTransactionListItem__address-prefix" >{isReceived ? "FROM:" : "TO:"}</div>
                        <div className="EthereumTransactionListItem__address">{isReceived ? from : to}</div>
                    </div>
                    <div className="EthereumTransactionListItem__amount-container">
                        <div className="EthereumTransactionListItem__amount">{dec_value}</div>
                    </div>
                </div>
                <div className="EthereumTransactionListItem__bottom-container">
                    <div className="EthereumTransactionListItem__date">{moment.unix(time_stamp).fromNow()}</div>
                    <div className="EthereumTransactionListItem__token-container">
                        <div className="EthereumTransactionListItem__token-symbol">{token_symbol}</div>
                        {iconUrl &&
                        <img src={iconUrl}
                             className="EthereumTransactionListItem__token-icon"/>
                        }
                    </div>
                </div>
            </a>
        );
    }
}

export default EthereumTransactionListItem;