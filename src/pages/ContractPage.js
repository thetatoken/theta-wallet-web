import {BigNumber} from 'bignumber.js';
import _ from 'lodash';
import React, {Fragment, useState, useEffect} from "react";
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
import {store} from "../state";
import PageHeader from "../components/PageHeader";
import {getQueryParameters, zipMap} from "../utils/Utils";
import Api from "../services/Api";
import {createSmartContractTransaction} from "../state/actions/Transactions";

const web3 = new Web3("http://localhost");

function isReadFunction(functionData){
    const constant = _.get(functionData, ['constant'], null);
    const stateMutability = _.get(functionData, ['stateMutability'], null);

    return (stateMutability === "view" || stateMutability === "pure" || constant === true);
}

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

function validateByteCode(value) {
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

function validateAddress(value) {
    return (web3.utils.isAddress(value) || "Invalid address");
}

function validateABI(value) {
    return (isValidABI(value) || "Invalid ABI/JSON interface");
}

function validateFunctionName(value) {
    if (_.isNil(value) || value.length === 0) {
        return "Function is required"
    } else {
        return true;
    }
}

function validateInput(type, value) {
    return true;

    try {
        return _.isNil(web3.eth.abi.encodeParameter(type, JSON.parse(value))) === false;
    } catch (e) {
        return "Invalid value for type of " + type;
    }
}

function getFunctions(jsonInterface) {
    const functions = _.filter(jsonInterface, function (o) {
        return (o.type === "function");
    });

    return functions;
}

function getConstructor(jsonInterface) {
    const constructors = _.filter(jsonInterface, function (o) {
        return (o.type === "constructor");
    });

    return _.first(constructors);
}

function Inputs(title, inputs, formHook) {
    const {register, errors} = formHook;

    return (
        <div>
            {
                inputs.length > 0 &&
                <div>
                    <div className="FormSectionTitle">{ title }</div>
                    <div className="FormColumns">
                        {
                            inputs.map((value, index) => {
                                const {name, type} = value;
                                const argName = `arg${index}`;
                                const key = `inputs.${argName}`;

                                return (
                                    <Fragment key={key}>
                                        <div className="FormColumn">
                                            <div className="InputTitle">{name + " (" + type + ")"}</div>
                                            <input className="RoundedInput"
                                                   placeholder={"Enter " + name}
                                                   name={key}
                                                   ref={register({
                                                       required: "Input " + name + " is required",
                                                       validate: (val) => {
                                                           return validateInput(type, val)
                                                       }
                                                   })}
                                            />
                                            {_.get(errors, ['inputs', argName]) && <div
                                                className="InputError">{_.get(errors, ['inputs', argName, 'message'])}</div>}
                                        </div>
                                    </Fragment>
                                );
                            })
                        }
                    </div>
                </div>
            }
        </div>
    )
}

function DeployContractForm(props) {
    const {onSubmit} = props;
    const {register, handleSubmit, errors, watch} = useForm({
        mode: 'onChange',
    });
    const abi = watch("abi");
    const byteCode = watch("byteCode");
    const contract = initContract(abi, null);
    const jsonInterface = _.get(contract, ['options', 'jsonInterface']);
    const constructor = getConstructor(jsonInterface);
    const constructorInputs = _.get(constructor, ['inputs'], []);

    window.contract = contract;

    return (
        <form onSubmit={handleSubmit(onSubmit)}>

            <div className="FormColumns">
                {/*ABI/JSON Interface Section*/}
                <div className="FormColumn">
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
                </div>

                {/*Byte Code Section*/}
                <div className="FormColumn">
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
                </div>
            </div>

            {
                Inputs("Constructor Inputs", constructorInputs, {
                    register: register,
                    errors: errors
                })
            }

            <GradientButton title="Deploy Contract"
                            style={{marginTop: 15}}
                            disabled={(_.size(errors) > 0) || _.isNil(abi) || _.isNil(byteCode)}
                            onClick={handleSubmit(onSubmit)}
            />
        </form>
    );
}

function InteractWithContractForm(props) {
    const {defaultFormValues, disabled, loading, onSubmit, onChange} = props;
    const defaultValues = _.merge({
        functionName: ""
    }, defaultFormValues);

    const {register, handleSubmit, errors, watch, setValue} = useForm({
        mode: 'onChange',
        defaultValues: defaultValues
    });
    const [lastFormState, setLastFormState] = useState(defaultValues);
    const formState = watch(); // watching every fields in the form
    const isDirty = (_.isEqual(lastFormState, formState) === false);

    useEffect(() => {
        if (isDirty) {
            setLastFormState(formState);

            if (onChange) {
                onChange();
            }
        }
    }, [isDirty, formState, onChange, setValue]);

    const abi = watch("abi");
    const address = watch("address");
    const functionName = watch("functionName");
    const contract = initContract(abi, null);
    const jsonInterface = _.get(contract, ['options', 'jsonInterface']);
    const functions = getFunctions(jsonInterface) || [];
    const functionsByName = zipMap(functions.map(({name}) => name), functions);
    const functionData = _.get(functionsByName, [functionName]);
    const functionInputs = _.get(functionData, ['inputs'], []);
    const isFunctionReadOnly = isReadFunction(functionData);

    return (
        <form onSubmit={handleSubmit(onSubmit)}>

            {/*Contract Name Section*/}
            <div className="FormSectionTitle">Contract Address</div>
            <input className="RoundedInput"
                   placeholder="Enter contract address"
                   name="address"
                   ref={register({
                       required: "Contract address is required.",
                       validate: validateAddress
                   })}
            />
            {errors.address && <div className="InputError">{errors.address.message}</div>}


            {/*ABI/JSON Interface Section*/}
            <div className="FormColumns">

                <div className="FormColumn">
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
                </div>

                {
                    functions.length > 0 &&
                    <div className="FormColumn">
                        <div className="FormSectionTitle">Function</div>
                        <select name="functionName"
                                className="RoundedInput"
                                placeholder="Choose function"
                                ref={register({
                                    required: "Function is required.",
                                    validate: validateFunctionName
                                })}
                        onChange={() => {

                        }}>
                            <option value={""}
                                    key={"__placeholder__"}>
                                Choose function
                            </option>
                            {
                                functions.map((value, index) => {
                                    const {name, type} = value;
                                    return (
                                        <option value={name}
                                                key={name}
                                        >{name}</option>
                                    );
                                })
                            }
                        </select>
                        {errors.functionName && <div className="InputError">{errors.functionName.message}</div>}
                    </div>
                }

            </div>

            {
                Inputs("Function Inputs", functionInputs, {
                    register: register,
                    errors: errors
                })
            }

            <GradientButton title={isFunctionReadOnly ? "Read" : "Write"}
                            style={{marginTop: 15}}
                            disabled={disabled || (_.size(errors) > 0) || _.isNil(abi) || _.isNil(address) || _.isNil(functionName)}
                            loading={loading}
                            onClick={handleSubmit(onSubmit)}
            />
        </form>
    );
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
        const {abi, byteCode, inputs} = formData;
        const byteCodeJson = parseJSON(byteCode);
        const contract = initContract(abi, null);
        const jsonInterface = _.get(contract, ['options', 'jsonInterface']);
        const constructor = getConstructor(jsonInterface);
        const constructorInputs = _.get(constructor, ['inputs'], []);

        const constructorInputTypes = _.map(constructorInputs, ({name, type}) => {
            return type;
        });
        const constructorInputValues = _.map(constructorInputs, ({name, type}, index) => {
            let val = inputs[`arg${index}`];

            if(type.includes('[]')){
                return parseJSON(val);
            }
            else if(type === "boolean" || type === "bool"){
                return Boolean(parseJSON(val));
            }

            return val;
        });
        const encodedParameters = web3.eth.abi.encodeParameters(constructorInputTypes, constructorInputValues).slice(2);
        const from = Wallet.getWalletAddress();
        const data = byteCodeJson.object + encodedParameters;
        const value = 0;

        store.dispatch(createSmartContractTransaction(ContractModes.DEPLOY, abi, {
                from: from,
                to: null,
                data: data,
                value: value,
            }
        ));
    };

    render() {
        return (
            <div className="DeployContractContent">
                <DeployContractForm onSubmit={this.onSubmit}/>
            </div>
        );
    }
}

