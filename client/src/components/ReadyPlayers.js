import './ReadyPlayers.css';
import { useState, useEffect, useCallback } from 'react';
import StartGame from './StartGame';
import StopGame from './StopGame';

function ReadyPlayers({ socket, ingameToken }) {
    const [readyPlayers, setReadyPlayers] = useState([]);

    const callbackReadyPlayersState = useCallback(() => {
        function getReadyPlayersState() {
          fetch('http://localhost:3080/ready_players')
            .then(res => res.json())
            .then((retrievedMessage) => {
              setReadyPlayers(retrievedMessage.ready_players)
            })
        }
    
        getReadyPlayersState()
    }, [])

    useEffect(() => {
        console.log("Ready players event listeners added!")
    
        function handleReadyPlayers(event) {
            const received_message = JSON.parse(event.data)
            if (received_message.event === "start/stop") {
                callbackReadyPlayersState()
            }
        }
    
        socket.addEventListener('message', handleReadyPlayers)

        return () => { socket.removeEventListener('message', handleReadyPlayers) }
    }, [socket, callbackReadyPlayersState]);

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