const tokenAuth = ((socket, loginToken, setLoginToken, gameToken, setGameToken, ingameToken, setIngameToken) => {
    const login_token_unparsed = sessionStorage.getItem('login-token')
    const login_token_parsed = JSON.parse(login_token_unparsed)
    const game_token_unparsed = sessionStorage.getItem('game-token')
    const game_token_parsed = JSON.parse(game_token_unparsed)
    const ingame_token_unparsed = sessionStorage.getItem('ingame-token')
    const ingame_token_parsed = JSON.parse(ingame_token_unparsed)
    const token_headers = {'Accept': 'application/json', 'Content-Type': 'application/json'};

    //authenticates the login token
    function authLoginToken() {
        fetch('http://localhost:3080/auth_login_token', {method: 'POST', body: JSON.stringify({token: login_token_parsed?.token}), headers: token_headers})
        .then(res => res.json())
        .then((retrievedMessage) => {
            if (retrievedMessage.auth === 0) {
                setLoginToken({})
                sessionStorage.removeItem("login-token")
                alert('Invalid login token. Please login again.')
            }
            else {
                //if properly authenticated, sends login token to server
                if (socket) {
                    socket.send(JSON.stringify({event: "ws_auth", token: loginToken}))
                }
            }
        })
    }

    //authenticates the game token, also removes token if login token does not exist
    function authGameToken() {
        fetch('http://localhost:3080/auth_game_token', {method: 'POST', body: JSON.stringify({token: game_token_parsed?.token}), headers: token_headers})
        .then(res => res.json())
        .then((retrievedMessage) => {
            if (retrievedMessage.auth === 0 || !loginToken) {
                setGameToken({})
                sessionStorage.removeItem("game-token")
                alert('Invalid game token. Please try rejoining the game.')
            }
        })
    }

    //authenticates the ingame token, also removes token if login token does not exist
    function authIngameToken() {
        fetch('http://localhost:3080/auth_ingame_token', {method: 'POST', body: JSON.stringify({token: ingame_token_parsed?.token}), headers: token_headers})
        .then(res => res.json())
        .then((retrievedMessage) => {
            if (retrievedMessage.auth === 0 || !loginToken) {
                setIngameToken({})
                sessionStorage.removeItem("ingame-token")
                alert('Invalid ingame token. Please ingame again.')
            }
            else {
                console.log("Good auth.")
            }
        })
    }

    //authenticates in this order for less redundancy (particularly with sending ws auth)
    if (ingameToken) {
        authIngameToken()
    }

    if (gameToken) {
        authGameToken()
    }

    if (loginToken) {
        authLoginToken()
    }

});
    
export default tokenAuth;