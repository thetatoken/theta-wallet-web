import React from 'react';

const classNames = require('classnames');

export default class FormField extends React.Component {
    render() {
        const {title, error, style, className, children} = this.props;

        return (
            <div className={classNames('FormField', { [className]: true })}
                 style={style}
            >
                <div className={'FormField__title'}>
                    {title}
                </div>
                {
                    children
                }
                { error &&
                <div className={'FormField__error'}>
                    {error}
                </div>
                }
            </div>
        );
    }
}
