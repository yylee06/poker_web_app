import './PlayerChips.css';
import { useState, useEffect, useCallback } from 'react';
import PlayerChip from './PlayerChip';

function PlayerChips({ socket }) {
    const [playerChips, setPlayerChips] = useState([]);

    const callbackPlayerChipsState = useCallback(() => {
        function getPlayerChipsState() {
          fetch('http://localhost:3080/player_chips')
            .then(res => res.json())
            .then((retrievedMessage) => {
              setPlayerChips(retrievedMessage.chips)
            })
        }
    
        getPlayerChipsState()
    }, [])

    //only on first render
    useEffect(() => {
        callbackPlayerChipsState()
    }, [callbackPlayerChipsState])

    useEffect(() => {
        console.log("Player chips event listeners added!")
    
        function handlePlayerChips(event) {
            const received_message = JSON.parse(event.data)
            if (received_message.event === "next_turn") {
                callbackPlayerChipsState()
            }
        }
    
        socket.addEventListener('message', handlePlayerChips)

        return () => { socket.removeEventListener('message', handlePlayerChips) }
    }, [callbackPlayerChipsState]);

    return (
        <div>
            <PlayerChip chips={(playerChips.length < 1) ? -1 : playerChips[0]}/>
            <PlayerChip chips={(playerChips.length < 2) ? -1 : playerChips[1]}/>
            <PlayerChip chips={(playerChips.length < 3) ? -1 : playerChips[2]}/>
            <PlayerChip chips={(playerChips.length < 4) ? -1 : playerChips[3]}/>
            <PlayerChip chips={(playerChips.length < 5) ? -1 : playerChips[4]}/>
            <PlayerChip chips={(playerChips.length < 6) ? -1 : playerChips[5]}/>
            <PlayerChip chips={(playerChips.length < 7) ? -1 : playerChips[6]}/>
            <PlayerChip chips={(playerChips.length < 8) ? -1 : playerChips[7]}/>
            <PlayerChip chips={(playerChips.length < 9) ? -1 : playerChips[8]}/>
            <PlayerChip chips={(playerChips.length < 10) ? -1 : playerChips[9]}/>
        </div>
    );
}

export default PlayerChips;