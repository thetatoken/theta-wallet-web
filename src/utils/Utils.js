
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

    var decimalSplit = str.split('.');

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