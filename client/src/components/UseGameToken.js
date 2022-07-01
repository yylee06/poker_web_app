import React from 'react';

function useGameToken() {
    const getGameToken = () => {
        const tokenString = sessionStorage.getItem('game-token')
        const userToken = JSON.parse(tokenString)
        return userToken?.token
    };

    const [gameToken, setGameToken] = React.useState(getGameToken());

    const saveGameToken = userToken => {
        sessionStorage.setItem('game-token', JSON.stringify(userToken))
        setGameToken(userToken.token);
    };

    return {
        setGameToken: saveGameToken, 
        gameToken
    }
}

export default useGameToken;