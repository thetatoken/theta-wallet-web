import React, { useState, useEffect } from "react";
import './StakesTable.css';
import {BigNumber} from "bignumber.js";
import {numberWithCommas} from '../utils/Utils';
import tns from "../libs/tns"
import { useSettings } from "./SettingContext";

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

const StakesTableRow = ({ stake }) => {
    const { tnsEnable } = useSettings();
    const [tnsName, setTnsName] = useState(false);
  
    useEffect(() => {
      async function fetchTnsName() {
        if (tnsEnable && stake && stake.holder) {
          const name = await tns.getDomainName(stake.holder);
          setTnsName(name);
        }
      }
  
      fetchTnsName();
    }, [stake, tnsEnable]);
  
    const { holder, amount, withdrawn, return_height, type } = stake;
    const amountBn = (new BigNumber(amount)).dividedBy(ten18);
  
    return (
        <tr className="StakesTableRow">
            <td>{stakeTypeToNodeType(type)}</td>
            <td><TNS addr={holder} tnsName={tnsName} /></td>
            <td>
                <div className={'StakesTableRow__token-wrapper'}>
                    <img className='StakesTableRow__token-img' src={stakeTypeToTokenUrl(type)} alt={type}/>
                    <div>{numberWithCommas(amountBn.toString())}</div>
                </div>
            </td>
            <td>{withdrawn ? "Yes" : "No"}</td>
            <td>{withdrawn ? return_height : "--"}</td>
        </tr>
    );
}


const StakesTable = ({ stakes }) => {
    const createRows = () => {
      return stakes.map((stake, index) => (
        <StakesTableRow key={stake._id} stake={stake} />
      ));
    };
  
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
                {createRows()}
            </tbody>
        </table>
    );
}

const TNS = ({addr, tnsName}) => {
    return (
        <div className="value tooltip">
            {tnsName &&
            <div className="tooltip--text">
                <p>
                    {tnsName}<br/>
                    ({addr})
                </p>
            </div>}
            {tnsName ? tnsName : addr ? addr : ''}
        </div>
    );
};

export default StakesTable;
