import _ from 'lodash';
import React from 'react';
import {connect} from 'react-redux';
import {ethers} from 'ethers';
import GradientButton from '../components/buttons/GradientButton';
import {useForm} from 'react-hook-form';
import FormField from '../components/FormField';
import {addCollectible} from "../state/actions/Wallet";
import GhostButton from "../components/buttons/GhostButton";
import {store} from "../state";
import {showModal} from "../state/actions/ui";
import ModalTypes from "../constants/ModalTypes";
import FlatButton from "../components/buttons/FlatButton";

export class CollectiblesModal extends React.Component {
    render() {
        const {collectibles, collectibleContracts} = this.props;
        const onClickCollectible = (collectible) => {
            store.dispatch(showModal({
                type: ModalTypes.CREATE_TRANSACTION,
                props: {
                    transactionType: 'send-collectible',
                    collectible: collectible
                }
            }));
        };

        return (
            <div className={'CollectiblesModal'}>
                <div className="ModalHeader">
                    <div>
                        <FlatButton title={'Import NFT'}
                                    size={'small'}
                                    onClick={() => {
                                        store.dispatch(showModal({
                                            type: ModalTypes.TRACK_COLLECTIBLE,
                                        }));
                                    }}
                        />
                    </div>
                    <div className={'ModalTitle'}>Collectibles</div>
                    <div></div>
                </div>

                <div className={'CollectiblesScrollContainer'}>
                {
                    _.map(collectibleContracts, (contract) => {
                        const contractCollectibles = _.filter(collectibles, (collectible) => {
                            return (collectible.address === contract.address);
                        });
                        return (
                            <div>
                                <div className={'CollectiblesSectionTitle'} >{contract.name}</div>
                                <div className={'CollectibleItems'}>
                                    {
                                        _.map(contractCollectibles, (collectible) => {
                                            return (
                                                <div className={'CollectibleItem'}
                                                     onClick={() => {onClickCollectible(collectible)}}>
                                                    <img src={collectible.image}
                                                         className={'CollectibleItem__image'}
                                                    />
                                                    <div className={'CollectibleItem__name'}>{collectible.name}</div>
                                                </div>
                                            )
                                        })
                                    }
                                </div>
                            </div>
                        );
                    })
                }
                </div>
            </div>
        );
    }
}

const mapStateToProps = (state) => {
    const {thetaWallet} = state;
    const {selectedAddress, allCollectibleContracts, allCollectibles} = thetaWallet;
    const chainId = thetaWallet.network?.chainId;

    return {
        selectedAddress,
        chainId,
        collectibleContracts: _.get(allCollectibleContracts, [selectedAddress, chainId]),
        collectibles: _.get(allCollectibles, [selectedAddress, chainId])
    };
};

export default connect(mapStateToProps)(CollectiblesModal);
