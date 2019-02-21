import React from "react";
import './TabBarItem.css';
import {NavLink} from 'react-router-dom'

class TabBarItem extends React.Component {
    render() {
        let content = null;

        if (this.props.href) {
            content = (
                <NavLink to={this.props.href}
                         className="TabBarItem"
                         activeClassName='TabBarItem--is-active'
                         onClick={this.props.onClick}>
                    {
                        this.props.normalIconUrl &&
                        <img className="TabBarItem__icon"
                         alt={this.props.title}
                         src={this.props.normalIconUrl}/>
                    }

                    {
                        this.props.activeIconUrl &&
                        <img className="TabBarItem__icon-active"
                             alt={this.props.title}
                             src={this.props.activeIconUrl}/>
                    }

                    <div className={"TabBarItem__title"}>
                        {this.props.title}
                    </div>
                </NavLink>
            );
        }
        else {
            content = (
                <a className="TabBarItem"
                   href={this.props.href}
                   target={this.props.target}
                   onClick={this.props.onClick}>
                    <img className="TabBarItem__icon"
                         alt={this.props.title}
                         src={this.props.normalIconUrl}/>
                    <div className={"TabBarItem__title"}>
                        {this.props.title}
                    </div>
                </a>
            );
        }

        return content;
    }
}

export default TabBarItem;