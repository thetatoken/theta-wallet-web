import _ from 'lodash';
import React from 'react';
import {connect} from 'react-redux';
import {ethers} from 'ethers';
import GradientButton from '../components/buttons/GradientButton';
import {useForm} from 'react-hook-form';
import FormField from '../components/FormField';
import {addToken} from "../state/actions/Wallet";

export class CollectiblesModal extends React.Component {
    render() {
        const {collectibles, collectibleContracts} = this.props;
        console.log('this.props == ');
        console.log(this.props);

        return (
            <div className={'CollectiblesModal'}>
                <div className="ModalTitle">
                    Collectibles
                </div>
                <div>
                {
                    _.map(collectibleContracts, (contract) => {
                        const contractCollectibles = _.filter(collectibles, (collectible) => {
                            return (collectible.address === contract.address);
                        });
                        return (
                            <div>
                                <div>{contract.name}</div>
                                <div>
                                    {
                                        _.map(contractCollectibles, (collectible) => {
                                            return (
                                                <div>
                                                    <img src={collectible.image}/>
                                                    <div>{collectible.name}</div>
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
    // TODO read the collectibles for this address...
    const {thetaWallet} = state;
    console.log('thetaWallet == ');
    console.log(thetaWallet);
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
