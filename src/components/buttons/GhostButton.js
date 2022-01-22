import React, {Fragment} from "react";
import './GhostButton.css';
import MDSpinner from "react-md-spinner";

const classNames = require('classnames');

class GhostButton extends React.Component {
    render() {
        let icon = this.props.iconUrl && <img className="GhostButton__icon"
                                              src={this.props.iconUrl}
        />;
        let innerContent = null;

        let className = classNames("GhostButton", {
            [this.props.className]: true,
            "GhostButton--is-disabled": this.props.disabled
        });

        if(this.props.loading){
            innerContent = (
                <MDSpinner singleColor="#ffffff"
                           size={16}
                           className={"GhostButton__spinner"}
                />
            );
        }
        else{
            innerContent = (
                <Fragment>
                    {icon}
                    <div className="GhostButton__title">
                        {this.props.title}
                    </div>
                </Fragment>
            );
        }

        return (
            <a className={className}
               href={this.props.href}
               target={this.props.target}
               onClick={(this.props.disabled === true ? null : this.props.onClick)}
               style={this.props.style}
            >
                {innerContent}
            </a>
        );
    }
}

export default GhostButton;
