import React from 'react';
import { useForm } from 'react-hook-form';
import FormField from '../../components/FormField';
import {
    isValidAmount, toTNT20TokenLargestUnit
} from '../../utils/Utils';
import FlatButton from "../buttons/FlatButton";
import {WThetaAsset} from "../../constants/assets";

export default function UnwrapThetaTxForm(props){
    const {onSubmit, defaultValues, selectedAccount, formRef, assets, chainId} = props;
    const {register, handleSubmit, errors, watch, setValue} = useForm({
        mode: 'onChange',
        defaultValues: defaultValues || {
            amount: '',
        }
    });
    const populateMaxAmount = () => {
        const asset = WThetaAsset(chainId);
        const balance = selectedAccount.balances[asset.address] || '0';
        let amount = toTNT20TokenLargestUnit(balance, asset.decimals).toString(10);

        setValue('amount', amount);
    }

    return (
        <form className={'TxForm TxForm--Send'}
              onSubmit={handleSubmit(onSubmit)}
              ref={formRef}
        >
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
                                       const asset = WThetaAsset(chainId);
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

        </form>
    );
}
