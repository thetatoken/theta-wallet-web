
export default class Router {
    static _history = null;

    static setHistory(history){
        this._history = history;
    }

    static push(path){
        return this._history.push(path);
    }
}