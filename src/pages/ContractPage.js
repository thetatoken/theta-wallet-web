import _ from 'lodash';
import React from "react";
import {connect} from 'react-redux'
import './ContractPage.css';
import GradientButton from "../components/buttons/GradientButton";
import TabBarItem from "../components/TabBarItem";
import TabBar from "../components/TabBar";
import ContractModes from "../constants/ContractModes";
import Web3 from "web3";

class InteractWithContractContent extends React.Component {
    constructor(){
        super();

        this.defaultState = {
            address: '',
            abi: '',

            formErrors: {

            },

            loading: false,
        };

        this.state = this.defaultState;
    }

    handleChange = (event) => {
        let name = event.target.name;
        let value = event.target.value;

        this.setState({[name]: value}, this.validate);
    };

    validate = () => {

    };

    initContract = () => {
        const {abi, address} = this.state;
        const web3 = new Web3("http://localhost");

        const thetaContract = new web3.eth.Contract(abi, address);

        //For testing :)
        let data = thetaContract.methods.SetValue(3).encodeABI();
        console.log("data == " + data);
        console.log("thetaContract.methods['SetValue'](3) == " + thetaContract.methods['SetValue'](3));
        window.MYContract = thetaContract;
    };

    render() {
        return (
            <div className="InteractWithContractContent">
                <div className="InputTitle">Contract Address</div>
                <input className="RoundedInput"
                       placeholder="Enter contract address"
                       name="address"
                       value={this.state.address}
                       onChange={this.handleChange}
                />

                <div className="InputTitle">ABI/JSON Interface</div>
                <textarea className="RoundedInput"
                          placeholder="Enter ABI/JSON interface"
                          name="abi"
                          value={this.state.abi}
                          onChange={this.handleChange}
                />

                <GradientButton title="Continue"
                                style={{marginTop: 15}}
                                loading={this.state.loading}
                                disabled={(this.state.loading)}
                />
            </div>
        );
    }
}

class DeployContractContent extends React.Component {
    constructor(){
        super();

        this.defaultState = {
            byteCode: '',
            abi: '',
            name:  '',

            formErrors: {

            },

            loading: false,
        };

        this.state = this.defaultState;
    }

    handleChange = (event) => {
        let name = event.target.name;
        let value = event.target.value;

        this.setState({[name]: value}, this.validate);
    };

    validate = () => {

    };

    render() {
        return (
            <div className="DeployContractContent">
                <div className="InputTitle">Byte Code</div>
                <textarea className="RoundedInput"
                       placeholder="Enter byte code"
                       name="byteCode"
                       value={this.state.byteCode}
                       onChange={this.handleChange}
                />

                <div className="InputTitle">ABI/JSON Interface</div>
                <textarea className="RoundedInput"
                          placeholder="Enter ABI/JSON interface"
                          name="abi"
                          value={this.state.abi}
                          onChange={this.handleChange}
                />

                <div className="InputTitle">Contract Name</div>
                <input className="RoundedInput"
                       placeholder="Enter contract name"
                       name="name"
                       value={this.state.name}
                       onChange={this.handleChange}
                />

                <GradientButton title="Deploy Contract"
                                style={{marginTop: 15}}
                                loading={this.state.loading}
                                disabled={(this.state.loading)}
                />
            </div>
        );
    }
}

class ContractPage extends React.Component {
    render() {
        let contractMode = this.props.match.params.contractMode;

        return (
            <div className="ContractPage">
                <div className="ContractPage__detail-view">
                    <TabBar centered={true}
                            condensed={false}>
                        <TabBarItem
                            title="Deploy Contract"
                            href={"/wallet/contract/" + ContractModes.DEPLOY}
                        />
                        <TabBarItem
                            title="Interact with Contract"
                            href={"/wallet/contract/" + ContractModes.INTERACT}
                        />
                    </TabBar>
                    {
                        (contractMode === ContractModes.DEPLOY) &&
                        <DeployContractContent/>
                    }
                    {
                        (contractMode === ContractModes.INTERACT) &&
                        <InteractWithContractContent/>
                    }
                </div>
            </div>
        );
    }
}

const mapStateToProps = state => {
    return {

    };
};

export default connect(mapStateToProps)(ContractPage);
