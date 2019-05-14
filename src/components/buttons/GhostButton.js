import React from "react";
import './GhostButton.css';

const classNames = require('classnames');

class GhostButton extends React.Component {
    render() {
        let icon = this.props.iconUrl && <img className="GhostButton__icon"
                                              src={this.props.iconUrl}
        />;

        let className = classNames("GhostButton", {
            [this.props.className]: true,
            "GhostButton--is-disabled": this.props.disabled
        });

        return (
            <a className={className}
               href={this.props.href}
               target={this.props.target}
               onClick={this.props.onClick}
               style={this.props.style}
            >
                {icon}
                <div className="GhostButton__title">
                    {this.props.title}
                </div>
            </a>
        );
    }
}

export default GhostButton;
