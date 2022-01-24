import React, {Component} from 'react';
import './App.css';
import NavBar from './components/NavBar'
import TabBar from './components/TabBar'
import TabBarItem from './components/TabBarItem'
import {Pages, WalletPages} from './Pages'
import Modals from "./components/Modals";
import {showModal} from "./state/actions/ui";
import ModalTypes from "./constants/ModalTypes";
import {store} from "./state";
import Router from "./services/Router";
import UnsupportedDevice from './components/UnsupportedDevice'
import Wallet from "./services/Wallet";
import {isStakingAvailable, areSmartContractsAvailable} from './Flags';
import LoadingOverlay from "./components/LoadingOverlay";
import {connect} from "react-redux";

class WalletTabBar extends Component {
    constructor() {
        super();

        this.onSendClick = this.onSendClick.bind(this);
        this.onReceiveClick = this.onReceiveClick.bind(this);
    }

    onSendClick() {
        // store.dispatch(showModal({
        //     type: ModalTypes.SEND,
        // }));

        store.dispatch(showModal({
            type: ModalTypes.CREATE_TRANSACTION,
            props: {
                transactionType: 'send'
            }
        }));
    }

    onReceiveClick() {
        store.dispatch(showModal({
            type: ModalTypes.RECEIVE,
        }));
    }


    render() {

        return (
            <TabBar>
                <TabBarItem
                    title="Wallet"
                    href="/wallet/tokens"
                    normalIconUrl="/img/tab-bar/wallet@2x.png"
                    activeIconUrl="/img/tab-bar/wallet-active@2x.png"
                />
                <TabBarItem
                    title="Send"
                    onClick={this.onSendClick}
                    normalIconUrl="/img/tab-bar/send@2x.png"
                    activeIconUrl="/img/tab-bar/send-active@2x.png"
                />
                <TabBarItem
                    title="Receive"
                    onClick={this.onReceiveClick}
                    normalIconUrl="/img/tab-bar/receive@2x.png"
                    activeIconUrl="/img/tab-bar/receive-active@2x.png"
                />
                {
                    isStakingAvailable() &&
                    <TabBarItem
                        title="Stakes"
                        href="/wallet/stakes"
                        normalIconUrl="/img/tab-bar/stakes@2x.png"
                        activeIconUrl="/img/tab-bar/stakes-active@2x.png"
                    />
                }
                {
                    areSmartContractsAvailable() &&
                    <TabBarItem
                        title="Contract"
                        href="/wallet/contract"
                        normalIconUrl="/img/tab-bar/contract@2x.png"
                        activeIconUrl="/img/tab-bar/contract-active@2x.png"
                    />
                }

                <TabBarItem
                    title="Settings"
                    href="/wallet/settings"
                    normalIconUrl="/img/tab-bar/settings@2x.png"
                    activeIconUrl="/img/tab-bar/settings-active@2x.png"
                />
            </TabBar>
        );
    }
}

const mapStateToProps = (state) => {
    return {
        isLoading: state.ui.isLoading,
        loadingMessage: state.ui.loadingMessage,
    };
};

export class UnconnectedApp extends Component {
    componentDidMount() {
        Router.setHistory(this.props.history);
    }

    render() {
        let {isLoading, loadingMessage} = this.props;
        let address = Wallet.getWalletAddress();

        return (
            <div className="App">
                {isLoading && <LoadingOverlay loadingMessage={loadingMessage} />}
                <NavBar centered={address === null}/>
                <Pages/>
                <Modals/>
                <UnsupportedDevice/>
            </div>
        );
    }
}
export const App = connect(mapStateToProps, null)(UnconnectedApp);


export class UnconnectedWalletApp extends Component {
    componentDidMount() {
        Router.setHistory(this.props.history);
    }

    render() {
        let {isLoading, loadingMessage} = this.props;

        return (
            <div className="App WalletApp">
                {isLoading && <LoadingOverlay loadingMessage={loadingMessage} />}
                <NavBar/>
                <WalletTabBar/>
                <WalletPages/>
                <Modals/>
                <UnsupportedDevice/>
            </div>
        );
    }
}
export const WalletApp = connect(mapStateToProps, null)(UnconnectedWalletApp);

