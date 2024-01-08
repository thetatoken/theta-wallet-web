import React, { useState, useEffect } from "react";
import './ThetaTransactionListItem.css';
import moment from 'moment';
import TransactionStatus from './TransactionStatus'
import {formatNativeTokenAmountToLargestUnit, numberWithCommas, truncate} from "../utils/Utils";
import _ from 'lodash';
import Theta from '../services/Theta';
import tns from "../libs/tns"
import Wallet from "../services/Wallet";
import { useSettings } from "./SettingContext";

const ThetaTransactionListItem = (props) => {
    const [tnsName, setTnsName] = useState(false);
    const { tnsEnable } = useSettings();

    useEffect(() => {
        const fetchTnsName = async () => {
            if (Object.keys(props.transaction).length !== 0) {
                const { inputs, outputs } = props.transaction;
                const address = Wallet.getWalletAddress();
                const input = (inputs ? inputs[0] : null);
                const output = (outputs ? outputs[0] : null);
                const from = _.get(input, ['address']);
                const to = _.get(output, ['address']);
                const name = await tns.getDomainName(
                    address.toLowerCase() === to.toLowerCase() ? from : to
                );
                setTnsName(name);
            }
        };

        fetchTnsName();
    }, [props.transaction]);

    const { transaction } = props;
    const { inputs, outputs, timestamp, is_local } = transaction;
    const address = Wallet.getWalletAddress();

    const input = (inputs ? inputs[0] : null);
    const output = (outputs ? outputs[0] : null);
    const from = _.get(input, ['address']);
    const to = _.get(output, ['address']);
    const truncatedFrom = truncate(from);
    const truncatedTo = truncate(to);
    const bound = address.toLowerCase() === to.toLowerCase() ? "inbound" : "outbound";
    const isReceived = (bound === "inbound");
    const explorerUrl = Theta.getTransactionExplorerUrl(transaction);

    const thetaAmount = _.get(output, ['coins', 'thetawei']);
    const tfuelAmount = _.get(output, ['coins', 'tfuelwei']);


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
                            {tnsEnable ? <TNS addr={isReceived ? from : to} tnsName={tnsName} /> : isReceived ? truncatedFrom : truncatedTo}
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
