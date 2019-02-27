import React from 'react';

export default class Alerts {
    static _reactAlertRef = null;

    static getRef(){
        if(!this._reactAlertRef){
            this._reactAlertRef = React.createRef();
        }
        return this._reactAlertRef;
    }

    static getReactAlert(){
        return Alerts.getRef().current;
    }

    static _show(type, message){
        let reactAlert = Alerts.getReactAlert();
        let showFn = reactAlert[type];

        showFn(message);
    }

    static showInfo(message){
        Alerts._show('info', message);
    }

    static showSuccess(message){
        Alerts._show('success', message);
    }

    static showError(message){
        Alerts._show('error', message);
    }
}