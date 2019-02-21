import {store} from "../state";
import {fetchETHTransaction} from '../state/actions/Transactions'

export default class Transactions {

    //If we ahve local transactions, try to fetch them from the server so we can mark them as completed
    static pollLocalTransactions(){
        let state = store.getState();
        let localTransactionHashes = Object.keys(state.transactions.localTransactionsByID);

        if(localTransactionHashes.length > 0){
            for(let i = 0; i < localTransactionHashes.length; i++){
                let hash = localTransactionHashes[i];

                store.dispatch(fetchETHTransaction(hash));
            }
        }

        setTimeout(function () {
            Transactions.pollLocalTransactions();
        }, 5000);
    }
}