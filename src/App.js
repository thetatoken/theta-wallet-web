import React, {Component} from 'react';
import './App.css';
import NavBar from './components/NavBar'
import TabBar from './components/TabBar'
import TabBarItem from './components/TabBarItem'
import {Pages, WalletPages} from './Pages'
import Modals from "./components/Modals";

class WalletTabBar extends Component {
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
                    onClick={function(){}}
                    normalIconUrl="/img/tab-bar/send@2x.png"
                    activeIconUrl="/img/tab-bar/send-active@2x.png"
                />
                <TabBarItem
                    title="Receive"
                    onClick={function(){}}
                    normalIconUrl="/img/tab-bar/receive@2x.png"
                    activeIconUrl="/img/tab-bar/receive-active@2x.png"
                />
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

export class App extends Component {
    render() {
        return (
            <div className="App">
                <NavBar centered={true}/>
                <Pages/>
                <Modals/>
            </div>
        );
    }
}

export class WalletApp extends Component {
    render() {
        return (
            <div className="App WalletApp">
                <NavBar/>
                <WalletTabBar/>
                <WalletPages/>
                <Modals/>
            </div>
        );
    }
}