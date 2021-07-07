import React from 'react';
import './Notification.css';

const classNames = require('classnames');

// the style contains only the margin given as offset
// options contains all alert given options
// message is the alert message
// close is a function that closes the alert
const Notification = ({ message, color, style }) => {
    let typeModifierClass = `Notification--${color}`;
    let className = classNames("Notification", typeModifierClass);

    return (
        <div style={style} className={className}>
            {message}
        </div>
    )
};

export default Notification;
