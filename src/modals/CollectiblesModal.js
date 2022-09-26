import _ from 'lodash';
import React from 'react';
import {connect} from 'react-redux';
import {ethers} from 'ethers';
import GradientButton from '../components/buttons/GradientButton';
import {useForm} from 'react-hook-form';
import FormField from '../components/FormField';
import {addCollectible, refreshCollectiblesOwnership, removeCollectible} from "../state/actions/Wallet";
import GhostButton from "../components/buttons/GhostButton";
import {store} from "../state";
import {showModal} from "../state/actions/ui";
import ModalTypes from "../constants/ModalTypes";
import FlatButton from "../components/buttons/FlatButton";
import { Popover } from 'react-tiny-popover'
import EmptyState from "../components/EmptyState";

class CollectibleItemMenu extends React.Component {
    render() {
        const {collectible, onCancel} = this.props;

        return (
            <div className={'CollectibleItemMenu'}>
                <FlatButton title="Send"
                            size={'small'}
                            centered={true}
                             onClick={async () => {
                                 onCancel();
                                 await store.dispatch(refreshCollectiblesOwnership(collectible.address, collectible.tokenId));
                                 store.dispatch(showModal({
                                     type: ModalTypes.CREATE_TRANSACTION,
                                     props: {
                                         transactionType: 'send-collectible',
                                         collectible: collectible
                                     }
                                 }));
                             }}/>
                <FlatButton title="Untrack"
                            size={'small'}
                            centered={true}
                             onClick={() => {
                                 onCancel();
                                 const stopTracking = window.confirm('Are you sure you want to stop tracking this NFT?');
                                 if(stopTracking){
                                     store.dispatch(removeCollectible(collectible));
                                 }
                             }}/>
                <FlatButton title="Cancel"
                            size={'small'}
                            centered={true}
                            onClick={onCancel}/>
            </div>
        )
    }
}

class CollectibleItem extends React.Component {
    constructor() {
        super();

        this.state = {
            isPopoverOpen: false
        };
    }

    render() {
        const {collectible} = this.props;
        const {isPopoverOpen} = this.state;

        const onClickCollectible = (collectible) => {
            this.setState({isPopoverOpen: true})
        };

        return (
            <Popover
                isOpen={isPopoverOpen}
                positions={['bottom']}
                padding={10}
                onClickOutside={() => this.setState({isPopoverOpen: false})}
                content={({ position, childRect, popoverRect }) => (
                    <CollectibleItemMenu collectible={collectible}
                                         onCancel={() => {
                                             this.setState({isPopoverOpen: false})
                                         }}
                    />
                )}
            >
                <div className={'CollectibleItem'}
                     onClick={onClickCollectible}>
                    <img src={collectible.image}
                         className={'CollectibleItem__image'}
                    />
                    <div className={'CollectibleItem__name'}>{collectible.name}</div>
                </div>
            </Popover>
        )
    }
}


export class CollectiblesModal extends React.Component {
    render() {
        const {collectibles, collectibleContracts} = this.props;

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
                    <div/>
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
                                                <CollectibleItem collectible={collectible}/>
                                            )
                                        })
                                    }
                                </div>
                            </div>
                        );
                    })
                }
                </div>
                {
                    _.isEmpty(collectibles) &&
                    <EmptyState title={'No Tracked NFTs'}
                                subtitle={'You must track each NFT by it\'s contract address and token ID'}
                    />
                }
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
