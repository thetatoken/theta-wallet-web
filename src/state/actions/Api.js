import { isResponseSuccessful } from '../../services/Api'

export function reduxFetch(baseAction, apiFn, metadata = {}, opts = {}) {
    let {onSuccess, onError} = opts;

    return async function(dispatch, getState){
        dispatch({
            type : `${baseAction}/START`,
            metadata: metadata
        });

        try {
            let response = await apiFn();

            if(response){
                let responseJSON = await response.json();

                response = {
                    status: response.status,
                    body: responseJSON
                }
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
                    response : null,
                    metadata: metadata
                });

                if(onError){
                    onError(dispatch, response);
                }
            }


        }
        catch (e) {
            // Failed to parse
            dispatch({
                type : `${baseAction}/FAILURE`,
                response : null,
                metadata: metadata
            });

            if(onError){
                onError(dispatch, null);
            }
        }
        finally {
            dispatch({
                type : `${baseAction}/END`,
                metadata: metadata
            });
        }
    };
}
