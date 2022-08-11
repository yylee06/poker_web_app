import './ReadyPlayers.css';
import { useState, useEffect, useCallback } from 'react';
import StartGame from './StartGame';
import StopGame from './StopGame';

function ReadyPlayers({ socket, setGameToken, ingameToken }) {
    const [readyPlayers, setReadyPlayers] = useState([]);

    const callbackReadyPlayersState = useCallback(() => {
        function getReadyPlayersState() {
          fetch('http://54.91.205.171:3080/ready_players')
            .then(res => res.json())
            .then((retrievedMessage) => {
              setReadyPlayers(retrievedMessage.ready_players)
            })
        }
    
        getReadyPlayersState()
    }, [])

    const callbackPlayerStillInGame = useCallback(() => {
        function getPlayerInGameState() {
            const token_unparsed = sessionStorage.getItem('login-token')
            const token_parsed = JSON.parse(token_unparsed)
            const player_headers = {'Accept': 'application/json', 'Content-Type': 'application/json'};
        
            fetch('http://54.91.205.171:3080/player_still_ingame', {method: 'POST', body: JSON.stringify({token: token_parsed?.token}), headers: player_headers})
                .then(res => res.json())
                .then((retrievedMessage) => {
                    if (retrievedMessage.auth === 0) {
                        setGameToken({})
                        sessionStorage.removeItem("game-token")
                    }
                })
        }
    
        getPlayerInGameState()
    }, [setGameToken])

    //renders the ready-players component if it exists on first render
    useEffect(() => {
        callbackPlayerStillInGame()
        callbackReadyPlayersState()
    }, [callbackPlayerStillInGame, callbackReadyPlayersState]);

    useEffect(() => {
        console.log("Ready players event listeners added!")
    
        function handleReadyPlayers(event) {
            const received_message = JSON.parse(event.data)
            if (received_message.event === "start/stop" || received_message.event === "player" || received_message.event === "game_over") {
                callbackReadyPlayersState()
                callbackPlayerStillInGame()
            }
        }
    
        socket.addEventListener('message', handleReadyPlayers)

        return () => { socket.removeEventListener('message', handleReadyPlayers) }
    }, [socket, callbackPlayerStillInGame, callbackReadyPlayersState]);

    if (!ingameToken) {
        return (
            <div>
                <StartGame />
                <div className="ready-player-fraction-container">
                    <h6 className="ready-player-fraction">{!readyPlayers ? " " : readyPlayers}</h6>
                </div>
            </div>
        )
    }

    return (
        <div>
            <StopGame />
            <div className="ready-player-fraction-container">
                <h6 className="ready-player-fraction">{!readyPlayers ? " " : readyPlayers}</h6>
            </div>
        </div>
    );
}

export default ReadyPlayers;