import _ from 'lodash';
import React from 'react';
import {connect} from 'react-redux';
import {ethers} from 'ethers';
import GradientButton from '../components/buttons/GradientButton';
import {useForm} from 'react-hook-form';
import FormField from '../components/FormField';
import {addToken} from "../state/actions/Wallet";

function TrackTokenForm(props){
    const {onSubmit, defaultValues, formRef, assets} = props;
    const {register, handleSubmit, errors, watch, setValue} = useForm({
        mode: 'onChange',
        defaultValues: defaultValues || {
            address: '',
            symbol: '',
            decimals: ''
        }
    });

    return (
        <form className={'TrackTokenForm'}
              onSubmit={handleSubmit(onSubmit)}
              ref={formRef}
        >
            <FormField title={'Token Contract Address'}
                       error={errors.address && 'A valid contract address is required'}
            >
                <input name="address"
                       className={'RoundedInput'}
                       placeholder={'Enter contract address'}
                       ref={register({
                           required: true,
                           validate: (s) => ethers.utils.isAddress(s)
                       })} />
            </FormField>

            <FormField title={'Token Symbol'}
                       error={errors.symbol && 'Token symbol is required'}
            >
                <input name="symbol"
                       className={'RoundedInput'}
                       placeholder={'Enter token symbol'}
                       ref={register({ required: true })} />
            </FormField>

            <FormField title={'Token Decimals'}
                       error={errors.decimals && 'Token decimals is required'}
            >
                <input name="decimals"
                       type={'number'}
                       className={'RoundedInput'}
                       placeholder={'Enter token decimals'}
                       ref={register({ required: true })} />
            </FormField>
        </form>
    );
}


export class TrackTokenModal extends React.Component {
    constructor() {
        super();

        this.formRef = React.createRef();
    }

    onNextClick = () => {
        this.formRef.current.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }

    onSubmit = (data) => {
        let {address, symbol, decimals} = data;
        address = _.trim(address);
        address = address.toLowerCase();
        if(!address.startsWith('0x')){
            address = '0x' + address;
        }

        this.props.dispatch(addToken({
            address: _.trim(address),
            symbol: _.trim(symbol),
            decimals: parseInt(decimals)
        }));
    }

    render() {
        const {} = this.props;
        return (
            <div className={'TrackTokenModal'}>
                <div className="ModalTitle">
                    Track Token
                </div>
                <TrackTokenForm formRef={this.formRef}
                                onSubmit={this.onSubmit}/>
                <div className={'TrackTokenModal__footer'}>
                    <GradientButton onClick={this.onNextClick}
                                    title={'Save'}
                    />
                </div>
            </div>
        );
    }
}

const mapStateToProps = (state) => {
    return {

    };
};

export default connect(mapStateToProps)(TrackTokenModal);
