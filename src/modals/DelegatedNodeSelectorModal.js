import React from 'react';
import {connect} from 'react-redux';
import {truncate} from '../utils/Utils';
import {hideModal} from "../state/actions/ui";

export class DelegatedNodeSelectorModal extends React.Component {
    onNodeClick = (node) => {
        const {onSelectNode} = this.props;

        this.props.dispatch(hideModal());

        if(onSelectNode){
            onSelectNode(node);
        }
    };

    render() {
        const {delegatedGuardianNodes} = this.props;

        return (
            <div className={'DelegatedNodeSelectorModal'}>
                <div className='DelegatedNodeSelectorModal__header'>
                    <div className='DelegatedNodeSelectorModal__header-title'>Select Delegated Node</div>
                </div>
                <div className='DelegatedNodeSelectorModal__content'>
                    <div className='DelegatedNodeSelectorModal__message'>
                        Delegated staking Guardian Nodes are nodes run by Theta community volunteers. Uptime of these nodes is not guaranteed, and you may not receive full TFUEL rewards if the node you delegate to has significant downtime.
                    </div>
                    <div className='DelegatedNodeList'>
                        {
                            delegatedGuardianNodes.map((node) => {
                                return (
                                    <div key={node.address}
                                         className={'DelegatedNodeListItem'}
                                         onClick={() => {
                                             this.onNodeClick(node);
                                         }}
                                    >
                                        <div className='DelegatedNodeListItem__name'>
                                            <span>{node.name}</span>
                                            <span className='DelegatedNodeListItem__fee'>{`${node.fee} Fee`}</span>
                                        </div>
                                        <div className='DelegatedNodeListItem__address'>{truncate(node.address)}</div>
                                    </div>
                                );
                            })
                        }
                    </div>
                </div>
            </div>
        );
    }
}

const mapStateToProps = (state, props) => {
    const { thetaWallet } = state;
    const delegatedGuardianNodes = thetaWallet.delegatedGuardianNodes;

    return {
        delegatedGuardianNodes: delegatedGuardianNodes,

        onSelectNode: props.onSelectNode
    };
};

export default connect(mapStateToProps)(DelegatedNodeSelectorModal);
