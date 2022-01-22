import React, {Fragment} from 'react';
import MDSpinner from 'react-md-spinner';
import {Link} from 'react-router-dom';

const classNames = require('classnames');

class FlatButton extends React.Component {
    render() {
        let icon = this.props.iconUrl && <img className="FlatButton__icon"
                                              src={this.props.iconUrl}
        />;
        let innerContent = null;

        const sizeClass = `FlatButton--${this.props.size}`;
        let className = classNames('FlatButton', {
            [this.props.className]: true,
            [sizeClass]: true,
            'FlatButton--borderless': this.props.borderless,
            'FlatButton--centered': this.props.centered,
            'FlatButton--is-disabled': this.props.disabled
        });

        if(this.props.loading){
            innerContent = (
                <MDSpinner singleColor="#ffffff"
                           size={16}
                           className={'FlatButton__spinner'}
                />
            );
        }
        else{
            innerContent = (
                <Fragment>
                    {icon}
                    <div className="FlatButton__title">
                        {this.props.title}
                    </div>
                </Fragment>
            );
        }

        if(this.props.href){
            return (
                <Link className={className}
                      to={this.props.href}
                      target={this.props.target}
                      onClick={this.props.onClick}
                      style={this.props.style}
                >
                    {innerContent}
                </Link>
            );
        }

        return (
            <a className={className}
               target={this.props.target}
               onClick={this.props.onClick}
               style={this.props.style}
            >
                {innerContent}
            </a>
        );
    }
}

export default FlatButton;
