import React from 'react'
import './FormInputContainer.css';

export default class FormInputContainer extends React.Component {
    render() {
        return (
            <div className="FormInputContainer">
                <div className="FormInputContainer__title">
                    {this.props.title}
                </div>
                <div className="FormInputContainer__input-container">
                    {this.props.children}
                </div>
                <div className="FormInputContainer__error">
                    {this.props.error}
                </div>
            </div>
        )
    }
}