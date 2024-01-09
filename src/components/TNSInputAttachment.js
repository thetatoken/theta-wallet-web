import React from 'react';
import MDSpinner from "react-md-spinner";
import _ from 'lodash';

const classNames = require("classnames");

const TNSInputAttachment = ({isTns, isTnsLoading, tnsAddress, tnsName}) => {
    if(!isTnsLoading && (_.isEmpty(tnsAddress) && _.isEmpty(tnsName))){
        return null;
    }

    return (
        <div className={classNames('InputAttachment TNSInputAttachment', {
            'TNSInputAttachment--is-loading': isTnsLoading
        })}>
            {
                isTnsLoading && <>
                    <MDSpinner singleColor="#1BDED0" size={18} className={'TNSInputAttachment__spinner'}/>
                    <p className='TNSInputAttachment__loading-message'>Resolving...</p>
                </>
            }
            {(tnsName || tnsAddress) && <>
                <p className='TNSInputAttachment__title'>{isTns ? "Address:" : "TNS:"}</p>
                <p className='TNSInputAttachment__content'>{isTns ? tnsAddress : tnsName}</p>
            </>}
        </div>
    )};

export default TNSInputAttachment;