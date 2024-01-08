import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ethers } from 'ethers';
import * as thetajs from '@thetalabs/theta-js';
import FormField from '../FormField';
import {StakePurposeForTDROP} from '../../constants';
import {formatTNT20TokenAmountToLargestUnit} from '../../utils/Utils';
import _ from 'lodash';
import BigNumber from 'bignumber.js';
import {TDropAsset} from '../../constants/assets';
import { validateInput } from "../../libs/tns"
import debouncePromise from 'awesome-debounce-promise';
import { useSettings } from "../SettingContext";

export default function WithdrawStakeTxForm(props){
    const { tnsEnable } = useSettings();
    const {onSubmit, defaultValues, formRef, selectedAccount, assets, chainId} = props;
    const {register, handleSubmit, errors, watch, setValue} = useForm({
        mode: 'onChange',
        defaultValues: defaultValues || {
            purpose: thetajs.constants.StakePurpose.StakeForGuardian,
            holder: '',
            amount: '',
            tnsAddress: '',
            tnsLoading: false,
        }
    });
    const purpose = parseInt(watch('purpose'));
    const amount = watch('amount');

    const [tnsName, setTnsName] = useState(false);
    const [tnsAddress, setTnsAddress] = useState(false);
    const [isTns, setIsTns] = useState(false);
    const [isTnsLoading, setIsTnsLoading] = useState(false);

    useEffect(() => {
        const fetchTnsName = async () => {
            if (tnsEnable) {
                const validation = await validateTo(watch('to'));
                setTnsState(validation.state);
            }
        };

        fetchTnsName();
    }, [watch('to'), tnsEnable]);



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

    const validateTo = async (val) => {
        setTnsState({
            domain: '',
            address: '',
            isTnsDomain: false,
            loading: true});
        const validation = await validateInput(val);
        setTnsState(validation.state)
        return validation.result;
    }

    const setTnsState = (state) => {
        setTnsName(state ? state.domain : '');
        setTnsAddress(state ? state.address : '');
        setValue('tnsAddress', state ? state.address : '');
        setIsTns(state ? state.isTnsDomain : '');
        setIsTnsLoading(state ? state.loading : '');
        setValue('tnsLoading', state ? state.loading : '');
    }

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
                    <option key={'een'}
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
                <div>
                    <FormField title={'Holder'} error={errors.holder && 'A valid node address is required'}>
                        {tnsEnable ?
                            <input
                                name="holder"
                                className={'RoundedInput'}
                                placeholder={'Enter node address or TNS'}
                                ref={register({
                                required: true,
                                validate: debouncePromise(async (value) => await validateTo(value), 200)
                            })} />
                        :
                            <input name="holder"
                                className={'RoundedInput'}
                                placeholder={'Enter node address'}
                                ref={register({
                                required: true,
                                validate: (s) => ethers.utils.isAddress(s)
                            })} />}

                        <input name="tnsAddress" ref={register({})} type="hidden"/>
                        <input name="tnsLoading" ref={register({})} type="hidden"/>
                    </FormField>
                    {isTnsLoading && <div className="lds-css css-trncy8">
                        <div className="lds-dual-ring">
                            <div></div>
                        </div>
                    </div>}
                    {tnsName && <div className="TNS-badge">
                        <p className='TNS-badge_title'>{isTns ? "Address:" : "TNS:"}</p>
                        <p className='TNS-badge_content'>{isTns ? tnsAddress : tnsName}</p>
                    </div>}
                </div>
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

