import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ethers } from 'ethers';
import _ from 'lodash';
import FormField from '../../components/FormField';
import {
    isValidAmount, getAssetBalance, toNativeTokenLargestUnit, toTNT20TokenLargestUnit
} from '../../utils/Utils';
import {Urls} from '../../constants';
import Warning from '../../components/Warning';
import * as thetajs from "@thetalabs/theta-js";
import BigNumber from "bignumber.js";
import {TFuelAsset, ThetaAsset} from "../../constants/assets";
import FlatButton from "../buttons/FlatButton";
import { validateInput } from "../../libs/tns"
import debouncePromise from 'awesome-debounce-promise';
import { useSettings } from "../SettingContext";
import TNSInputAttachment from "../TNSInputAttachment";
const classNames = require('classnames');

export default function SendTxForm(props){
    const { tnsEnable } = useSettings();
    const {onSubmit, defaultValues, selectedAccount, formRef, assets, chainId} = props;
    const {register, handleSubmit, errors, watch, setValue} = useForm({
        mode: 'onChange',
        defaultValues: defaultValues || {
            to: '',
            tnsAddress: '',
            amount: '',
            tnsLoading: false,
            assetId: ''
        }
    });
    const [tnsName, setTnsName] = useState(false);
    const [tnsAddress, setTnsAddress] = useState(false);
    const [isTns, setIsTns] = useState(false);
    const [isTnsLoading, setIsTnsLoading] = useState(false);

    const assetId = watch('assetId');
    const to = watch('to');

    useEffect(() => {
        const fetchTnsName = async () => {
            if (tnsEnable) {
                const validation = await validateTo(to);
                setTnsState(validation.state);
            }
        };
        fetchTnsName();
    }, [to, tnsEnable]);

    const populateMaxAmount = () => {
        if(_.isEmpty(assetId)){
            return;
        }

        let amount = '';
        const asset = _.find(assets, function (a) {
            return a.id === assetId;
        });

        if(assetId === TFuelAsset.id){
            const maxTfuelBN = (new BigNumber(selectedAccount.balances['tfuelwei'])).minus(thetajs.constants.gasPriceDefault);
            amount = toNativeTokenLargestUnit(maxTfuelBN.toString(10)).toString(10);
        }
        else if (assetId === ThetaAsset.id){
            amount = toNativeTokenLargestUnit(selectedAccount.balances['thetawei']).toString(10);
        }
        else{
            const balance = selectedAccount.balances[asset.address] || '0';
            amount = toTNT20TokenLargestUnit(balance, asset.decimals).toString(10);
        }

        setValue('amount', amount);
    }

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
        <form className={'TxForm TxForm--Send'} onSubmit={handleSubmit(onSubmit)} ref={formRef}>
            <FormField title={'To'} error={(errors.to && !isTnsLoading && (tnsEnable ? 'A valid address or TNS is required' : 'A valid address is required'))}>
                {tnsEnable ?
                    <input
                        name="to"
                        className={classNames('RoundedInput', {
                            'RoundedInput--has-attachment': (isTnsLoading || !(_.isEmpty(tnsName) && _.isEmpty(tnsAddress)))
                        })}
                        placeholder={'Enter address or TNS'}
                        ref={register({
                            required: true,
                            validate: debouncePromise(async (value) => await validateTo(value), 200)
                        })}
                    />
                :
                    <input name="to"
                        className={'RoundedInput'}
                        placeholder={'Enter address'}
                        ref={register({
                        required: true,
                        validate: (s) => ethers.utils.isAddress(s)
                    })} />
                }
                <TNSInputAttachment isTns={isTns}
                                    isTnsLoading={isTnsLoading}
                                    tnsName={tnsName}
                                    tnsAddress={tnsAddress}
                />

                <input name="tnsAddress" ref={register({})} type="hidden"/>
                <input name="tnsLoading" ref={register({})} type="hidden"/>
            </FormField>
            
            <FormField title={'Asset'}
                       error={errors.assetId && 'Asset is required'}
            >
                <select
                    className={'RoundedInput'}
                    name={'assetId'}
                    ref={register({ required: true })}
                >
                    <option key={'__placeholder__'}
                            value={''}
                            disabled>
                        Select asset
                    </option>
                    {
                        assets.map((asset) => (
                            <option key={asset.symbol}
                                    value={asset.id}>
                                {`${asset.symbol} (${getAssetBalance(selectedAccount, asset)})`}
                            </option>
                        ))
                    }
                </select>
            </FormField>

            <FormField title={'Amount'}
                       error={errors.amount && errors.amount.message}
            >
                <div className={'RoundedInputWrapper'}>
                    <input name="amount"
                           className={'RoundedInput'}
                           placeholder={'Enter amount'}
                           type={'number'}
                           ref={register({
                               required: {
                                   value: true,
                                   message: 'Amount is required'
                               },
                               validate: {
                                   sufficientBalance: (s) => {
                                       const asset = _.find(assets, function (a) {
                                           return a.id === assetId;
                                       });
                                       const isValid = isValidAmount(selectedAccount, asset, s);

                                       return isValid ? true : 'Insufficient balance';
                                   },
                                   moreThanZero: (s) => {
                                       const f = parseFloat(s);

                                       return (f > 0) ? true : 'Invalid amount';
                                   }
                               }})} />
                    <FlatButton title={'Max'}
                                size={'small'}
                                className={'RoundedInputButton'}
                                onClick={populateMaxAmount}/>
                </div>
            </FormField>

            {
                !_.startsWith(chainId, 'tsub') &&
                <Warning message={'Do not send to Ethereum/ERC20 addresses.'}
                         learnMoreHref={Urls.PreventingLostTokens}
                         style={{
                             maxWidth: '250px',
                             marginBottom: 10
                         }}
                />
            }

            {
                _.startsWith(chainId, 'tsub') &&
                <Warning message={'Do not send voucher tokens to exchanges.'}
                         learnMoreHref={Urls.PreventingLostTokens}
                         style={{
                             maxWidth: '250px',
                             marginBottom: 10
                         }}
                />
            }

        </form>
    );
}
