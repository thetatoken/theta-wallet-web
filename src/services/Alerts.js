import React from 'react';

export default class Alerts {
    static _reactAlertRef = React.createRef();

    static getRef(){
        return this._reactAlertRef;
    }

    static _show(type, message){
        let reactAlert = Alerts.getRef().current;
        let showFn = reactAlert[type];

        showFn(message);
    }

    static showInfo(message){
        this._show('info', message);
    }

    static showSuccess(message){
        this._show('success', message);
    }

    static showError(message){
        this._show('error', message);
    }
}