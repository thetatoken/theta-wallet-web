import _ from "lodash";
import React, { useState, useEffect } from 'react';

export const ProjectInfoCard = ({metadata, chainInfo}) => {
    console.log('ProjectInfoCard :: metadata == ');
    console.log(metadata);
    console.log('ProjectInfoCard :: chainInfo == ');
    console.log(chainInfo);
    let {name, hostname, icon, icons} = metadata;


    return (
        <div className={'ProjectInfoCard'}>
            <img className={'ProjectInfoCard__icon'} src={icon || _.first(icons)}/>
            <div className={'ProjectInfoCard__container'}>
                {hostname
                    ? <div className={'ProjectInfoCard__url'}>{hostname}</div>
                    : <div className={'ProjectInfoCard__name'}>{name}</div>}
            </div>
            {
                chainInfo.name &&
                <div className={'ProjectInfoCard__chain'}>{chainInfo.name}</div>
            }
        </div>
    )
}