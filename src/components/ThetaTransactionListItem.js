import React from "react";
import './ThetaTransactionListItem.css';
import moment from 'moment';
import TransactionStatus from './TransactionStatus'
import {formatNativeTokenAmountToLargestUnit, numberWithCommas, truncate} from "../utils/Utils";
import _ from 'lodash';
import Theta from '../services/Theta';
import tns from "../libs/tns"
import Wallet from "../services/Wallet";

class ThetaTransactionListItem extends React.Component {
    constructor(){
        super();
        this.state = { tnsName: false };
    }

    async componentDidMount() {
        if(Object.keys(this.props.transaction).length !== 0) {
            let {inputs, outputs} = this.props.transaction;
            let address = Wallet.getWalletAddress();
            let input = (inputs ? inputs[0] : null);
            let output = (outputs ? outputs[0] : null);
            let from = _.get(input, ['address']);
            let to = _.get(output, ['address']);
            const tnsName = await tns.getDomainName(
                address.toLowerCase() === to.toLowerCase() ? from : to
            );
            this.setState({tnsName: tnsName});
        }
    }

    render() {
        let transaction = this.props.transaction;
        let {inputs, outputs, timestamp, is_local} = transaction;
        let address = Wallet.getWalletAddress();
        
        let input = (inputs ? inputs[0] : null);
        let output = (outputs ? outputs[0] : null);
        let from = _.get(input, ['address']);
        let to = _.get(output, ['address']);
        let bound = address.toLowerCase() === to.toLowerCase() ? "inbound" : "outbound";
        let isReceived = (bound === "inbound");
        let explorerUrl = Theta.getTransactionExplorerUrl(transaction);

        // //Truncate the addresses to help reduce the run ons
        // from = truncate(from);
        // to = truncate(to);

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
                            <div className="ThetaTransactionListItem__address">
                                <TNS addr={isReceived ? from : to} tnsName={this.state.tnsName} />
                            </div>
                        </div>
                    </div>
                    <div className="ThetaTransactionListItem__bottom-container">
                        <div className="ThetaTransactionListItem__date">{moment.unix(timestamp).fromNow()}</div>
                    </div>
                </div>

                <div className="ThetaTransactionListItem__right-container">
                    {
                        thetaAmount !== '0' &&
                        <div className="ThetaTransactionListItem__amount-container">
                            <div className="ThetaTransactionListItem__amount">{formatNativeTokenAmountToLargestUnit(thetaAmount)}</div>
                            <img className="ThetaTransactionListItem__amount-icon"
                                 src="/img/tokens/theta_large@2x.png"
                            />
                        </div>
                    }
                    {
                        tfuelAmount !== '0' &&
                        <div className="ThetaTransactionListItem__amount-container">
                            <div className="ThetaTransactionListItem__amount">{formatNativeTokenAmountToLargestUnit(tfuelAmount)}</div>
                            <img className="ThetaTransactionListItem__amount-icon"
                                 src="/img/tokens/tfuel_large@2x.png"
                            />
                        </div>
                    }

                </div>
            </a>
        );
    }
}

const TNS = ({addr, tnsName}) => {
    //Truncate the addresses to help reduce the run ons
    let truncAddr = truncate(addr);

    return (
        <div className="value tooltip">
            {tnsName &&
            <div className="tooltip--text">
                <p>
                    {tnsName}<br/>
                    ({addr})
                </p>
            </div>}
            {tnsName ? tnsName : addr ? truncAddr : ''}
        </div>
    );
};

export default ThetaTransactionListItem;
