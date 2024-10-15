import React, {Fragment} from 'react';
import {connect} from 'react-redux';
import FlatButton from "../components/buttons/FlatButton";
import Modal from "../components/Modal";
import dappCloseIcon from '../img/icons/close-dapp@2x.png';
import {hideModal} from "../state/actions/ui";
import {updateAccountBalances} from "../state/actions/Wallet";

const classNames = require('classnames');

export class DAppModal extends React.Component {
    constructor() {
        super();

        this.frameRef = React.createRef();
    }

    sendConfigAndStartInterval = () => {
        window.Web3Bridge.sendConfig()
        this.interval = setInterval(() => {
            window.Web3Bridge.sendConfig();
        }, 10);
        window.Web3Bridge.sendConfig()
    }

    componentDidMount() {
        window.Web3Bridge.targetFrame = this.frameRef.current;
        window.Web3Bridge.targetOrigin = (new URL(this.props.uri)).origin;
        this.sendConfigAndStartInterval();
    }

    componentWillUnmount() {
        if(this.interval){
            clearInterval(this.interval);
        }
        window.Web3Bridge.endSession();
    }

    onClose = () => {
        this.props.dispatch(hideModal());

        // Update balances
        this.props.dispatch(updateAccountBalances());
    }

    render() {
        let {uri} = this.props;

        return (
            <Fragment>
                {/*<div className={'DAppModal__warning'}>*/}
                {/*    Ensure that you trust this website before interacting with it.*/}
                {/*</div>*/}
                <Modal closeable={false}>
                <div className={classNames('DAppModal', {
                    [`DAppModal--size-${window.dappWindowSize}`]: true,
                })}>
                    <div className="DAppTitleBar">
                        <div className={'DAppTitleBar__address'}>
                            <div>
                                {uri}
                            </div>
                        </div>
                        <a className={'DAppTitleBar__close-button'}
                            onClick={this.onClose}
                        >
                            <img src={dappCloseIcon}/>
                        </a>
                    </div>
                    <iframe src={uri}
                            ref={this.frameRef}
                            onLoad={() => {
                                console.log('onLoad!!!!!!!!!!!!');
                                if(!this.interval) {
                                    this.sendConfigAndStartInterval();
                                }
                                // It's loaded, we can stop pushing the config
                                setTimeout(() => {
                                    clearInterval(this.interval);
                                    this.interval = null;
                                }, 2000);
                            }}
                    />
                </div>
                    </Modal>
            </Fragment>
        );
    }
}

const mapStateToProps = (state, props) => {
    const {thetaWallet} = state;
    const {selectedAddress} = thetaWallet;
    const chainId = thetaWallet.network?.chainId;

    return {
        ...props,
        selectedAddress,
        chainId
    };
};

export default connect(mapStateToProps)(DAppModal);
