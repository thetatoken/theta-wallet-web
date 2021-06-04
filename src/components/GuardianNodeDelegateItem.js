import React from 'react'
import './GuardianNodeDelegateItem.css';

const classNames = require('classnames');

export class GuardianNodeDelegateItem extends React.Component {
    render() {
        const {node, isDisabled, isSelected, onClick} = this.props;
        const {name, address} = node;
        const className = classNames("GuardianNodeDelegateItem", {
            "GuardianNodeDelegateItem--is-selected" : isSelected,
            "GuardianNodeDelegateItem--is-disabled": isDisabled
        });

        return (
            <a className={className}
               onClick={() => {
                   if(!isDisabled && onClick){
                       onClick(node);
                   }
               }}
            >
                <div className={"GuardianNodeDelegateItem__name"}>{name}</div>
                <div className={"GuardianNodeDelegateItem__address"}>{address}</div>
            </a>
        )
    }
}

export default class GuardianNodeDelegateSelector extends React.Component {
    render() {
        return (
            <div className={"GuardianNodeDelegateSelector"}>
                {this.props.children}
            </div>
        )
    }
}
