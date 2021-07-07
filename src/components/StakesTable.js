import React from "react";
import './StakesTable.css';
import {BigNumber} from "bignumber.js";
import {numberWithCommas} from '../utils/Utils';

const ten18 = (new BigNumber(10)).pow(18); // 10^18, 1 Theta = 10^18 ThetaWei, 1 Gamma = 10^ TFuelWei

function stakeTypeToNodeType(stakeType){
    if(stakeType === 'vcp'){
        return 'Validator';
    }
    else if(stakeType === 'gcp'){
        return 'Guardian';
    }
    else if(stakeType === 'eenp'){
        return 'Elite Edge';
    }
}

function stakeTypeToTokenUrl(stakeType){
    if(stakeType === 'vcp' || stakeType === 'gcp'){
        return "/img/tokens/theta_large@2x.png";
    }
    else if(stakeType === 'eenp'){
        return "/img/tokens/tfuel_large@2x.png";
    }
}

class StakesTableRow extends React.Component {
    render() {
        let { stake } = this.props;
        let {holder, amount, withdrawn, return_height, type} = stake;

        const amountBn = (new BigNumber(amount)).dividedBy(ten18);

        return (
            <tr className="StakesTableRow"
            >
                <td>{stakeTypeToNodeType(type)}</td>
                <td>{holder}</td>
                <td>
                    <div className={'StakesTableRow__token-wrapper'}>
                        <img className='StakesTableRow__token-img' src={stakeTypeToTokenUrl(type)}/>
                        <div>{numberWithCommas(amountBn.toString())}</div>
                    </div>
                </td>
                <td>{withdrawn ? "Yes" : "No"}</td>
                <td>{withdrawn ? return_height : "--"}</td>
            </tr>
        );
    }
}

class StakesTable extends React.Component {
    createRows(){
        let stakes = this.props.stakes;

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
                        <th className="StakesTable__header--node-type">Node Type</th>
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
