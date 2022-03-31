import './App.css';
import React from 'react';
import poker_table from '../images/poker_table.png'

function App() {
  const [data, setData] = React.useState(null);

  React.useEffect(() => {
    fetch("/api")
      .then((res) => res.json())
      .then((data) => setData(data.message));
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h4>ReactJS Show My Images Please</h4>
        <p>{!data ? "Loading..." : data}</p>
        <img src={poker_table} className="poker-table" alt="" />
        <p>Are my images above?</p>
      </header>
    </div>

  );
}

export default App;
