import React from "react";
import './SettingsPage.css';
import PageHeader from "../components/PageHeader";
import EmptyState from '../components/EmptyState'

class SettingsPage extends React.Component {
    render() {
        return (
            <div className="SettingsPage">
                <div className="SettingsPage__detail-view">
                    <PageHeader title="Settings"
                                sticky={true}
                    />
                    <EmptyState title="TODO: Figure out what is needed"/>

                </div>
            </div>
        );
    }
}

export default SettingsPage;
