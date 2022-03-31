import './Register.css';
import React from 'react';
import { useForm } from "react-hook-form"

function Register() {
  const { register, handleSubmit } = useForm();
  const [show, setShow] = React.useState(null);
  const openForm = () => setShow(true);
  const closeForm = () => setShow(false);

  return (
    <div>
      <button className="register-button" onClick={openForm}>Register</button>
      <div style={{ visibility : show ? "visible" : "hidden" }} className="register-popup" id="myRegister">
        <form onSubmit={handleSubmit(data => console.log(data))} className="form-container">
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