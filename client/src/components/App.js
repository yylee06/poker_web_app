import './App.css';
import PlayerSlots from './PlayerSlots';
import Actions from './Actions';
import Dealer from './Dealer';
import TableChips from './TableChips';
import Timer from './Timer';
import Board from './Board';
import Pot from './Pot';
import table from '../images/poker_table.png';
//images is a map of all cards, including the table and player assets

function App({ socket, ingameToken, setIngameToken }) {
  console.log("Rendering App!")

  if (!ingameToken) {
    return (
      <div className="App">
      <header className="App-header">
        <PlayerSlots socket={socket} setIngameToken={setIngameToken} />
        <TableChips socket={socket} />
        <div className="poker-table-container">
          <Pot socket={socket} />
          <img src={table} className="poker-table" alt="" />
          <Board socket={socket}/>
        </div>
      </header>
    </div>
    )
  }

  return (
    <div className="App">
      <header className="App-header">
        <PlayerSlots socket={socket} setIngameToken={setIngameToken} />
        <TableChips socket={socket} />
        <Actions socket={socket} />
        <Dealer socket={socket} />
        <Timer socket={socket} />
        <div className="poker-table-container">
          <Pot socket={socket} />
          <img src={table} className="poker-table" alt="" />
          <Board socket={socket}/>
        </div>
      </header>
    </div>
  );
}

export default App;
