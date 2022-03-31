import './Login.css';
import React from 'react';
import { useForm } from "react-hook-form"

function Login() {
  const { register, handleSubmit } = useForm();
  const [show, setShow] = React.useState(null);
  const openForm = () => setShow(true);
  const closeForm = () => setShow(false);

  return (
    <div>
      <button className="login-button" onClick={openForm}>Login</button>
      <div style={{ visibility : show ? "visible" : "hidden" }} className="login-popup" id="myLogin">
        <form onSubmit={handleSubmit(data => console.log(data))} className="form-container">
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
  );
}

export default Login;