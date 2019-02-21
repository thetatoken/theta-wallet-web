import React from "react";
import './GradientButton.css';
import {Link} from "react-router-dom";

const classNames = require('classnames');

class GradientButton extends React.Component {
    render() {
        let content = null;
        let className = classNames("GradientButton", {
            [this.props.className]: true,
            "GradientButton--is-disabled": this.props.disabled
        });

        if (this.props.href) {
            content = (
                <Link to={this.props.href}
                      className={className}
                      onClick={this.props.onClick}>
                    <div className={"GradientButton__title"}>
                        {this.props.title}
                    </div>
                </Link>
            );
        }
        else {
            content = (
                <a className={className}
                   onClick={this.props.onClick}>
                    <div className={"GradientButton__title"}>
                        {this.props.title}
                    </div>
                </a>
            );
        }

        return content;
    }
}

export default GradientButton;