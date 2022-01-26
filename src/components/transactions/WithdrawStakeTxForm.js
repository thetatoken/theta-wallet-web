import React from 'react';
import { useForm } from 'react-hook-form';
import { ethers } from 'ethers';
import * as thetajs from '@thetalabs/theta-js';
import FormField from '../FormField';
import {StakePurposeForTDROP} from '../../constants';
import {formatTNT20TokenAmountToLargestUnit} from '../../utils/Utils';
import _ from 'lodash';
import BigNumber from 'bignumber.js';
import {TDropAsset} from '../../constants/assets';

export default function WithdrawStakeTxForm(props){
    const {onSubmit, defaultValues, formRef, selectedAccount, assets, chainId} = props;
    const {register, handleSubmit, errors, watch, setValue} = useForm({
        mode: 'onChange',
        defaultValues: defaultValues || {
            purpose: thetajs.constants.StakePurpose.StakeForGuardian,
            holder: '',
            amount: ''
        }
    });
    const purpose = parseInt(watch('purpose'));
    const amount = watch('amount');


    const renderEstTDROPToReturn = () => {
        const percentageToUnstake = Math.min(parseFloat(amount), 100.0) / 100;
        const tnt20stakes = _.get(selectedAccount, ['tnt20Stakes'], {});
        const balanceStr = _.get(tnt20stakes, 'tdrop.estimatedTokenOwnedWithRewards', '0');
        const balanceBN = new BigNumber(balanceStr);
        const amountBN = balanceBN.multipliedBy(percentageToUnstake);
        const formattedAmt = formatTNT20TokenAmountToLargestUnit(amountBN.toString(), TDropAsset(chainId).decimals);

        return (
            <div>
                <span className={'Balance__amount-title'}>Estimated TDROP Returned: </span><span className={'Balance__amount-value'}>{formattedAmt}</span>
            </div>
        );
    };

    return (
        <form className={'TxForm TxForm--WithdrawStake'}
              onSubmit={handleSubmit(onSubmit)}
              ref={formRef}
        >
            <FormField title={'Stake Type'}
                       error={errors.purpose && 'Stake type is required'}
            >
                <select
                    className={'RoundedInput'}
                    name={'purpose'}
                    ref={register({ required: true })}
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
                    <option key={'validator'}
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
                purpose !== StakePurposeForTDROP &&
                <FormField title={'Holder'}
                           error={errors.holder && 'A valid node address is required'}
                >
                    <input name="holder"
                           className={'RoundedInput'}
                           placeholder={'Enter node address'}
                           ref={register({
                               required: true,
                               validate: (s) => ethers.utils.isAddress(s)
                           })} />
                </FormField>
            }

            {
                purpose === StakePurposeForTDROP &&
                <FormField title={'% Amount to Unstake'}
                           error={errors.amount && errors.amount.message}
                >
                    <input name="amount"
                           className={'RoundedInput'}
                           placeholder={'Enter % amount to unstake'}
                           ref={register({
                               required: {
                                   value: true,
                                   message: 'Unstake % amount is required'
                               },
                               validate: {
                                   moreThanZero: (s) => {
                                       const f = parseFloat(s);

                                       return (f > 0) ? true : 'Invalid % amount.';
                                   },
                                   lessThanOrEqualTo100: (s) => {
                                       const f = parseFloat(s);

                                       return (f <= 100.0) ? true : 'Invalid % amount. Max 100%.';
                                   }
                               }
                           })} />
                </FormField>
            }
            {
                (purpose === StakePurposeForTDROP && !_.isEmpty(amount)) &&
                renderEstTDROPToReturn()
            }
        </form>
    );
}

