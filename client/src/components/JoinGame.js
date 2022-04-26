import './JoinGame.css';
import React from 'react';

function JoinGame({ setGameToken }) {
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
          alert('You have no available chips on hand.');
        }
        else {
          alert('Game is currently full.');
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