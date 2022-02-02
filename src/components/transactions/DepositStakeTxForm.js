import _ from 'lodash';
import React from 'react';
import { useForm } from 'react-hook-form';
import { ethers } from 'ethers';
import * as thetajs from '@thetalabs/theta-js';
import FormField from '../../components/FormField';
import {
    formatNativeTokenAmountToLargestUnit,
    isHolderSummary,
    isValidAmount,
    numberWithCommas, toNativeTokenLargestUnit
} from '../../utils/Utils';
import {TDropAsset, TFuelAsset, ThetaAsset} from '../../constants/assets';
import {getMaxDelegatedStakeAmount, getMaxStakeAmount, getMinStakeAmount, StakePurposeForTDROP} from '../../constants';
import FlatButton from "../buttons/FlatButton";
import BigNumber from "bignumber.js";

export default function DepositStakeTxForm(props) {
    const {onSubmit, defaultValues, formRef, selectedAccount, assets, chainId, onShowDelegatedGuardianNodes} = props;
    const {register, handleSubmit, errors, watch, setValue} = useForm({
        mode: 'onChange',
        defaultValues: defaultValues || {
            purpose: thetajs.constants.StakePurpose.StakeForGuardian,
            holder: '',
            holderSummary: '',
            amount: '',
            delegatedGuardianNode: null
        }
    });
    React.useEffect(() => {
        register('delegatedGuardianNode');
    }, [register]);
    const purpose = parseInt(watch('purpose'));
    const delegatedGuardianNode = watch('delegatedGuardianNode');
    let holderTitle = null;
    let holderPlaceholder = null;
    let stakeAmountTitle = null;

    if (purpose === thetajs.constants.StakePurpose.StakeForValidator) {
        holderTitle = 'Validator Node Holder (Address)';
        holderPlaceholder = 'Enter validator node address';
        stakeAmountTitle = 'Theta Stake Amount';
    } else if (purpose === thetajs.constants.StakePurpose.StakeForGuardian) {
        holderTitle = 'Guardian Node Holder (Summary)';
        holderPlaceholder = 'Enter guardian node summary';
        stakeAmountTitle = 'Theta Stake Amount';
    } else if (purpose === thetajs.constants.StakePurpose.StakeForEliteEdge) {
        holderTitle = 'Edge Node Holder (Summary)';
        holderPlaceholder = 'Enter edge node summary';
        stakeAmountTitle = 'TFuel Stake Amount';
    } else if (purpose === StakePurposeForTDROP) {
        holderTitle = null;
        holderPlaceholder = null;
        stakeAmountTitle = 'TDrop Stake Amount';
    }
    const populateMaxAmount = () => {
        let amount = '';
        let max = getMaxStakeAmount(purpose);
        if(purpose === thetajs.constants.StakePurpose.StakeForValidator || purpose === thetajs.constants.StakePurpose.StakeForGuardian){
            amount = toNativeTokenLargestUnit(selectedAccount.balances['thetawei']).toString(10);

            if (purpose === thetajs.constants.StakePurpose.StakeForEliteEdge) {
                amount = Math.min(max, parseFloat(amount));
            } else if (
                purpose === thetajs.constants.StakePurpose.StakeForGuardian ||
                !_.isNil(delegatedGuardianNode)) {
                max = getMaxDelegatedStakeAmount(purpose);
                amount = Math.min(max, parseFloat(amount));
            }
        }
        else if(purpose === thetajs.constants.StakePurpose.StakeForEliteEdge){
            const maxTfuelBN = (new BigNumber(selectedAccount.balances['tfuelwei'])).minus(thetajs.constants.gasPriceDefault);
            amount = toNativeTokenLargestUnit(maxTfuelBN.toString(10)).toString(10);

            amount = Math.min(max, parseFloat(amount));
        }
        else if(purpose === StakePurposeForTDROP){
            const tDropAsset = TDropAsset(chainId);
            const balance = selectedAccount.balances[tDropAsset.address] || '0';
            amount = toNativeTokenLargestUnit(balance).toString(10);
        }
        setValue('amount', amount);
    }

    return (
        <form className={'TxForm TxForm--DepositStake'}
              onSubmit={handleSubmit(onSubmit)}
              ref={formRef}
        >
            <FormField title={'Stake Type'}
                       error={errors.purpose && 'Stake type is required'}
            >
                <select
                    className={'RoundedInput'}
                    name={'purpose'}
                    ref={register({required: true})}
                >
                    <option key={'__placeholder__'}
                            value={''}
                            disabled>
                        Select stake type
                    </option>
                    <option key={'guardian'}
                            value={thetajs.constants.StakePurpose.StakeForGuardian}>
                        Guardian Node
                    </option>
                    <option key={'validator'}
                            value={thetajs.constants.StakePurpose.StakeForValidator}>
                        Validator Node
                    </option>
                    <option key={'elite-edge'}
                            value={thetajs.constants.StakePurpose.StakeForEliteEdge}>
                        Edge Node
                    </option>
                    {
                        TDropAsset(chainId) &&
                        <option key={'tdrop'}
                                value={StakePurposeForTDROP}>
                            TDROP
                        </option>
                    }
                </select>
            </FormField>

            {
                (purpose === thetajs.constants.StakePurpose.StakeForValidator) &&
                <FormField title={holderTitle}
                           error={errors.holder && 'A valid validator address is required'}
                >
                    <input name="holder"
                           className={'RoundedInput'}
                           placeholder={holderPlaceholder}
                           ref={register({
                               required: true,
                               validate: (s) => ethers.utils.isAddress(s)
                           })}/>
                </FormField>
            }

            {
                (purpose === thetajs.constants.StakePurpose.StakeForGuardian) &&
                <FormField title={(delegatedGuardianNode ? 'Delegated Guardian Node' : holderTitle)}
                           error={errors.holderSummary && 'Guardian node summary or delegated guardian node is required'}
                >
                    <React.Fragment>
                        <textarea name="holderSummary"
                          className={'RoundedInput'}
                          style={{height: 100, display: (delegatedGuardianNode ? 'none' : 'block')}}
                          placeholder={holderPlaceholder}
                          ref={register({
                              required: true,
                              validate: (s) => isHolderSummary(s)
                          })}/>
                        {
                            _.isNil(delegatedGuardianNode) &&
                            <a onClick={() => {
                                onShowDelegatedGuardianNodes((node) => {
                                    setValue('holderSummary', node.node_summary);
                                    setValue('delegatedGuardianNode', node);
                                });
                            }}
                               className={'Link'}
                               style={{marginTop: 8, textAlign: 'left'}}
                            >
                                Select Delegated Guardian Node
                            </a>
                        }
                    </React.Fragment>
                    {
                        !_.isNil(delegatedGuardianNode) &&
                        <React.Fragment>
                            <div className={'RoundedInput'}>
                                <div className={'RoundedInputClearableValue'}>
                                    <div>{delegatedGuardianNode.name}</div>
                                    <a onClick={() => {
                                        setValue('holderSummary', null);
                                        setValue('delegatedGuardianNode', null);
                                    }}
                                       style={{marginLeft: 'auto'}}
                                    >
                                        <img src={'/img/icons/alert-x@2x.png'}/>
                                    </a>
                                </div>
                            </div>
                        </React.Fragment>
                    }
                </FormField>
            }


            {
                (purpose === thetajs.constants.StakePurpose.StakeForEliteEdge) &&
                <FormField title={holderTitle}
                           error={errors.holderSummary && 'Edge node summary is required'}
                >
          <textarea name="holderSummary"
                    className={'RoundedInput'}
                    style={{height: 100}}
                    placeholder={holderPlaceholder}
                    ref={register({
                        required: true,
                        validate: (s) => thetajs.transactions.DepositStakeV2Transaction.isValidHolderSummary(purpose, s)
                    })}/>
                </FormField>
            }

            <FormField title={stakeAmountTitle}
                       error={errors.amount && errors.amount.message}
            >
                <div className={'RoundedInputWrapper'}>
                    <input name="amount"
                       className={'RoundedInput'}
                       placeholder={'Enter amount to stake'}
                       ref={register({
                           required: {
                               value: true,
                               message: 'Stake amount is required'
                           },
                           validate: {
                               sufficientBalance: (s) => {
                                   let isValid = true;
                                   if (purpose === thetajs.constants.StakePurpose.StakeForEliteEdge) {
                                       isValid = isValidAmount(selectedAccount, TFuelAsset, s);
                                   } else if (
                                       purpose === thetajs.constants.StakePurpose.StakeForGuardian ||
                                       purpose === thetajs.constants.StakePurpose.StakeForValidator) {
                                       isValid = isValidAmount(selectedAccount, ThetaAsset, s);
                                   } else if (purpose === StakePurposeForTDROP) {
                                       const tDropAsset = TDropAsset(chainId);

                                       isValid = isValidAmount(selectedAccount, tDropAsset, s);
                                   }

                                   return isValid ? true : 'Insufficient balance';
                               },
                               moreThanMin: (s) => {
                                   const f = parseFloat(s);
                                   const min = getMinStakeAmount(purpose);
                                   if (purpose === thetajs.constants.StakePurpose.StakeForEliteEdge) {
                                       if(min > f){
                                           return `Invalid amount. Must be at least ${numberWithCommas(min)} TFUEL`;
                                       }
                                   } else if (
                                       purpose === thetajs.constants.StakePurpose.StakeForGuardian ||
                                       purpose === thetajs.constants.StakePurpose.StakeForValidator) {
                                       if(min > f){
                                           return `Invalid amount. Must be at least ${numberWithCommas(min)} THETA`;
                                       }
                                   }
                                   return true;
                               },
                               lessThanMax: (s) => {
                                   const f = parseFloat(s);
                                   let max = getMaxStakeAmount(purpose);
                                   if (purpose === thetajs.constants.StakePurpose.StakeForEliteEdge) {
                                       if(max < f){
                                           return `Invalid amount. Must be less than ${numberWithCommas(max)} TFUEL`;
                                       }
                                   } else if (
                                       purpose === thetajs.constants.StakePurpose.StakeForGuardian ||
                                       !_.isNil(delegatedGuardianNode)) {
                                       max = getMaxDelegatedStakeAmount(purpose);
                                       if(max < f){
                                           return `Invalid amount. There's a max of ${numberWithCommas(max)} THETA for delegated nodes. Please download and run your own Guardian Node to stake more.`;
                                       }
                                   }
                                   return true;
                               },
                               moreThanZero: (s) => {
                                   const f = parseFloat(s);

                                   return (f > 0) ? true : 'Invalid stake amount';
                               }
                           }
                       })}/>
                       <FlatButton title={'Max'}
                                   size={'small'}
                                   className={'RoundedInputButton'}
                                   onClick={populateMaxAmount}/>
                </div>
            </FormField>
        </form>
    );
}
