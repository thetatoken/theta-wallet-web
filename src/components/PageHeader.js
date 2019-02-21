import React from "react";
import './PageHeader.css';

class PageHeader extends React.Component {
    render() {
        return (
            <div className="PageHeader">
                <div className="PageHeader__title">
                    {this.props.title}
                </div>
            </div>
        );
    }
}

export default PageHeader;
