import React from 'react';
import Login from './Login';
import Register from './Register';
import Withdraw from './Withdraw';
import Deposit from './Deposit';
import App from './App';
import useLoginToken from './UseLoginToken';

function Components() {
  const { loginToken, setLoginToken } = useLoginToken();

  function onLogout() {
    //removes token and clears session storage, might find less redundant way to do this later
    setLoginToken({})
    sessionStorage.clear()
  }

  if (!loginToken) {
    return (
      <div>
        <App />
        <Login setLoginToken={setLoginToken} />
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
