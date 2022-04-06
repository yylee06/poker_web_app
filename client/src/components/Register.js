import './Register.css';
import React from 'react';
import { useForm } from "react-hook-form"

function Register() {
  const { register, handleSubmit, getValues } = useForm();
  const [show, setShow] = React.useState('');
  const openForm = () => setShow('1');
  const closeForm = () => setShow('');

  function onSubmit() {
    let user = getValues();
    const user_body = JSON.stringify({username: user.username, password: user.password});
    const user_headers = {'Accept': 'application/json', 'Content-Type': 'application/json'};

    fetch('http://localhost:3080/register', {method: 'POST', body: user_body, headers: user_headers})
        .then(res => res.json())
        .then(data => console.log(data))
    
    alert('User has been registered.');
  }

  return (
    <div>
      <button className="register-button" onClick={openForm}>Register</button>
      <div style={{ visibility : (show === '1') ? "visible" : "hidden" }} className="register-popup" id="myRegister">
        <form onSubmit={handleSubmit(onSubmit)} className="form-container">
          <h1>Register</h1>
          <label htmlFor="username"><b>Desired Username</b></label>
          <input type="text" placeholder="Desired Username" name="username" {...register("username")} required/>

          <label htmlFor="password"><b>Desired Password</b></label>
          <input type="password" placeholder="Desired Password" name="password" {...register("password")} required/>

          <button type="submit" className="btn">Register</button>
          <button type="button" className="btn cancel" onClick={closeForm}>Close</button>
        </form>
      </div>
    </div>
  );
}

export default Register;