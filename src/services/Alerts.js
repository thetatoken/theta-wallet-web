import React from 'react';

export default class Alerts {
    static _reactAlertRef = React.createRef();

    static getRef(){
        return this._reactAlertRef;
    }

    static _show(type, message){
        let reactAlert = Alerts.getRef().current;
        console.log('reactAlert == ');
        console.log(reactAlert);
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
        if(message == "Please enable Contract data on the Ethereum app Settings"){
            message = "Please enable Contract data and disable Display data on the Ethereum app Settings"
        }
        this._show('error', message);
    }
}