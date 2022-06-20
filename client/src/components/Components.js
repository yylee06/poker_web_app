import { useEffect, useMemo } from 'react';
import Login from './Login';
import Register from './Register';
import Withdraw from './Withdraw';
import Deposit from './Deposit';
import JoinGame from './JoinGame';
import App from './App';
import useLoginToken from './UseLoginToken';
import useGameToken from './UseGameToken';
import useIngameToken from './UseIngameToken';
import ReadyPlayers from './ReadyPlayers';

function Components() {
  console.log("Rendering Component!")
  const { loginToken, setLoginToken } = useLoginToken();
  const { gameToken, setGameToken } = useGameToken();
  const { ingameToken, setIngameToken } = useIngameToken();

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

    //return socket.close()
  }, [socket]);

  function onLogout() {
    //removes token and clears session storage, might find less redundant way to do this later
    setLoginToken({})
    setGameToken({})
    sessionStorage.clear()
  }

  function onExitGame() {
    const token_unparsed = sessionStorage.getItem('game-token')
    const token_parsed = JSON.parse(token_unparsed)
    const game_headers = {'Accept': 'application/json', 'Content-Type': 'application/json'};

    fetch('http://localhost:3080/exit_game', {method: 'POST', body: JSON.stringify({token: token_parsed?.token}), headers: game_headers})
      .then(res => res.json())
      .then((retrievedMessage) => {
        if (retrievedMessage.auth === 1) {
          setGameToken({})
          sessionStorage.removeItem("game-token")
          alert("You have left the game.")
        }
        else {
          alert('You cannot currently exit the game.');
        }
    })
  }

  if (!loginToken) {
    return (
      <div>
        <App socket={socket} ingameToken={ingameToken} setIngameToken={setIngameToken}/>
        <Login setLoginToken={setLoginToken} />
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
        <JoinGame setGameToken={setGameToken}/>
        <button className="login-button" onClick={onLogout}>Logout</button>
      </div>
    )
  }
  
  else if (!ingameToken) {
    return (
      <div>
        <App socket={socket} ingameToken={ingameToken} setIngameToken={setIngameToken}/>
        <ReadyPlayers socket={socket} ingameToken={ingameToken} />
        <button className="exit-game-button" onClick={onExitGame}>Leave Game</button>
        <button className="login-button" onClick={onLogout}>Logout</button>
      </div>
    );
  }
  
  return (
    <div>
      <App socket={socket} ingameToken={ingameToken} setIngameToken={setIngameToken}/>
      <ReadyPlayers socket={socket} ingameToken={ingameToken} />
      <button className="exit-game-button" onClick={onExitGame}>Leave Game</button>
      <button className="login-button" onClick={onLogout}>Logout</button>
    </div>
  );
}

export default Components;
