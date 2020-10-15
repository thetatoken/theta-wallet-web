import _ from 'lodash';

/**
 * Returns a new object with vals mapped to keys
 * @param {Array} keys
 * @param {Array} vals
 * @return {Object}
 */
export function zipMap(keys, vals){
    return Object.assign({}, ...keys.map((key, index) => ({[key]: vals[index]})));
}

export function trimWhitespaceAndNewlines(str){
    return str.trim().replace(new RegExp('\s?\r?\n','g'), '')
}

export function hasValidDecimalPlaces(str, maxDecimalPlaces){
    if(str === null){
        return true;
    }

    //Ensure it is a string
    var ensureStr = '' + str;

    var decimalSplit = ensureStr.split('.');

    if(decimalSplit.length > 0){
        var decimals = decimalSplit[decimalSplit.length - 1];

        return (decimals.length <= maxDecimalPlaces);
    }
    return true;
}

export function downloadFile(filename, contents){
    let element = document.createElement('a');

    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(contents));
    element.setAttribute('download', filename);
    element.style.display = 'none';

    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

export function copyToClipboard(str){
    //https://gist.githubusercontent.com/Chalarangelo/4ff1e8c0ec03d9294628efbae49216db/raw/cbd2d8877d4c5f2678ae1e6bb7cb903205e5eacc/copyToClipboard.js

    const el = document.createElement('textarea');  // Create a <textarea> element
    el.value = str;                                 // Set its value to the string that you want copied
    el.setAttribute('readonly', '');                // Make it readonly to be tamper-proof
    el.style.position = 'absolute';
    el.style.left = '-9999px';                      // Move outside the screen to make it invisible
    document.body.appendChild(el);                  // Append the <textarea> element to the HTML document
    const selected =
        document.getSelection().rangeCount > 0        // Check if there is any content selected previously
            ? document.getSelection().getRangeAt(0)     // Store selection if found
            : false;                                    // Mark as false to know no selection existed before
    el.select();                                    // Select the <textarea> content
    document.execCommand('copy');                   // Copy - only works as a result of a user action (e.g. click events)
    document.body.removeChild(el);                  // Remove the <textarea> element
    if (selected) {                                 // If a selection existed before copying
        document.getSelection().removeAllRanges();    // Unselect everything on the HTML document
        document.getSelection().addRange(selected);   // Restore the original selection
    }
}

export function onLine(){
    let online = true;

    try {
        online = window.navigator.onLine;
    }
    catch (e) {
        online = true;
    }

    return online;
}

export function truncate(fullStr, strLen, separator) {
    if(!fullStr){
        return fullStr;
    }

    if (fullStr.length <= strLen) return fullStr;

    separator = separator || '...';

    var sepLen = separator.length,
        charsToShow = strLen - sepLen,
        frontChars = Math.ceil(charsToShow/2),
        backChars = Math.floor(charsToShow/2);

    return fullStr.substr(0, frontChars) +
        separator +
        fullStr.substr(fullStr.length - backChars);
}

export function numberWithCommas(x) {
    var parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
}

export function getQueryParameters(str) {
    const searchStr = (str || document.location.search);

    if(_.isNil(searchStr) || searchStr.length === 0){
        return {};
    }
    else{
        return searchStr.replace(/(^\?)/,'').split("&").map(function(n){return n = n.split("="),this[n[0]] = n[1],this}.bind({}))[0];
    }
}
