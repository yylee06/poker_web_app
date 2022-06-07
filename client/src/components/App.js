import './App.css';
import { useState, useEffect, useCallback } from 'react';
import PlayerSlots from './PlayerSlots';
import Actions from './Actions';
import Dealer from './Dealer';
import TableChips from './TableChips';
import Timer from './Timer';
//images is a map of all cards, including the table and player assets

function App({ socket, ingameToken, setIngameToken }) {
  console.log("Rendering App!")

  const [playerIndex, setPlayerIndex] = useState(-2); //move to timer
  const [playerTurn, setPlayerTurn] = useState(-1); //move to timer



  const callbackReadyPlayerState = useCallback(() => {
    function getReadyPlayerState() {
      fetch('http://localhost:3080/ready_players')
        .then(res => res.json())
        .then((retrievedMessage) => {
          setReadyPlayers(retrievedMessage.ready_players)
        })
    }

    getReadyPlayerState()
  }, [])



  



  //Initializes player slots on mount
  useEffect(() => {
    callbackPlayerChipsState();
    callbackTableChipsState();
    callbackBoardState();
  }, [callbackPlayerState, callbackPlayerChipsState, callbackTableChipsState, callbackBoardState]);

  //Updates player slots when new players are added
  useEffect(() => {
    console.log("Event listeners added!")

    socket.addEventListener('message', (event) => {
      const received_message = JSON.parse(event.data)
      switch(received_message.event) {

        case "next_turn":
          setPlayerTurn(received_message.turn)
          break;
        default:
      }
    })

    return () => { removeEventListener()
    }
  }, [socket, callbackPlayerState, callbackPlayerIndex, callbackPlayerChipsState, callbackTableChipsState, callbackReadyPlayerState, callbackBoardState, callbackIngameToken]);

  if (!ingameToken) {
    return (
      <div className="App">
      <header className="App-header">
        <PlayerSlots players={players} playerChips={playerChips} />
        <div className="ready-player-fraction-container">
          <h6 className="ready-player-fraction">{!readyPlayers ? " " : readyPlayers}</h6>
        </div>
        <div className="poker-table-container">
          <img src={images.get('Table')} className="poker-table" alt="" />
          <Board />
        </div>
      </header>
    </div>
    )
  }

  return (
    <div className="App">
      <header className="App-header">
        <PlayerSlots socket={socket} setIngameToken={setIngameToken} />
        <Actions socket={socket} />
        <Dealer socket={socket} />
        <TableChips tableChips={tableChips} />
        <Timer turn={playerTurn} />
        <div className="ready-player-fraction-container">
          <h6 className="ready-player-fraction">{!readyPlayers ? " " : readyPlayers}</h6>
        </div>
        <div className="poker-table-container">
          <img src={images.get('Table')} className="poker-table" alt="" />
          <Board />
        </div>
      </header>
    </div>
  );
}

export default App;
