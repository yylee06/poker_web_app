import React from 'react';
import Login from './Login';
import Register from './Register';
import Withdraw from './Withdraw';
import Deposit from './Deposit';
import App from './App';
import useToken from './UseToken';

function Components() {
  const { token, setToken } = useToken();

  function onLogout() {
    //removes token and clears session storage, might find less redundant way to do this later
    setToken({})
    sessionStorage.clear()
  }

  if (!token) {
    return (
      <div>
        <App />
        <Login setToken={setToken} />
        <Register />
      </div>
    )
  }

  return (
    <div>
      <App />
      <Withdraw />
      <Deposit />
      <button className="login-button" onClick={onLogout}>Logout</button>
    </div>
  );
}

export default Components;