class InteractWithContractContent extends React.Component {
    constructor() {
        super();

        this.defaultState = {
            loading: false,

            result: null
        };

        this.state = this.defaultState;
    }

    onSubmit = async (formData) => {
        const {address, abi, functionName, inputs} = formData;
        const contract = initContract(abi, address);
        const jsonInterface = _.get(contract, ['options', 'jsonInterface']);
        const functions = getFunctions(jsonInterface) || [];
        const functionsByName = zipMap(functions.map(({name}) => name), functions);
        const functionData = _.get(functionsByName, [functionName]);
        const functionInputs = _.get(functionData, ['inputs'], []);
        const functionOutputs = _.get(functionData, ['outputs'], []);
        const functionSignature = _.get(functionData, ['signature']).slice(2);
        const isFunctionReadOnly = isReadFunction(functionData);

        const inputTypes = _.map(functionInputs, ({name, type}) => {
            return type;
        });
        const inputValues = _.map(functionInputs, ({name, type}, index) => {
            let val = inputs[`arg${index}`];
            if(type.includes('[]')){
                return parseJSON(val);
            }
            else if(type === "boolean" || type === "bool"){
                return Boolean(parseJSON(val));
            }

            return val;
        });
        const encodedParameters = web3.eth.abi.encodeParameters(inputTypes, inputValues).slice(2);

        const feeInTFuelWei = (new BigNumber(10)).pow(12);
        const from = Wallet.getWalletAddress();
        const gasPrice = Theta.getSmartContractGasPrice(); //feeInTFuelWei;
        const gasLimit = 10000000;
        const data = functionSignature + encodedParameters;
        const value = 0;
        const senderSequence = 1;

        if (isFunctionReadOnly) {
            this.setState({
                isLoading: true,
                callResult: null
            });

            //Call smart contract (no signing)
            const senderSequence = 1;
            const tx = Theta.unsignedSmartContractTx({
                from: from,
                to: address,
                data: data,
                value: value,
                transactionFee: gasPrice,
                gasLimit: gasLimit
            }, senderSequence);
            const rawTxBytes = ThetaJS.TxSigner.serializeTx(tx);

            try{
                const callResponse = await Api.callSmartContract({data: rawTxBytes.toString('hex').slice(2)}, {network: Theta.getChainID()});
                const callResponseJSON = await callResponse.json();
                const result = _.get(callResponseJSON, 'result');
                const errorMessage  = _.get(result, 'vm_error');

                this.setState({
                    callResult: _.merge(result, {
                        outputs: functionOutputs,
                        decodedParameters: web3.eth.abi.decodeParameters(functionOutputs, _.get(result, 'vm_return'))
                    }),
                    isLoading: false
                });
            }
            catch (e) {
                //Stop loading and put the error message in the vm_error like it came fromm the blockchain.
                this.setState({
                    isLoading: false,
                    callResult: {
                        vm_error: e.message
                    }
                });
            }

        } else {
            store.dispatch(createSmartContractTransaction(ContractModes.INTERACT, abi, {
                    from: from,
                    to: address,
                    data: data,
                    value: value,
                }
            ));
        }
    };

