import React from "react";
import './TabBar.css';

class TabBar extends React.Component {
    render() {
        return (
            <div className="TabBar">
                {this.props.children}
            </div>
        );
    }
}

export default TabBar;
