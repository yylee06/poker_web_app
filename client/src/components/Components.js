import { useEffect, useMemo } from 'react';
import Login from './Login';
import Register from './Register';
import Withdraw from './Withdraw';
import Deposit from './Deposit';
import JoinGame from './JoinGame';
import App from './App';
import ReadyPlayers from './ReadyPlayers';
import Chatbox from './Chatbox';
import useLoginToken from '../auth/useLoginToken';
import useGameToken from '../auth/useGameToken';
import useIngameToken from '../auth/useIngameToken';
import tokenAuth from '../auth/tokenAuth';

function Components() {
  console.log("Rendering Component!")
  const { loginToken, setLoginToken } = useLoginToken();
  const { gameToken, setGameToken } = useGameToken();
  const { ingameToken, setIngameToken } = useIngameToken();

  //websocket API
  const socket = useMemo(() => {
    return new WebSocket('ws://localhost:3080');
  }, [])

  useEffect(() => {
    //Connection opened
    socket.onopen = () => {
      console.log("Connection opened.")
    }

    socket.onclose = () => {
      console.log("Connection closed.")
    }

    //responds to pings with a pong, used for ws authentication
    function handlePing(event) {
      const received_message = JSON.parse(event.data)
      if (received_message.event === "ping") {
        socket.send(JSON.stringify({event: "pong"}))
      }
    }

    socket.addEventListener('message', handlePing)

    return () => { socket.removeEventListener('message', handlePing) }

  }, [socket]);

  //authenticates all tokens on every token shift
  useEffect(() => {
    tokenAuth(socket, loginToken, setLoginToken, gameToken, setGameToken, ingameToken, setIngameToken)
  }, [socket, loginToken, setLoginToken, gameToken, setGameToken, ingameToken, setIngameToken])

  function onExitGame() {
    const token_unparsed = sessionStorage.getItem('game-token')
    const token_parsed = JSON.parse(token_unparsed)
    const game_headers = {'Accept': 'application/json', 'Content-Type': 'application/json'};

    setGameToken({})
    setIngameToken({})
    sessionStorage.removeItem("game-token")
    sessionStorage.removeItem("ingame-token")

    fetch('http://localhost:3080/exit_game', {method: 'POST', body: JSON.stringify({token: token_parsed?.token}), headers: game_headers})
      .then(res => res.json())
      .then((retrievedMessage) => {
        if (retrievedMessage.auth === 1) {
          console.log("You have successfully left the game.")
        }
    })
  }

  function onLogout() {
    const token_unparsed = sessionStorage.getItem('login-token')
    const token_parsed = JSON.parse(token_unparsed)
    const game_headers = {'Accept': 'application/json', 'Content-Type': 'application/json'};

    //removes token and clears session storage, might find less redundant way to do this later
    setLoginToken({})
    setGameToken({})
    setIngameToken({})
    sessionStorage.clear()

    fetch('http://localhost:3080/logout', {method: 'POST', body: JSON.stringify({token: token_parsed?.token}), headers: game_headers})
      .then(res => res.json())
      .then((retrievedMessage) => {
        if (retrievedMessage.auth === 1) {
            console.log("You have successfully logged out.")
        }
    })
  }

  if (!loginToken) {
    return (
      <div>
        <App socket={socket} ingameToken={ingameToken} setIngameToken={setIngameToken}/>
        <Login loginToken={loginToken} setLoginToken={setLoginToken} />
        <Register />
      </div>
    )
  }
  
  else if (!gameToken) {
    return (
      <div>
        <App socket={socket} ingameToken={ingameToken} setIngameToken={setIngameToken}/>
        <Withdraw />
        <Deposit />
        <JoinGame setGameToken={setGameToken} setIngameToken={setIngameToken}/>
        <Chatbox socket={socket} />
        <button className="login-button" onClick={onLogout}>Logout</button>
      </div>
    )
  }
  
  else if (!ingameToken) {
    return (
      <div>
        <App socket={socket} ingameToken={ingameToken} setIngameToken={setIngameToken}/>
        <ReadyPlayers socket={socket} ingameToken={ingameToken} />
        <Chatbox socket={socket} />
        <button className="exit-game-button" onClick={onExitGame}>Leave Game</button>
        <button className="login-button" onClick={onLogout}>Logout</button>
      </div>
    );
  }
  
  return (
    <div>
      <App socket={socket} ingameToken={ingameToken} setIngameToken={setIngameToken}/>
      <ReadyPlayers socket={socket} ingameToken={ingameToken} />
      <Chatbox socket={socket} />
      <button className="exit-game-button" onClick={onExitGame}>Leave Game</button>
      <button className="login-button" onClick={onLogout}>Logout</button>
    </div>
  );
}

export default Components;
