import {BigNumber} from 'bignumber.js';
import _ from 'lodash';
import React, {Fragment} from "react";
import {connect} from 'react-redux'
import './ContractPage.css';
import GradientButton from "../components/buttons/GradientButton";
import TabBarItem from "../components/TabBarItem";
import TabBar from "../components/TabBar";
import ContractModes from "../constants/ContractModes";
import Web3 from "web3";
import {useForm} from 'react-hook-form';
import Theta from "../services/Theta";
import Wallet from "../services/Wallet";
import ThetaJS from "../libs/thetajs.esm";

const web3 = new Web3("http://localhost");


function initContract(abiStr, address) {
    try {
        const abiJSON = parseJSON(abiStr);

        return new web3.eth.Contract(abiJSON, address);
    } catch (e) {
        return null;
    }
}

function parseJSON(value) {
    try {
        const json = JSON.parse(value);

        return json;
    } catch (e) {
        return null;
    }
}

function isValidByteCode(value) {
    const json = parseJSON(value);

    return (_.isNil((json && json['object'])) === false);
}

function validateByteCode(value){
    return (isValidByteCode(value) || "Invalid byte code");
}

function isValidABI(value) {
    const json = parseJSON(value);

    try {
        return (_.isNil((json && (new web3.eth.Contract(json, null)))) === false);
    } catch (e) {
        return false;
    }
}

function validateABI(value){
    return (isValidABI(value) || "Invalid ABI/JSON interface");
}

function validateInput(type, value){
    try {
        return _.isNil(web3.eth.abi.encodeParameter(type, JSON.parse(value))) === false;
    }
    catch (e) {
        return "Invalid value for type of " + type;
    }
}

function getConstructor(jsonInterface) {
    const constructors = _.filter(jsonInterface, function (o) {
        return (o.type === "constructor");
    });

    return _.first(constructors);
}

function DeployContractForm(props) {
    const {onSubmit} = props;
    const {register, handleSubmit, errors, watch} = useForm({
        mode: 'onChange',
    });
    const abi = watch("abi");
    const contract = initContract(abi, null);
    const jsonInterface = _.get(contract, ['options', 'jsonInterface']);
    const constructor = getConstructor(jsonInterface);
    const constructorInputs = _.get(constructor, ['inputs'], []);

    window.contract = contract;

    return (
        <form onSubmit={handleSubmit(onSubmit)}>

            {/*Byte Code Section*/}
            <div className="FormSectionTitle">Byte Code</div>
            <textarea className="RoundedInput"
                      placeholder="Paste byte code"
                      name="byteCode"
                      ref={register({
                          required: "Contract byte code is required.",
                          validate: validateByteCode
                      })}
            />
            {errors.byteCode && <div className="InputError">{errors.byteCode.message}</div>}


            {/*ABI/JSON Interface Section*/}
            <div className="FormSectionTitle">ABI/JSON Interface</div>
            <textarea className="RoundedInput"
                      placeholder="Paste ABI/JSON interface"
                      name="abi"
                      ref={register({
                          required: "Contract ABI/JSON interface is required.",
                          validate: validateABI
                      })}
            />
            {errors.abi && <div className="InputError">{errors.abi.message}</div>}


            {/*Constructor Inputs Section*/}
            {
                constructorInputs.length > 0 &&
                    <div className="FormSectionTitle">Constructor Inputs</div>
            }
            {
                constructorInputs.map((value, index) => {
                    const {name, type} = value;
                    return (
                        <Fragment key={name}>
                            <div className="InputTitle">{name + " (" + type +")"}</div>
                            <input className="RoundedInput"
                                   placeholder={"Enter " + name}
                                   name={"inputs." + name}
                                   ref={register({
                                       required: "Input " + name + " is required",
                                       validate: (val) => {
                                           return validateInput(type, val)
                                       }
                                   })}
                            />
                            {_.get(errors, ['inputs', name]) && <div className="InputError">{_.get(errors, ['inputs', name, 'message'])}</div>}
                        </Fragment>
                    );
                })
            }


            {/*Contract Name Section*/}
            <div className="FormSectionTitle">Contract Name</div>
            <input className="RoundedInput"
                   placeholder="Enter contract name"
                   name="name"
                   ref={register({required: false})}
            />


            <GradientButton title="Deploy Contract"
                            style={{marginTop: 15}}
                            disabled={(_.size(errors) > 0)}
                            onClick={handleSubmit(onSubmit)}
            />
        </form>
    );
}

class InteractWithContractContent extends React.Component {
    constructor() {
        super();

        this.defaultState = {
            address: '',
            abi: '',

            formErrors: {},

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
    constructor() {
        super();

        this.defaultState = {
            loading: false,
        };

        this.state = this.defaultState;
    }

    onSubmit = (formData) => {
        console.log("Submitted...");
        console.log(formData);

        //TODO create the Tx and open the confirm modal
        const {abi, byteCode, inputs} = formData;
        const byteCodeJson = parseJSON(byteCode);
        const contract = initContract(abi, null);
        const jsonInterface = _.get(contract, ['options', 'jsonInterface']);
        const constructor = getConstructor(jsonInterface);
        const constructorInputs = _.get(constructor, ['inputs'], []);

        const encodedInputs = _.map(constructorInputs, ({name, type}) => {
            //TODO might need to JSON.parse inputs.name
            return web3.eth.abi.encodeParameter(type, inputs[name]).replace("0x", "");
        });
        const joinedEncodedInputs = _.reduce(encodedInputs, function(str, encodedInput) {
            return str + encodedInput;
        }, "");

        console.log("encodedInputs == ");
        console.log(encodedInputs);

        console.log("joinedEncodedInputs == ");
        console.log(joinedEncodedInputs);

        //TODO should be real sequence...
        const feeInTFuelWei  = (new BigNumber(10)).pow(12);
        const from =  Wallet.getWalletAddress();
        const gasPrice = feeInTFuelWei;
        const gasLimit = 200000;
        const data = byteCodeJson.object + joinedEncodedInputs;
        const value = 0;
        const senderSequence = 1;

        let tx = Theta.unsignedSmartContractTx({
            from: from,
            to: null,
            data: data,
            value: value,
            transactionFee: gasPrice,
            gasLimit: gasLimit
        }, senderSequence);

        const rawTxBytes = ThetaJS.TxSigner.serializeTx(tx);

        console.log("rawTxBytes.toString('hex') = " + rawTxBytes.toString('hex'));

        //TODO open the confirm Tx modal...
    };

    render() {
        return (
            <div className="DeployContractContent">
                <DeployContractForm onSubmit={this.onSubmit}/>
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
    return {};
};

export default connect(mapStateToProps)(ContractPage);
