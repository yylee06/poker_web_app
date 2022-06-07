import './PlayerSlots.css';
import { useState, useEffect, useCallback } from 'react'
import PlayerSlot from './PlayerSlot';
import images from '../images/images';

function PlayerSlots({ socket, setIngameToken }) {
    const [players, setPlayers] = useState([]);
    const [playerIndex, setPlayerIndex] = useState(-1);

    const callbackPlayerIndex = useCallback(() => {
        const token_unparsed = sessionStorage.getItem('login-token')
        const token_parsed = JSON.parse(token_unparsed)
        const player_headers = {'Accept': 'application/json', 'Content-Type': 'application/json'};
    
        //POST request to get own player's index using login token authentication
        function getPlayerIndex() {
          fetch('http://localhost:3080/player_index', {method: 'POST', body: JSON.stringify({token: token_parsed?.token}), headers: player_headers})
          .then(res => res.json())
          .then((retrievedMessage) => {
            setPlayerIndex(retrievedMessage.index)
          })
        }
    
        getPlayerIndex();
    }, [])
    
    const callbackPlayerState = useCallback(() => {
        const token_unparsed = sessionStorage.getItem('login-token')
        const token_parsed = JSON.parse(token_unparsed)
        const player_headers = {'Accept': 'application/json', 'Content-Type': 'application/json'};
    
        //sends login token, returns JSON object of players and respective cards (empty cards if not owned)
        function getPlayerState() {
          fetch('http://localhost:3080/players', {method: 'POST', body: JSON.stringify({token: token_parsed?.token}), headers: player_headers})
          .then(res => res.json())
          .then((retrievedMessage) => {
            let current_players = [];
            for (let i = 0; i < retrievedMessage.players.length; i++) {
              current_players[i] = {username: retrievedMessage.players[i], card1: retrievedMessage.cards[i][0], card2: retrievedMessage.cards[i][1]}
            }
            setPlayers(current_players)
          })
        }
    
        getPlayerState()
    }, [])

    const callbackIngameToken = useCallback(() => {
        const token_unparsed = sessionStorage.getItem('login-token')
        const token_parsed = JSON.parse(token_unparsed)
        const player_headers = {'Accept': 'application/json', 'Content-Type': 'application/json'};
    
        //sends login token, returns JSON object of authorization and ingame token
        function getIngameToken() {
          fetch('http://localhost:3080/ingame_token', {method: 'POST', body: JSON.stringify({token: token_parsed?.token}), headers: player_headers})
          .then(res => res.json())
          .then((retrievedMessage) => {
            if (retrievedMessage.auth === 1) {
              setIngameToken({token: retrievedMessage.token})
            }
            else {
              console.log("Game currently in progress. You can press 'Join Game' to join in the next round.")
            }
          })
        }
    
        getIngameToken()
    }, [setIngameToken])

    //only on first render
    useEffect(() => {
        callbackPlayerState()
        callbackPlayerIndex()
    }, [callbackPlayerState, callbackPlayerIndex])

    useEffect(() => {
        console.log("Player event listeners added!")
    
        function handlePlayers(event) {
            const received_message = JSON.parse(event.data)
            switch(received_message.event) {
                case "player":
                    callbackPlayerState();
                    callbackPlayerIndex();
                    break;
                case "first_turn":
                    callbackPlayerState();
                    callbackIngameToken();
                    break;
                default:
            }
        }
    
        socket.addEventListener('message', handlePlayers)

        return () => { socket.removeEventListener('message', handlePlayers) }
    }, [callbackPlayerState, callbackPlayerIndex, callbackIngameToken]);

    return (
        <div>
            <PlayerSlot currPlayer={(players.length < 1) ? {inUse:0} : {username:players[0].username, inUse: 1,
                        card1: images.get(players[0].card1), card2: images.get(players[0].card2)}}  />
            <PlayerSlot currPlayer={(players.length < 2) ? {inUse:0} : {username:players[1].username, inUse: 1,
                        card1: images.get(players[1].card1), card2: images.get(players[1].card2)}}  />
            <PlayerSlot currPlayer={(players.length < 3) ? {inUse:0} : {username:players[2].username, inUse: 1,
                        card1: images.get(players[2].card1), card2: images.get(players[2].card2)}} />
            <PlayerSlot currPlayer={(players.length < 4) ? {inUse:0} : {username:players[3].username, inUse: 1,
                        card1: images.get(players[3].card1), card2: images.get(players[3].card2)}} />
            <PlayerSlot currPlayer={(players.length < 5) ? {inUse:0} : {username:players[4].username, inUse: 1,
                        card1: images.get(players[4].card1), card2: images.get(players[4].card2)}} />
            <PlayerSlot currPlayer={(players.length < 6) ? {inUse:0} : {username:players[5].username, inUse: 1,
                        card1: images.get(players[5].card1), card2: images.get(players[5].card2)}} />
            <PlayerSlot currPlayer={(players.length < 7) ? {inUse:0} : {username:players[6].username, inUse: 1,
                        card1: images.get(players[6].card1), card2: images.get(players[6].card2)}} />
            <PlayerSlot currPlayer={(players.length < 8) ? {inUse:0} : {username:players[7].username, inUse: 1,
                        card1: images.get(players[7].card1), card2: images.get(players[7].card2)}} />
            <PlayerSlot currPlayer={(players.length < 9) ? {inUse:0} : {username:players[8].username, inUse: 1,
                        card1: images.get(players[8].card1), card2: images.get(players[8].card2)}} />
            <PlayerSlot currPlayer={(players.length < 10) ? {inUse:0} : {username:players[9].username, inUse: 1,
                        card1: images.get(players[9].card1), card2: images.get(players[9].card2)}} />
        </div>
    )
}

export default PlayerSlots;
