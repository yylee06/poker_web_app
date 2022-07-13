import './PlayerSlots.css';
import { useState, useEffect, useCallback, useRef } from 'react'
import PlayerSlot from './PlayerSlot';
import images from '../assets/images/images';
const MAX_PLAYERS = 10

function PlayerSlots({ socket, setIngameToken }) {
    const [players, setPlayers] = useState([]);
    const [playerChips, setPlayerChips] = useState([]);
    const [winners, setWinners] = useState(Array(MAX_PLAYERS).fill(0));
    const [handStrengths, setHandStrengths] = useState([]);
    const playerList = useRef([]);

    const callbackShowWinners = useCallback((curr_winners) => {
      const showWinners = (curr_winners) => {
        if (Array.isArray(curr_winners)) {
          for (let winner of curr_winners) {
            let winner_index = playerList.current.indexOf(winner)
            if (winner_index > -1) {
              setWinners(w => [...w.slice(0, winner_index), 1, ...w.slice(winner_index + 1, 10)])
            }
          }
        }
        else {
          let winner_index = playerList.current.indexOf(curr_winners)
          if (winner_index > -1) {
            setWinners(w => [...w.slice(0, winner_index), 1, ...w.slice(winner_index + 1, 10)])
          }
        }
      }

      showWinners(curr_winners)
    }, []);

    const callbackResetWinners = useCallback(() => {
      const resetWinners = () => {
        setWinners(Array(MAX_PLAYERS).fill(0))
      }

      resetWinners()
    }, [])

    //show hand power of all users still in game
    const callbackShowHandStrengths = useCallback((hand_strengths) => {
      const showHandStrengths = (hand_strengths) => {
        setHandStrengths(hand_strengths)
      }

      showHandStrengths(hand_strengths)
    }, []);

    //resets display of hand power for all users
    const callbackHideHandStrengths = useCallback(() => {
      const hideHandStrengths = () => {
        setHandStrengths([])
      }

      hideHandStrengths()
    }, []);


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
            let current_usernames = [];
            for (let i = 0; i < retrievedMessage.players.length; i++) {
              current_players[i] = {username: retrievedMessage.players[i], card1: retrievedMessage.cards[i][0], card2: retrievedMessage.cards[i][1]}
              current_usernames.push(current_players[i].username)
            }

            setPlayers(current_players)

            //refreshes playerList every API call, might be greedy?
            playerList.current = current_usernames
          })
        }
    
        getPlayerState()
    }, [setPlayers])

    //isValid is a boolean value such that if isValid === false, ingameToken is removed, if isValid === true, ingameToken is added
    const callbackIngameToken = useCallback((isValid) => {
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
    
        if (isValid) {
          getIngameToken()
        }
        else {
          setIngameToken({})
          sessionStorage.removeItem("ingame-token")
        }
    }, [setIngameToken])

    //only on first render
    useEffect(() => {
        callbackPlayerState()
        callbackPlayerChipsState()
    }, [callbackPlayerState, callbackPlayerChipsState])

    useEffect(() => {
        console.log("Player event listeners added!")
    
        function handlePlayers(event) {
            const received_message = JSON.parse(event.data)
            switch(received_message.event) {
                case "player":
                    callbackPlayerState();
                    callbackPlayerChipsState();
                    break;
                case "first_turn":
                    callbackPlayerState();
                    callbackIngameToken(true);
                    callbackResetWinners();
                    callbackHideHandStrengths();
                    break;
                case "player_fold":
                    callbackPlayerState();
                    break;
                case "next_turn":
                    callbackPlayerChipsState();
                    break;
                case "showdown":
                    callbackPlayerState();
                    callbackShowHandStrengths(received_message.hand_strengths)
                    break;
                case "winner":
                    callbackShowWinners(received_message.winner)
                    break;
                case "game_over":
                    callbackPlayerState();
                    callbackIngameToken(false);
                    callbackPlayerChipsState();
                    callbackResetWinners();
                    callbackHideHandStrengths();
                    break;
                default:
            }
        }
    
        socket.addEventListener('message', handlePlayers)

        return () => { socket.removeEventListener('message', handlePlayers) }
    }, [socket, callbackPlayerState, callbackIngameToken, callbackPlayerChipsState, callbackShowWinners, callbackResetWinners, callbackShowHandStrengths, callbackHideHandStrengths]);

    return (
        <div>
            <PlayerSlot currPlayer={(players.length < 1) ? {inUse:0} : {username:players[0].username, inUse: 1,
                        card1: images.get(players[0].card1), card2: images.get(players[0].card2), playerChips: playerChips[0]}}
                        socket={socket} winner={winners[0]} handStrength={(handStrengths.length < 1) ? '' : handStrengths[0]}/>
            <PlayerSlot currPlayer={(players.length < 2) ? {inUse:0} : {username:players[1].username, inUse: 2,
                        card1: images.get(players[1].card1), card2: images.get(players[1].card2), playerChips: playerChips[1]}}
                        socket={socket} winner={winners[1]} handStrength={(handStrengths.length < 1) ? '' : handStrengths[1]} />
            <PlayerSlot currPlayer={(players.length < 3) ? {inUse:0} : {username:players[2].username, inUse: 3,
                        card1: images.get(players[2].card1), card2: images.get(players[2].card2), playerChips: playerChips[2]}}
                        socket={socket} winner={winners[2]} handStrength={(handStrengths.length < 1) ? '' : handStrengths[2]} />
            <PlayerSlot currPlayer={(players.length < 4) ? {inUse:0} : {username:players[3].username, inUse: 4,
                        card1: images.get(players[3].card1), card2: images.get(players[3].card2), playerChips: playerChips[3]}}
                        socket={socket} winner={winners[3]} handStrength={(handStrengths.length < 1) ? '' : handStrengths[3]} />
            <PlayerSlot currPlayer={(players.length < 5) ? {inUse:0} : {username:players[4].username, inUse: 5,
                        card1: images.get(players[4].card1), card2: images.get(players[4].card2), playerChips: playerChips[4]}}
                        socket={socket} winner={winners[4]} handStrength={(handStrengths.length < 1) ? '' : handStrengths[4]} />
            <PlayerSlot currPlayer={(players.length < 6) ? {inUse:0} : {username:players[5].username, inUse: 6,
                        card1: images.get(players[5].card1), card2: images.get(players[5].card2), playerChips: playerChips[5]}}
                        socket={socket} winner={winners[5]} handStrength={(handStrengths.length < 1) ? '' : handStrengths[5]} />
            <PlayerSlot currPlayer={(players.length < 7) ? {inUse:0} : {username:players[6].username, inUse: 7,
                        card1: images.get(players[6].card1), card2: images.get(players[6].card2), playerChips: playerChips[6]}}
                        socket={socket} winner={winners[6]} handStrength={(handStrengths.length < 1) ? '' : handStrengths[6]} />
            <PlayerSlot currPlayer={(players.length < 8) ? {inUse:0} : {username:players[7].username, inUse: 8,
                        card1: images.get(players[7].card1), card2: images.get(players[7].card2), playerChips: playerChips[7]}}
                        socket={socket} winner={winners[7]} handStrength={(handStrengths.length < 1) ? '' : handStrengths[7]} />
            <PlayerSlot currPlayer={(players.length < 9) ? {inUse:0} : {username:players[8].username, inUse: 9,
                        card1: images.get(players[8].card1), card2: images.get(players[8].card2), playerChips: playerChips[8]}}
                        socket={socket} winner={winners[8]} handStrength={(handStrengths.length < 1) ? '' : handStrengths[8]} />
            <PlayerSlot currPlayer={(players.length < 10) ? {inUse:0} : {username:players[9].username, inUse: 10,
                        card1: images.get(players[9].card1), card2: images.get(players[9].card2), playerChips: playerChips[9]}}
                        socket={socket} winner={winners[9]} handStrength={(handStrengths.length < 1) ? '' : handStrengths[9]} />
        </div>
    )
}

export default PlayerSlots;
