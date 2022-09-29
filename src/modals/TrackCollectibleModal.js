import _ from 'lodash';
import React from 'react';
import {connect} from 'react-redux';
import {ethers} from 'ethers';
import GradientButton from '../components/buttons/GradientButton';
import {useForm} from 'react-hook-form';
import FormField from '../components/FormField';
import {addCollectible} from "../state/actions/Wallet";

function TrackCollectibleForm(props){
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
        <form className={'TrackCollectibleForm'}
              onSubmit={handleSubmit(onSubmit)}
              ref={formRef}
        >
            <FormField title={'NFT Contract Address'}
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

            <FormField title={'Token ID'}
                       error={errors.symbol && 'Token ID is required'}
            >
                <input name="tokenId"
                       className={'RoundedInput'}
                       placeholder={'Enter token ID'}
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
        let {address, tokenId} = data;
        address = _.trim(address);
        address = address.toLowerCase();
        if(!address.startsWith('0x')){
            address = '0x' + address;
        }

        this.props.dispatch(addCollectible({
            address: _.trim(address),
            tokenId: _.trim(tokenId)
        }));
    }

    render() {
        const {} = this.props;
        return (
            <div className={'TrackCollectibleModal'}>
                <div className="ModalTitle">
                    Track NFT
                </div>
                <TrackCollectibleForm formRef={this.formRef}
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
