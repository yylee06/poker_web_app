import './Login.css';
import React from 'react';
import Register from './Register';
import { useForm } from "react-hook-form";
import UseToken from './UseToken';

function Login() {
  const { token, setToken } = UseToken();

  const { register, handleSubmit, getValues } = useForm();
  const [show, setShow] = React.useState('');
  const openForm = () => setShow('1');
  const closeForm = () => setShow('');

  function onLogout() {
    //removes token and clears session storage, might find less redundant way to do this later
    setToken({})
    sessionStorage.clear()
  }

  function onSubmit() {
    let user = getValues();
    const user_body = JSON.stringify({username: user.username, password: user.password});
    const user_headers = {'Accept': 'application/json', 'Content-Type': 'application/json'};

    fetch('http://localhost:3080/login', {method: 'POST', body: user_body, headers: user_headers})
        .then((res) => res.json())
        .then((retrievedMessage) => {
          if (retrievedMessage.auth === 1) {
            closeForm()
            setToken({token: retrievedMessage.token})
            sessionStorage.setItem("username", JSON.stringify({username: user.username}))
            console.log("You have logged in.")
          }
          else {
            alert('Username or password is incorrect.')
          }
        })
  }

  if (!token) {
    return (
      <div>
        <div>
          <button className="login-button" onClick={openForm}>Login</button>
          <div style={{ visibility : (show === '1') ? "visible" : "hidden" }} className="login-popup" id="myLogin">
            <form onSubmit={handleSubmit(onSubmit)} className="form-container">
              <h1>Login</h1>
              <label htmlFor="username"><b>Username</b></label>
              <input type="text" placeholder="Enter Username" name="username" {...register("username")} required/>

              <label htmlFor="password"><b>Password</b></label>
              <input type="password" placeholder="Enter Password" name="password" {...register("password")} required/>

              <button type="submit" className="btn">Login</button>
              <button type="button" className="btn cancel" onClick={closeForm}>Close</button>
            </form>
          </div>
        </div>
        <Register />
      </div>
    );
  }

  return (
    <div>
      <button className="login-button" onClick={onLogout}>Logout</button>
    </div>
  )
}

export default Login;