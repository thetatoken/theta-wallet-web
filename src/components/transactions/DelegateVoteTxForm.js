import React from 'react';
import { useForm } from 'react-hook-form';
import { ethers } from 'ethers';
import FormField from '../FormField';

export default function DelegateVoteTxForm(props){
    const {onSubmit, defaultValues, formRef, selectedAccount, assets, chainId} = props;
    const {register, handleSubmit, errors, watch, setValue} = useForm({
        mode: 'onChange',
        defaultValues: defaultValues || {
            address: ''
        }
    });

    return (
        <form className={'TxForm TxForm--WithdrawStake'}
              onSubmit={handleSubmit(onSubmit)}
              ref={formRef}
        >

            <FormField title={'Delegate'}
                       error={errors.holder && 'A valid delegate address is required'}
            >
                <input name="address"
                       className={'RoundedInput'}
                       placeholder={'Enter wallet address'}
                       ref={register({
                           required: true,
                           validate: (s) => ethers.utils.isAddress(s)
                       })} />
            </FormField>
        </form>
    );
}

