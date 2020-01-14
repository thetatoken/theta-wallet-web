import React from 'react'
import './StakePurposeSelector.css';

const classNames = require('classnames');

export class StakePurposeSelectorItem extends React.Component {
    render() {
        const {purpose, title, subtitle, isDisabled, isSelected, onClick} = this.props;
        const className = classNames("StakePurposeSelectorItem", {
            "StakePurposeSelectorItem--is-selected" : isSelected,
            "StakePurposeSelectorItem--is-disabled": isDisabled
        });

        return (
            <a className={className}
               onClick={() => {
                   if(!isDisabled && onClick){
                       onClick(purpose);
                   }
               }}
            >
                <div className={"StakePurposeSelectorItem__title"}>{title}</div>
                <div className={"StakePurposeSelectorItem__subtitle"}>{subtitle}</div>
            </a>
        )
    }
}

export default class StakePurposeSelector extends React.Component {
    render() {
        return (
            <div className={"StakePurposeSelector"}>
                {this.props.children}
            </div>
        )
    }
}