    onChange = () => {
        this.setState({
            callResult: null
        });
    };

    render() {
        const {defaultFormValues} = this.props;
        const {isLoading, callResult} = this.state;
        const error = _.get(callResult, 'vm_error');

        return (
            <div className="InteractWithContractContent">
                <InteractWithContractForm defaultFormValues={defaultFormValues}
                                          onSubmit={this.onSubmit}
                                          onChange={this.onChange}
                                          loading={isLoading}
                                          disabled={isLoading}
                />
                {
                    error &&
                    <div className="InputError"
                         style={{
                             marginTop: 20
                         }}>
                        {error}
                    </div>
                }
                {
                    callResult &&
                    <div style={{
                        marginTop: 20
                    }}>
                        <div>
                            <div className="InputTitle">Raw Result</div>
                            <input className="RoundedInput"
                                   name={"vm_return"}
                                   value={_.get(callResult, 'vm_return')}
                                   readOnly
                            />
                        </div>
                    </div>
                }
                {
                    callResult &&
                    <div className="FormColumns">
                        {
                            _.get(callResult, 'outputs', []).map((value, index) => {
                                const {name, type} = value;
                                return (
                                    <Fragment key={name}>
                                        <div className="FormColumn">
                                            <div className="InputTitle">{name + " (" + type + ")"}</div>
                                            <input className="RoundedInput"
                                                   value={_.get(callResult, ['decodedParameters', index])}
                                                   readOnly
                                            />
                                        </div>
                                    </Fragment>
                                );
                            })
                        }
                    </div>
                }
            </div>
        );
    }
}


class ContractPage extends React.Component {
    render() {
        let contractMode = this.props.match.params.contractMode;
        let queryParams = getQueryParameters(this.props.history.location.search);
        if (queryParams['abi']) {
            queryParams['abi'] = atob(queryParams['abi']);
        }

        return (
            <div className="ContractPage">
                <div className="ContractPage__detail-view">
                    <PageHeader title={null}
                                sticky={true}>
                        <TabBar centered={true}
                                condensed={false}
                                style={{width: "100%"}}
                        >
                            <TabBarItem
                                title="Deploy Contract"
                                href={"/wallet/contract/" + ContractModes.DEPLOY}
                            />
                            <TabBarItem
                                title="Interact with Contract"
                                href={"/wallet/contract/" + ContractModes.INTERACT}
                            />
                        </TabBar>
                    </PageHeader>

                    {
                        (contractMode === ContractModes.DEPLOY) &&
                        <DeployContractContent/>
                    }
                    {
                        (contractMode === ContractModes.INTERACT) &&
                        <InteractWithContractContent defaultFormValues={queryParams}/>
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
