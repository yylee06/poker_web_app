import './App.css';
import React from 'react';
import images from '../images/images';
import PlayerSlot from './PlayerSlot';
//images is a map of all cards, including the table and player assets

function App({ socket }) {
  const [players, setPlayers] = React.useState([]);
  let [board, setBoard] = React.useState({});

  //sends game token, returns JSON object of players and respective cards (empty cards if not owned)
  function getPlayerState() {
    const token_unparsed = sessionStorage.getItem('login-token')
    const token_parsed = JSON.parse(token_unparsed)
    const player_headers = {'Accept': 'application/json', 'Content-Type': 'application/json'};

    fetch('http://localhost:3080/players', {method: 'POST', body: JSON.stringify({token: token_parsed?.token}), headers: player_headers})
    .then(res => res.json())
    .then((retrievedMessage) => {
      let current_players = [];
      for (let i = 0; i < retrievedMessage.players.length; i++) {
        current_players[i] = {username: retrievedMessage.players[i], chips: retrievedMessage.chips[i], card1: retrievedMessage.cards[i][0], card2: retrievedMessage.cards[i][1]}
      }
      setPlayers(current_players)
    })
  }

  //Initializes player slots on mount
  React.useEffect(() => {
    getPlayerState();
  }, []);

  //Updates player slots when new players are added
  React.useEffect(() => {
    console.log("Event listeners added!")
    socket.addEventListener('message', (event) => {
      const received_message = JSON.parse(event.data)
      if (received_message.event === "player") {
        getPlayerState();
      }
    })
  }, [socket]);

  React.useEffect(() => {
    fetch("/board_state")
      .then((res) => res.json())
      .then((board) => setBoard(board));
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <div className="poker-table-container">
          <img src={images.get('Table')} className="poker-table" alt="" />
          <div className="card-slot">
            <img src={!board.first ? images.get("Empty") : images.get(board.first)} className="card" alt=""></img>
          </div>
          <div className="card-slot">
            <img src={!board.second ? images.get("Empty") : images.get(board.second)} className="card" alt=""></img>
          </div>
          <div className="card-slot">
            <img src={!board.third ? images.get("Empty") : images.get(board.third)} className="card" alt=""></img>
          </div>
          <div className="card-slot">
            <img src={!board.fourth ? images.get("Empty") : images.get(board.fourth)} className="card" alt=""></img>
          </div>
          <div className="card-slot">
            <img src={!board.fifth ? images.get("Empty") : images.get(board.fifth)} className="card" alt=""></img>
          </div>
        </div>
        <PlayerSlot currPlayer={(players.length < 1) ? {inUse:0} : {username:players[0].username, chips:players[0].chips, inUse: 1,
                                card1: images.get(players[0].card1), card2: images.get(players[0].card2)}} />
        <PlayerSlot currPlayer={(players.length < 2) ? {inUse:0} : {username:players[1].username, chips:players[1].chips, inUse: 1,
                                card1: images.get(players[1].card1), card2: images.get(players[1].card2)}} />
        <PlayerSlot currPlayer={(players.length < 3) ? {inUse:0} : {username:players[2].username, chips:players[2].chips, inUse: 1,
                                card1: images.get(players[2].card1), card2: images.get(players[2].card2)}} />
        <PlayerSlot currPlayer={(players.length < 4) ? {inUse:0} : {username:players[3].username, chips:players[3].chips, inUse: 1,
                                card1: images.get(players[3].card1), card2: images.get(players[3].card2)}} />
        <PlayerSlot currPlayer={(players.length < 5) ? {inUse:0} : {username:players[4].username, chips:players[4].chips, inUse: 1,
                                card1: images.get(players[4].card1), card2: images.get(players[4].card2)}} />
        <PlayerSlot currPlayer={(players.length < 6) ? {inUse:0} : {username:players[5].username, chips:players[5].chips, inUse: 1,
                                card1: images.get(players[5].card1), card2: images.get(players[5].card2)}} />
        <PlayerSlot currPlayer={(players.length < 7) ? {inUse:0} : {username:players[6].username, chips:players[6].chips, inUse: 1,
                                card1: images.get(players[6].card1), card2: images.get(players[6].card2)}} />
        <PlayerSlot currPlayer={(players.length < 8) ? {inUse:0} : {username:players[7].username, chips:players[7].chips, inUse: 1,
                                card1: images.get(players[7].card1), card2: images.get(players[7].card2)}} />
        <PlayerSlot currPlayer={(players.length < 9) ? {inUse:0} : {username:players[8].username, chips:players[8].chips, inUse: 1,
                                card1: images.get(players[8].card1), card2: images.get(players[8].card2)}} />
        <PlayerSlot currPlayer={(players.length < 10) ? {inUse:0} : {username:players[9].username, chips:players[9].chips, inUse: 1,
                                card1: images.get(players[9].card1), card2: images.get(players[9].card2)}} />
      </header>
    </div>

  );
}

export default App;
