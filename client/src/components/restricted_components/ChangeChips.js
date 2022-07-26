import { useState } from 'react';
import { useForm } from "react-hook-form";

function ChangeChips() {
  const { register, handleSubmit, getValues } = useForm();
  const [show, setShow] = useState(0);
  const openForm = () => setShow(1);
  const closeForm = () => setShow(0);

  function onSubmitChangeChips() {
    const token_unparsed = sessionStorage.getItem('login-token')
    const token_parsed = JSON.parse(token_unparsed)
    const token_headers = {'Accept': 'application/json', 'Content-Type': 'application/json'};

    let submitted_values = getValues();
    let chips_amount = parseInt(submitted_values.amount)
    const submitted_body = JSON.stringify({token: token_parsed?.token, username: submitted_values.username, amount: chips_amount});

    fetch('http://localhost:3080/change_chips', {method: 'POST', body: submitted_body, headers: token_headers})
      .then(res => res.json())
      .then((retrievedMessage) => {
        alert(retrievedMessage.message)
    })
  }

  return (
    <div>
      <button className="change-chips-button" onClick={openForm}>Change Chips</button>
      <div style={{ visibility : (show === 1) ? "visible" : "hidden" }} className="admin-popup">
        <form onSubmit={handleSubmit(onSubmitChangeChips)} className="admin-form-container">
          <h1>Change User Chips</h1>
          <label htmlFor="username"><b>Targetted Username</b></label>
          <input type="text" placeholder="Enter Username" name="username" {...register("username")} maxLength={12} required/>

          <label htmlFor="chips"><b>Set Chips To</b></label>
          <input type="number" placeholder="Set Chips To" name="amount" {...register("amount")} min="1" required/>

          <button type="submit" className="btn">Submit</button>
          <button type="button" className="btn cancel" onClick={closeForm}>Close</button>
        </form>
      </div>
    </div>
  );
}

export default ChangeChips;