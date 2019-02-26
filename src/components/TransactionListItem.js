import React from "react";
import './TransactionListItem.css';
import moment from 'moment';
import TransactionStatus from './TransactionStatus'
import ERC20Badge from './ERC20Badge'
import TokenTypes from "../constants/TokenTypes";

var truncate = function (fullStr, strLen, separator) {
    if(!fullStr){
        return fullStr;
    }

    if (fullStr.length <= strLen) return fullStr;

    separator = separator || '...';

    var sepLen = separator.length,
        charsToShow = strLen - sepLen,
        frontChars = Math.ceil(charsToShow/2),
        backChars = Math.floor(charsToShow/2);

    return fullStr.substr(0, frontChars) +
        separator +
        fullStr.substr(fullStr.length - backChars);
};

class TransactionListItem extends React.Component {
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
                        {iconUrl &&
                        <img src={iconUrl}
                             className="TransactionListItem__token-icon"/>
                        }
                    </div>
                </div>
            </a>
        );
    }
}

export default TransactionListItem;