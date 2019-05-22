import _ from 'lodash';
import React from "react";
import './SettingsPage.css';
import PageHeader from "../components/PageHeader";
import GradientButton from "../components/buttons/GradientButton";
import Wallet from '../services/Wallet';
import {downloadFile} from "../utils/Utils";
import Alerts from '../services/Alerts';

class ExportKeystoreContent extends React.Component {
    constructor(){
        super();

        this.defaultState = {
            currentPassword: '',
            password: '',
            passwordConfirmation:  '',

            loading: false,

            error: null
        };

        this.state = this.defaultState;

        this.handleChange = this.handleChange.bind(this);
        this.prepareForExport = this.prepareForExport.bind(this);
        this.exportKeystore = this.exportKeystore.bind(this);
    }

    validate(){
        if(this.state.password.length > 0 &&
            this.state.passwordConfirmation.length > 0 &&
            this.state.password !== this.state.passwordConfirmation){
            this.setState({error: "Your passwords do not match"});
        }
        else{
            this.setState({error: ""});
        }
    }

    isValid(){
        return (this.state.password.length > 0 &&
            this.state.passwordConfirmation.length > 0 &&
            this.state.password === this.state.passwordConfirmation);
    }

    handleChange(event) {
        let name = event.target.name;
        let value = event.target.value;

        this.setState({[name]: value}, this.validate);
    }

    exportKeystore(){
        try {
            let keystore = Wallet.exportKeystore(this.state.currentPassword, this.state.password);

            downloadFile(keystore.address + '.keystore', JSON.stringify(keystore));

            this.setState(this.defaultState);
        }
        catch (e) {
            this.setState({
                loading: false
            });

            Alerts.showError(e.message);
        }

    }

    prepareForExport(){
        this.setState({
            loading: true
        });

        setTimeout(this.exportKeystore, 1000);
    }

    render() {
        return (
            <div className="ExportKeystoreContent">
                <div className="InputTitle">Current Password</div>
                <input className="RoundedInput"
                       placeholder="Enter current password"
                       name="currentPassword"
                       type="password"
                       value={this.state.currentPassword}
                       onChange={this.handleChange}
                />
                <div className="InputTitle">New Password</div>
                <input className="RoundedInput"
                       placeholder="Set a New Password"
                       name="password"
                       type="password"
                       value={this.state.password}
                       onChange={this.handleChange}
                />
                <div className="InputTitle">Confirm New Password</div>
                <input className="RoundedInput"
                       placeholder="Re-enter Password"
                       name="passwordConfirmation"
                       type="password"
                       value={this.state.passwordConfirmation}
                       onChange={this.handleChange}
                />
                <div className="InputError">
                    {this.state.error}
                </div>

                <GradientButton title="Export Keystore"
                                onClick={this.prepareForExport}
                                style={{marginTop: 15}}
                                loading={this.state.loading}
                                disabled={(this.state.loading || this.isValid() === false)}
                />
            </div>
        );
    }
}

class SettingsSection extends React.Component {
    render() {
        return (
            <div className="SettingsSection">
                <div className="SettingsSection__title">
                    {this.props.title}
                </div>

                <div className="SettingsSection__content">
                    { this.props.children }
                </div>
            </div>
        );
    }
}

class SettingsPage extends React.Component {
    render() {
        let canExport = _.isNil(Wallet.getWallet().hardware);

        return (
            <div className="SettingsPage">
                <div className="SettingsPage__detail-view">
                    <PageHeader title="Settings"
                                sticky={true}
                    />

                    {
                        canExport &&
                        <SettingsSection title="Export Keystore">
                            <ExportKeystoreContent/>
                        </SettingsSection>
                    }
                </div>
            </div>
        );
    }
}

export default SettingsPage;
