import React from 'react';
import {connect} from 'react-redux';
import FlatButton from '../components/buttons/FlatButton';
import GradientButton from '../components/buttons/GradientButton';
import Modal from '../components/Modal';
import DAppOrigin from '../components/DAppOrigin';
import dappCloseIcon from '../img/icons/close-dapp@2x.png';
import {hideModal} from '../state/actions/ui';
import {updateAccountBalances} from '../state/actions/Wallet';
import {getDAppUrl} from '../services/DAppOrigin';

export class DAppModal extends React.Component {
    constructor(props) {
        super(props);
        this.frameRef = React.createRef();
        this.state = {approved: false, error: null};
    }

    componentDidMount() { this.mounted = true; }

    componentDidUpdate(previousProps) {
        if (previousProps.uri !== this.props.uri) {
            if (this.session) window.Web3Bridge.endSession(this.session);
            else this.onEnd();
        }
    }

    componentWillUnmount() {
        this.mounted = false;
        clearInterval(this.interval);
        clearTimeout(this.timeout);
        if (this.session) window.Web3Bridge.endSession(this.session);
    }

    onEnd = () => {
        clearInterval(this.interval);
        clearTimeout(this.timeout);
        this.session = null;
        this.loaded = false;
        if (this.mounted) this.setState({approved: false});
    };

    onConnect = () => {
        const url = getDAppUrl(this.props.uri);
        if (!url || this.state.approved) return;
        this.setState({approved: true, error: null}, () => {
            this.session = window.Web3Bridge.startSession(this.frameRef.current, url.href, this.onEnd);
            if (!this.session) {
                this.onEnd();
                this.setState({error: 'This wallet network does not support dApp connections. Close this dialog and select a supported network.'});
                return;
            }
            window.Web3Bridge.sendConfig(this.session);
            this.interval = setInterval(() => window.Web3Bridge.sendConfig(this.session), 50);
            this.timeout = setTimeout(() => clearInterval(this.interval), 15000);
        });
    };

    onLoad = () => {
        // A new iframe document requires fresh consent. Cross-origin redirects
        // never receive config because postMessage targets the approved origin.
        if (this.loaded) return window.Web3Bridge.endSession(this.session);
        this.loaded = true;
        window.Web3Bridge.sendConfig(this.session);
        clearTimeout(this.timeout);
        this.timeout = setTimeout(() => clearInterval(this.interval), 2000);
    };

    onClose = () => {
        if (this.session) window.Web3Bridge.endSession(this.session);
        this.props.dispatch(hideModal());
        this.props.dispatch(updateAccountBalances());
    };

    render() {
        const url = getDAppUrl(this.props.uri);
        if (!url || !this.state.approved) {
            return <Modal closeable={false}>
                <div className="TxConfirmationModal DAppApproval">
                    <div className="ModalTitle">{url && !this.state.error ? 'Connect to Website' : 'Unable to Connect'}</div>
                    {url ? <>
                        <DAppOrigin origin={url.origin}/>
                        <p>{this.state.error || 'This website will see your wallet address and can request signatures and transactions. Each request requires your approval.'}</p>
                    </> : <p>This website does not have a supported HTTPS address.</p>}
                    <div className="TxConfirmationModal__footer">
                        <FlatButton title="Cancel" onClick={this.onClose} borderless centered/>
                        {url && !this.state.error && <GradientButton title="Connect" onClick={this.onConnect}/>}
                    </div>
                </div>
            </Modal>;
        }
        return <Modal closeable={false}>
            <div className={`DAppModal DAppModal--size-${window.dappWindowSize}`}>
                <div className="DAppTitleBar">
                    <div className="DAppTitleBar__address"><div>{url.origin}</div></div>
                    <a className="DAppTitleBar__close-button" onClick={this.onClose} aria-label="Disconnect website">
                        <img src={dappCloseIcon} alt="Disconnect"/>
                    </a>
                </div>
                <iframe title="Connected website" src={url.href} ref={this.frameRef} onLoad={this.onLoad}/>
            </div>
        </Modal>;
    }
}

export default connect()(DAppModal);
