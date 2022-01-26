import React from 'react'
import './Modal.css';

export default class Modal extends React.Component {
    render() {
        return (
            <div className="Modal">
                {
                    this.props.closeable !== false &&
                    <a className="Modal__close-button" onClick={(e) =>{
                        e.preventDefault();
                    }}>
                        <img src="/img/icons/modal-x@2x.png"/>
                    </a>
                }
                {this.props.children}
            </div>
        )
    }
}
