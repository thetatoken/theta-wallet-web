import React from "react";
import './TabBar.css';

const classNames = require('classnames');

class TabBar extends React.Component {
    render() {
        let className = classNames("TabBar", {
            [this.props.className]: true,
            "TabBar--is-centered": this.props.centered,
            "TabBar--is-condensed" : this.props.condensed
        });

        return (
            <div className={className}
                 style={this.props.style}
            >
                {this.props.children}
            </div>
        );
    }
}

export default TabBar;
