import React from "react";
import './ERC20Badge.css';

export default class ERC20Badge extends React.PureComponent {
    render() {
        return (
            <div className="ERC20Badge">
                <div className="ERC20Badge__text">ERC-20</div>
            </div>
        );
    }
}
