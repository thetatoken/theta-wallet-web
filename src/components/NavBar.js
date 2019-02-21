import React from "react";
import './NavBar.css';

const classNames = require('classnames');

class NavBar extends React.Component {
    render() {
        return (
            <div className={classNames("NavBar", { 'NavBar--is-centered': this.props.centered })}>
                <img className="NavBar__logo" src={'/img/logo/theta_wallet_logo@2x.png'}/>
            </div>
        );
    }
}

export default NavBar;
