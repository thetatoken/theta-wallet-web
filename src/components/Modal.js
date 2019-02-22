import React from 'react'
import './Modal.css';

export default class Modal extends React.Component {
    render() {
        return (
            <div>
                I am the modal base...
                {this.props.children}
            </div>
        )
    }
}