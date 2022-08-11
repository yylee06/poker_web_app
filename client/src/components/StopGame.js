import "./StopGame.css"
import React from 'react';

function StopGame() {
    const [toggle, setToggle] = React.useState(0)

    const token_unparsed = sessionStorage.getItem('game-token')
    const token_parsed = JSON.parse(token_unparsed)
    const player_headers = {'Accept': 'application/json', 'Content-Type': 'application/json'};

    //adds or removes player from the list of players that want to end the game, 1 for addition, 0 for removal
    function toggleGame(toggled_value) {
        fetch('http://54.91.205.171:3080/toggle_game', {method: 'POST', body: JSON.stringify({token: token_parsed?.token, toggle: toggled_value, begin_game: 0}), headers: player_headers})
        .then(res => res.json())
        .then((retrievedMessage) => {
            console.log(retrievedMessage.message)
        })
    }

    const toggleButton = () => {
        if (toggle) {
            setToggle(0)
            toggleGame(0)
        }
        else {
            setToggle(1)
            toggleGame(1)
        }
    }

    return (
        <div>
            <button style={{ borderStyle : (toggle === 1) ? "solid" : "hidden", boxShadow : (toggle === 1) ? "0 0 10px #e1ed9e" : "none" }} className="stop-game-button" onClick={toggleButton}>Stop Game</button>
        </div>
    )
}

export default StopGame;