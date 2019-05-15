import React from "react";
import './HardwareOptionButton.css';

const classNames = require('classnames');

class HardwareOptionButton extends React.Component {
    render() {
        let icon = this.props.iconUrl && <img className="HardwareOptionButton__icon"
                                              src={this.props.iconUrl}
        />;

        let className = classNames("HardwareOptionButton", {
            [this.props.className]: true,
            "HardwareOptionButton--is-selected" : this.props.isSelected,
            "HardwareOptionButton--is-disabled": this.props.disabled
        });

        return (
            <a className={className}
               href={this.props.href}
               target={this.props.target}
               onClick={this.props.onClick}
               style={this.props.style}
            >
                {icon}
                <div className="HardwareOptionButton__title">
                    {this.props.title}
                </div>
            </a>
        );
    }
}

export default HardwareOptionButton;
