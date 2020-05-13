import _ from 'lodash';
import React from "react";
import {connect} from 'react-redux'
import './ContractPage.css';
import GradientButton from "../components/buttons/GradientButton";
import TabBarItem from "../components/TabBarItem";
import TabBar from "../components/TabBar";
import ContractModes from "../constants/ContractModes";
import Web3 from "web3";
import { useForm } from 'react-hook-form';

const web3 = new Web3("http://localhost");



function initContract(abiStr, address){
    try {
        console.log("initContract :: abiStr == ");
        console.log(abiStr);

        const abiJSON = JSON.parse(abiStr);

        return new web3.eth.Contract(abiJSON, address);
    }
    catch (e) {
        console.log("Caught!");
        console.log(e);
        return null;
    }
}

function DeployContractFormExample(props) {
    const {onSubmit} = props;
    const { register, handleSubmit, errors } = useForm();

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <input name="firstname" ref={register} /> {/* register an input */}

            <input name="lastname" ref={register({ required: true })} />
            {errors.lastname && 'Last name is required.'}

            <input name="age" ref={register({ pattern: /\d+/ })} />
            {errors.age && 'Please enter number for age.'}

            <input type="submit" />
        </form>
    );
}

function parseJSON(value){
    try {
        const json = JSON.parse(value);

        return json;
    }
    catch (e) {
        return null;
    }
}

function isValidByteCode(value){
    const json = parseJSON(value);

    console.log("isValidByteCode :: json ddddddddfddddddWOOF== " + json);
    return (_.isNil((json && json['object'])) === false);
}

function isValidABI(value){
    const json = parseJSON(value);

    try{
        return (_.isNil((json && (new web3.eth.Contract(json, null)))) === false);
    }
    catch (e) {
        return false;
    }
}

function DeployContractForm(props) {
    const {onSubmit} = props;
    const { register, handleSubmit, errors, watch } = useForm(); // initialise the hook
    const abi = watch("abi");

    console.log("abi == " + abi);
    //TODO parse the abi and find the constructor!...loop over the constructor inputs to build inputs!

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <div className="InputTitle">Byte Code</div>
            <textarea className="RoundedInput"
                      placeholder="Enter byte code"
                      name="byteCode"
                      ref={register({
                          required: true,
                          validate: isValidByteCode
                      })}
            />
            {errors.byteCode && <div className="InputError">Please enter valid Byte Code.</div>}

            <div className="InputTitle">ABI/JSON Interface</div>
            <textarea className="RoundedInput"
                      placeholder="Enter ABI/JSON interface"
                      name="abi"
                      ref={register({
                          required: true,
                          validate: isValidABI
                      })}
            />
            {errors.abi && <div className="InputError">Please enter a valid ABI/JSON Interface.</div>}



            <div className="InputTitle">Contract Name</div>
            <input className="RoundedInput"
                   placeholder="Enter contract name"
                   name="name"
                   ref={register({ required: false })}
            />

            <GradientButton title="Deploy Contract"
                            style={{marginTop: 15}}
                            // loading={this.state.loading}
                            // disabled={(this.state.loading)}
                            onClick={handleSubmit(onSubmit)}
            />
        </form>
    );
}

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

            contract: null
        };

        this.state = this.defaultState;
    }

    handleChange = (event) => {
        let name = event.target.name;
        let value = event.target.value;

        this.setState({[name]: value}, this.validate);
    };

    validate = () => {
        const {abi, byteCode, name} = this.state;

        if(_.isEmpty(abi) === false){
            const contract = initContract(abi, null);

            window.MYYcontract = contract;

            if(contract){
                this.setState({
                    contract: contract
                });
            }
        }
    };

    render() {
        return (
            <div className="DeployContractContent">
                <DeployContractForm onSubmit={(formData)=>{
                    console.log("Submitted...");
                    console.log(formData);
                }}/>

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
