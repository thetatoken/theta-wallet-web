import {store} from "../state";
import {showModal} from "../state/actions/ui";
import ModalTypes from "../constants/ModalTypes";
import React from "react";

const supportedActions = new Set([
    "open_dapp"
]);

const CTABanner = ({spec}) => {
    const {title, description, button_title, action, styles, platforms} = spec;

    const handleClick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (action === 'open_dapp') {
            store.dispatch(showModal({
                type: ModalTypes.DAPP,
                props: {
                    uri: 'https://elite-booster.thetatoken.org',
                    closeable: false
                }
            }));
        }
    }

    const isSupported = () => {
        return supportedActions.has(action) && platforms.includes('web');
    }

    if (!isSupported()) {
        return null;
    }

    return (
        <a className={'CTABanner'}
           style={{
               backgroundColor: styles?.container?.background_color,
           }}
           onClick={handleClick}
        >
            <div className={'CTABanner__title'}
                 style={{
                     color: styles?.title?.color,
                 }}>
                {title}
            </div>
            <div className={'CTABanner__description'}
                 style={{
                     color: styles?.description?.color,
                 }}>
                {description}
            </div>
            <div className={'CTABanner__button'}
                 style={{
                     backgroundColor: styles?.button?.background_color,
                     color: styles?.button?.color,
                 }}>
                {button_title}
            </div>
        </a>
    );
}
export default CTABanner;