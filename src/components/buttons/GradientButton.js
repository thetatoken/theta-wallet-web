import React from "react";
import './GradientButton.css';
import {Link} from "react-router-dom";
import MDSpinner from "react-md-spinner";

const classNames = require('classnames');

class GradientButton extends React.Component {
    render() {
        let content = null;
        let innerContent = null;
        let className = classNames("GradientButton", {
            [this.props.className]: true,
            "GradientButton--is-disabled": this.props.disabled
        });

        if(this.props.loading){
            innerContent = (
                <MDSpinner singleColor="#ffffff"/>
            );
        }
        else{
            innerContent = (
                <div className={"GradientButton__title"}>
                    {this.props.title}
                </div>
            );
        }

        if (this.props.href) {
            content = (
                <Link to={this.props.href}
                      style={this.props.style}
                      className={className}
                      onClick={this.props.onClick}>
                    {innerContent}
                </Link>
            );
        }
        else {
            content = (
                <a className={className}
                   style={this.props.style}
                   onClick={(this.props.disabled === true ? null : this.props.onClick)}>
                    {innerContent}
                </a>
            );
        }

        return content;
    }
}

export default GradientButton;
