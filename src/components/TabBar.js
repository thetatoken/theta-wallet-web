import React from "react";
import './TabBar.css';

const classNames = require('classnames');

class TabBar extends React.Component {
    render() {
        let className = classNames("TabBar", {
            [this.props.className]: true,
            "TabBar--is-centered": this.props.centered
        });

        return (
            <div className={className}>
                {this.props.children}
            </div>
        );
    }
}

export default TabBar;
