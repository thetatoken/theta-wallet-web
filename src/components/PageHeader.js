import React from "react";
import './PageHeader.css';

const classNames = require('classnames');

class PageHeader extends React.Component {
    render() {
        let className = classNames("PageHeader", {
            [this.props.className]: true,
            "PageHeader--is-sticky": this.props.sticky
        });

        return (
            <div className={className}>
                {
                    this.props.title &&
                    <div className="PageHeader__title">
                        {this.props.title}
                    </div>
                }
                {this.props.children}
            </div>
        );
    }
}

export default PageHeader;
