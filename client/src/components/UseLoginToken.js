import React from 'react';

function useLoginToken() {
    const getLoginToken = () => {
        const tokenString = sessionStorage.getItem('login-token')
        const userToken = JSON.parse(tokenString)
        return userToken?.token
    };

    const [loginToken, setLoginToken] = React.useState(getLoginToken());

    const saveLoginToken = userToken => {
        sessionStorage.setItem('login-token', JSON.stringify(userToken))
        setLoginToken(userToken.token);
    };

    return {
        setLoginToken: saveLoginToken, 
        loginToken
    }
}

export default useLoginToken;