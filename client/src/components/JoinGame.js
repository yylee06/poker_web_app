import './JoinGame.css';
import React from 'react';

function JoinGame({ setGameToken, setIngameToken }) {
  function onSubmit() {
    const token_unparsed = sessionStorage.getItem('login-token')
    const token_parsed = JSON.parse(token_unparsed)
    const game_headers = {'Accept': 'application/json', 'Content-Type': 'application/json'};

    fetch('http://localhost:3080/join_game', {method: 'POST', body: JSON.stringify({token: token_parsed?.token}), headers: game_headers})
      .then(res => res.json())
      .then((retrievedMessage) => {
        if (retrievedMessage.auth === 1) {
          setGameToken({token: retrievedMessage.token})
          alert('You will join the game starting from the next round.');
        }
        else if (retrievedMessage.auth === 2) {
          alert('You do not have enough chips on hand to join. (Minimum chips required to enter: 100)');
        }
        else if (retrievedMessage.auth === 3) {
          alert('You have rejoined the game.');
          setGameToken({token: retrievedMessage.token})
          setIngameToken({token: retrievedMessage.ingame_token})
        }
    })
  }

  return (
    <div>
      <button className="join-game-button" onClick={onSubmit}>Join Game</button>
    </div>
  );
}

export default JoinGame;