import './PlayerSlot.css';
import PlayerChip from './PlayerChip';
import { useState, useEffect } from 'react'
import Timer from './Timer';

//currPlayer has parameters username, card1, card2, inUse, playerChips
//inUse doubles as a player index for timer (i.e. 1-10)
function PlayerSlot({ socket, currPlayer, winner }) {
  const [glow, setGlow] = useState(0)

  useEffect(() => {
    setGlow(winner)
  }, [winner])

  if (currPlayer.inUse) {
    return (
      <div className="player-slot" style={{boxShadow : (glow === 1) ? "0 0 10px #e1ed9e" : "none" }}>
        <div className="card-slot1">
          <img src={currPlayer.card1} className="card" alt=""></img>
        </div>
        <div className="card-slot2">
          <img src={currPlayer.card2} className="card" alt="" />
        </div>
        <h6 className="username">{currPlayer.username}</h6>
        <PlayerChip chips={currPlayer.playerChips} />
        <Timer socket={socket} playerIndex={currPlayer.inUse} />
      </div>
    );
  }

  return (null);
}

export default PlayerSlot;