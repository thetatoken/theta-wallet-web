import { isResponseSuccessful } from '../../services/Api'

export function reduxFetch(baseAction, apiFn, metadata = {}, opts = {}) {
    let {onSuccess, onError} = opts;

    return function(dispatch, getState){
        dispatch({
            type : `${baseAction}/START`,
            metadata: metadata
        });

        apiFn().then(
            response => {
                try {
                    response['body'] = JSON.parse(response['_bodyText']);
                }
                catch (e) {
                    response['body'] = {message: "Oops. An error has occurred."};
                }

                if(isResponseSuccessful(response)){
                    dispatch({
                        type : `${baseAction}/SUCCESS`,
                        response : response,
                        metadata: metadata
                    });

                    if(onSuccess){
                        onSuccess(dispatch, response);
                    }
                }
                else{
                    dispatch({
                        type : `${baseAction}/FAILURE`,
                        response : response,
                        metadata: metadata
                    });

                    if(onError){
                        onError(dispatch, response);
                    }
                }
            },
            error => {
                dispatch({
                    type : `${baseAction}/FAILURE`,
                    response : error,
                    metadata: metadata
                });

                if(onError){
                    onError(dispatch, {});
                }
            }
        ).then(function(){
            dispatch({
                type : `${baseAction}/END`,
                metadata: metadata
            });
        });
    };
}