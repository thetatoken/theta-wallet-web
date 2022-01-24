import React from "react";
import './ThetaTransactionListItem.css';
import moment from 'moment';
import TransactionStatus from './TransactionStatus'
import {formatNativeTokenAmountToLargestUnit, numberWithCommas, truncate} from "../utils/Utils";
import _ from 'lodash';
import Theta from '../services/Theta';

class ThetaTransactionListItem extends React.Component {
    render() {
        let { transaction } = this.props;
        let {inputs, outputs, timestamp, bound, hash, is_local} = transaction;
        let input = (inputs ? inputs[0] : null);
        let output = (outputs ? outputs[0] : null);
        let from = _.get(input, ['address']);
        let to = _.get(output, ['address']);
        let isReceived = (bound === "inbound");
        let explorerUrl = Theta.getTransactionExplorerUrl(transaction);

        //Truncate the addresses to help reduce the run ons
        from = truncate(from);
        to = truncate(to);

        let thetaAmount = _.get(output, ['coins', 'thetawei']);
        let tfuelAmount = _.get(output, ['coins', 'tfuelwei']);

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
                        <div className="ThetaTransactionListItem__date">{moment.unix(timestamp).fromNow()}</div>
                    </div>
                </div>

                <div className="ThetaTransactionListItem__right-container">
                    <div className="ThetaTransactionListItem__amount-container">
                        <div className="ThetaTransactionListItem__amount">{formatNativeTokenAmountToLargestUnit(thetaAmount)}</div>
                        <img className="ThetaTransactionListItem__amount-icon"
                             src="/img/tokens/theta_large@2x.png"
                        />
                    </div>
                    <div className="ThetaTransactionListItem__amount-container">
                        <div className="ThetaTransactionListItem__amount">{formatNativeTokenAmountToLargestUnit(tfuelAmount)}</div>
                        <img className="ThetaTransactionListItem__amount-icon"
                             src="/img/tokens/tfuel_large@2x.png"
                        />
                    </div>
                </div>
            </a>
        );
    }
}

export default ThetaTransactionListItem;
