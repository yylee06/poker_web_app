import './PlayerSlot.css';
import React from 'react';

//currPlayer has parameters username, card1, card2, inUse
function PlayerSlot({ currPlayer }) {

  if (currPlayer.inUse) {
    return (
      <div className="player-slot">
        <div className="card-slot1">
          <img src={currPlayer.card1} className="card" alt=""></img>
        </div>
        <div className="card-slot2">
          <img src={currPlayer.card2} className="card" alt="" />
        </div>
        <h6 className="username">{currPlayer.username}</h6>
      </div>
    );
  }

  return (null);
}

export default PlayerSlot;