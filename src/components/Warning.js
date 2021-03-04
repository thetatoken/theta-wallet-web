import React from 'react';
import './Warning.css';

const classNames = require('classnames');

const Warning = ({ message, learnMoreHref, style, className }) => {
    let combinedClassName = classNames("Warning", className);

    return (
        <div style={style} className={combinedClassName}>
            <span className="Warning__message">{message}</span>
            <a className="Warning__learn-more"
               href={learnMoreHref}
               target={'_blank'}
               rel='noopener noreferrer'
            >Learn more</a>
        </div>
    );
};

export default Warning;
