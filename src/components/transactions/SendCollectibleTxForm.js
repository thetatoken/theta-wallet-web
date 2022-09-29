import React from 'react';
import { useForm } from 'react-hook-form';
import { ethers } from 'ethers';
import FormField from '../../components/FormField';
import {Urls} from '../../constants';
import Warning from '../../components/Warning';

export default function SendCollectibleTxForm(props){
    const {onSubmit, defaultValues, selectedAccount, formRef} = props;
    const {register, handleSubmit, errors, watch, setValue} = useForm({
        mode: 'onChange',
        defaultValues: defaultValues || {
            to: ''
        }
    });

    return (
        <form className={'TxForm TxForm--Send-NFT'}
              onSubmit={handleSubmit(onSubmit)}
              ref={formRef}
        >
            <FormField title={'To'}
                       error={(errors.to && 'A valid address is required')}
            >
                <input name="to"
                       className={'RoundedInput'}
                       placeholder={'Enter address'}
                       ref={register({
                           required: true,
                           validate: (s) => ethers.utils.isAddress(s)
                       })} />
            </FormField>

            <Warning message={'Do not send to Ethereum addresses.'}
                     learnMoreHref={Urls.PreventingLostTokens}
                     style={{
                         maxWidth: '250px',
                         marginBottom: 10
                     }}
            />
        </form>
    );
}
