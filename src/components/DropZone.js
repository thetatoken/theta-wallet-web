import React from 'react';
import './DropZone.css'

const classNames = require('classnames');

export default class DropZone extends React.PureComponent {
    constructor(){
        super();

        this.state = {
            active: false
        };

        this.handleDragOver = this.handleDragOver.bind(this);
        this.handleDragEnter = this.handleDragEnter.bind(this);
        this.handleDragLeave = this.handleDragLeave.bind(this);
        this.handleDrop = this.handleDrop.bind(this);
    }

    handleDragOver(e){
        e.preventDefault();

        this.setState({active: true});
    }

    handleDragEnter(e){
        e.preventDefault();

        this.setState({active: true});
    }

    handleDragLeave(e){
        e.preventDefault();

        this.setState({active: false});
    }

    handleDrop(e){
        e.preventDefault();

        let files = e.dataTransfer.files;

        if(files.length > 0){
            this.props.onDrop(files[0]);
        }

        this.setState({active: false});
    }

    componentDidMount(){
        window.addEventListener("dragenter", this.handleDragEnter);
        window.addEventListener("dragleave", this.handleDragLeave);
        window.addEventListener("dragover", this.handleDragOver);
        window.addEventListener("drop", this.handleDrop);
    }

    componentWillUnmount(){
        window.removeEventListener("dragenter", this.handleDragEnter);
        window.removeEventListener("dragleave", this.handleDragLeave);
        window.removeEventListener("dragover", this.handleDragOver);
        window.removeEventListener("drop", this.handleDrop);
    }

    render() {
        let className = classNames("DropZone", { 'DropZone--is-active': this.state.active });

        return (
            <div className={className}>
                {
                    this.props.icon &&
                    <img className="DropZone__icon"
                         src={this.props.icon}/>
                }
                <div className="DropZone__title">{this.props.title}</div>
            </div>
        );
    }
}