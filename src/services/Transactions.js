import {store} from "../state";
import {fetchTransaction} from '../state/actions/Transactions'

export default class Transactions {

    //If we have local transactions, try to fetch them from the server so we can mark them as completed
    static pollLocalTransactions(){
        let state = store.getState();
        let localTransactionHashes = Object.keys(state.transactions.localTransactionsByHash);

        if(localTransactionHashes.length > 0){
            for(let i = 0; i < localTransactionHashes.length; i++){
                let hash = localTransactionHashes[i];
                let tx = state.transactions.localTransactionsByHash[hash];
                let network = tx.network;

                store.dispatch(fetchTransaction(network, hash));
            }
        }

        setTimeout(function () {
            Transactions.pollLocalTransactions();
        }, 5000);
    }
}