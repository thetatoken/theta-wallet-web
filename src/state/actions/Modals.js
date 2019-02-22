import {SHOW_MODAL, HIDE_MODAL, HIDE_MODALS} from "../types/Modals";

export function showModal(modal){
    return {
        type: SHOW_MODAL,
        modal: modal
    }
}

export function hideModal(){
    return {
        type: HIDE_MODAL
    }
}

export function hideModals(){
    return {
        type: HIDE_MODALS
    }
}