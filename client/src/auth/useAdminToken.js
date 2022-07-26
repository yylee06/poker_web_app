import React from 'react';

function useAdminToken() {
    const getAdminToken = () => {
        const tokenString = sessionStorage.getItem('admin-token')
        const userToken = JSON.parse(tokenString)
        return userToken?.token
    };

    const [adminToken, setAdminToken] = React.useState(getAdminToken());

    const saveAdminToken = userToken => {
        sessionStorage.setItem('admin-token', JSON.stringify(userToken))
        setAdminToken(userToken.token);
    };

    return {
        setAdminToken: saveAdminToken, 
        adminToken
    }
}

export default useAdminToken;