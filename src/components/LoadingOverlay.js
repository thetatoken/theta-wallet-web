import React, {Component, isValidElement} from 'react';
import MDSpinner from 'react-md-spinner';

class LoadingOverlay extends Component {
    renderMessage() {
        const { loadingMessage } = this.props;

        if (!loadingMessage) {
            return null;
        }

        return isValidElement(loadingMessage) ? (
            loadingMessage
        ) : (
            <span>{loadingMessage}</span>
        );
    }

    render() {
        return (
            <div className="LoadingOverlay">
                <div className="LoadingOverlay__container">
                    <MDSpinner singleColor="#1BDED0" className={'LoadingOverlay__spinner'}/>
                    <div className={'LoadingOverlay__message'}>
                        {this.renderMessage()}
                    </div>
                </div>
            </div>
        );
    }
}

export default LoadingOverlay;
