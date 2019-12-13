import React from "react";
import './StakesTable.css';
import {BigNumber} from "bignumber.js";
import TokenTypes from "../constants/TokenTypes";

const ten18 = (new BigNumber(10)).pow(18); // 10^18, 1 Theta = 10^18 ThetaWei, 1 Gamma = 10^ TFuelWei

class StakesTableRow extends React.Component {
    render() {
        let { stake } = this.props;
        let {holder, amount, withdrawn, return_height} = stake;

        const amountBn = (new BigNumber(amount)).dividedBy(ten18);

        return (
            <tr className="StakesTableRow"
            >
                <td>{holder}</td>
                <td>{amountBn.toString()}</td>
                <td>{withdrawn ? "Yes" : "No"}</td>
                <td>{withdrawn ? return_height : "--"}</td>
            </tr>
        );
    }
}

class StakesTable extends React.Component {
    createRows(){
        return this.props.stakes.map(function(stake, index){
            return <StakesTableRow key={ stake._id }
                                   stake={stake}
            />;
        });
    };

    render() {
        return (
            <table className="StakesTable"
                   cellSpacing="0"
                   cellPadding="0">
                <thead>
                    <tr>
                        <th className="StakesTable__header--holder">Holder</th>
                        <th className="StakesTable__header--amount">Amount</th>
                        <th className="StakesTable__header--withdrawn">Withdrawn</th>
                        <th className="StakesTable__header--return-height">Return Height</th>
                    </tr>
                </thead>
                <tbody>
                    {this.createRows()}
                </tbody>
            </table>
        );
    }
}

export default StakesTable;
