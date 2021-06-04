import React from 'react';
import './Alert.css';

const classNames = require('classnames');

// the style contains only the margin given as offset
// options contains all alert given options
// message is the alert message
// close is a function that closes the alert
const Alert = ({ message, options, style, close }) => {
    let type = options.type;
    let typeModifierClass = `Alert--${type}`;
    let className = classNames("Alert", typeModifierClass);

    return (
        <div style={style} className={className}>
            <img src={`/img/icons/alert-${type}@2x.png`}
                 className="Alert__icon"
            />
            <div className="Alert__message">{message}</div>
            {
                close &&
                <button className="Alert__close-button" onClick={close}>
                    <img src={'/img/icons/alert-x@2x.png'}/>
                </button>
            }
        </div>
    )
};

export default Alert;
