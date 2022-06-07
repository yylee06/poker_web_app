import React from 'react';

function UseIngameToken() {
    const getIngameToken = () => {
        const tokenString = sessionStorage.getItem('ingame-token')
        const userToken = JSON.parse(tokenString)
        return userToken?.token
    };

    const [ingameToken, setIngameToken] = React.useState(getIngameToken());

    const saveIngameToken = userToken => {
        sessionStorage.setItem('ingame-token', JSON.stringify(userToken))
        setIngameToken(userToken.token);
    };

    return {
        setIngameToken: saveIngameToken, 
        ingameToken
    }
}

export default UseIngameToken;