import React from "react";
import './SettingsPage.css';
import PageHeader from "../components/PageHeader";

class SettingsPage extends React.Component {
    render() {
        return (
            <div className="SettingsPage">
                <div className="SettingsPage__detail-view">
                    <PageHeader title="Settings"
                                sticky={true}
                    />
                </div>
            </div>
        );
    }
}

export default SettingsPage;
