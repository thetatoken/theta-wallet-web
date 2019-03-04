import {store} from "../state";
import {fetchEthereumTransaction} from '../state/actions/Transactions'

export default class Transactions {

    //If we have local transactions, try to fetch them from the server so we can mark them as completed
    static pollLocalTransactions(){
        let state = store.getState();
        let localTransactionHashes = Object.keys(state.transactions.localTransactionsByID);

        if(localTransactionHashes.length > 0){
            for(let i = 0; i < localTransactionHashes.length; i++){
                let hash = localTransactionHashes[i];

                store.dispatch(fetchEthereumTransaction(hash));
            }
        }

        setTimeout(function () {
            Transactions.pollLocalTransactions();
        }, 5000);
    }
}