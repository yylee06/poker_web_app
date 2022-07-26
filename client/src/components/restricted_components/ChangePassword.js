import { useState } from 'react';
import { useForm } from "react-hook-form";

function ChangePassword() {
  const { register, handleSubmit, getValues } = useForm();
  const [show, setShow] = useState(0);
  const openForm = () => setShow(1);
  const closeForm = () => setShow(0);

  function onSubmitChangePassword() {
    const token_unparsed = sessionStorage.getItem('login-token')
    const token_parsed = JSON.parse(token_unparsed)
    const token_headers = {'Accept': 'application/json', 'Content-Type': 'application/json'};

    let submitted_values = getValues();
    const submitted_body = JSON.stringify({token: token_parsed?.token, username: submitted_values.username, password: submitted_values.password});

    fetch('http://localhost:3080/change_password', {method: 'POST', body: submitted_body, headers: token_headers})
      .then(res => res.json())
      .then((retrievedMessage) => {
        alert(retrievedMessage.message)
    })
  }

  return (
    <div>
      <button className="change-password-button" onClick={openForm}>Change User Password</button>
      <div style={{ visibility : (show === 1) ? "visible" : "hidden" }} className="admin-popup">
        <form onSubmit={handleSubmit(onSubmitChangePassword)} className="admin-form-container">
          <h1>Change User Password</h1>
          <label htmlFor="username"><b>Targetted Username</b></label>
          <input type="text" placeholder="Enter Username" name="username" {...register("username")} maxLength={12} required/>

          <label htmlFor="password"><b>New Password</b></label>
          <input type="password" placeholder="Enter New Password" name="password" {...register("password")} maxLength={20} required/>

          <button type="submit" className="btn">Submit</button>
          <button type="button" className="btn cancel" onClick={closeForm}>Close</button>
        </form>
      </div>
    </div>
  );
}

export default ChangePassword;