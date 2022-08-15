import './Withdraw.css';
import React from 'react';
import { useForm } from "react-hook-form"

function Withdraw() {
  const { register, handleSubmit, getValues, reset } = useForm();
  const [show, setShow] = React.useState('');
  const [chips, setChips] = React.useState('0');
  const openForm = () => setShow(1);
  const closeForm = () => setShow(0);

  React.useEffect(() => {
    const token_unparsed = sessionStorage.getItem('login-token')
    const token_parsed = JSON.parse(token_unparsed)
    const withdraw_headers = {'Accept': 'application/json', 'Content-Type': 'application/json'};

    fetch('https://54.91.205.171:3080/show_chips_bank', {method: 'POST', body: JSON.stringify({token: token_parsed?.token}), headers: withdraw_headers})
    .then(res => res.json())
    .then((retrievedMessage) => {
      if (retrievedMessage.auth === 1) {
        setChips(retrievedMessage.amount)
      }
      else {
        alert('Error: User does not have a valid number of chips.')
      }
    })
  }, [show]);

  function onSubmit() {
    const token_unparsed = sessionStorage.getItem('login-token')
    const token_parsed = JSON.parse(token_unparsed)
    const withdraw_headers = {'Accept': 'application/json', 'Content-Type': 'application/json'};

    let withdraw = getValues();
    let withdraw_amount = parseInt(withdraw.amount)
    const withdraw_body = JSON.stringify({token: token_parsed?.token, amount: withdraw_amount});

    fetch('https://54.91.205.171:3080/withdraw', {method: 'POST', body: withdraw_body, headers: withdraw_headers})
      .then(res => res.json())
      .then((retrievedMessage) => {
        if (retrievedMessage.auth === 1) {
          setChips(retrievedMessage.amount)
        }
        else {
          console.log(retrievedMessage.message)
          alert('User does not have sufficient chips.');
        }
      })
      
    reset()
  }

  return (
    <div>
      <button className="withdraw-button" onClick={openForm}>Withdraw Chips</button>
      <div style={{ visibility : (show === 1) ? "visible" : "hidden" }} className="withdraw-popup">
        <form onSubmit={handleSubmit(onSubmit)} className="form-container">
          <h3>Chips in Bank: </h3>
          <h3>{(!chips && chips !== 0) ? "Loading..." : chips}</h3>
          <label className="form_label" htmlFor="amount"><b>Requested Chips:</b></label>

          <input type="number" placeholder="Requested Chips" name="amount" {...register("amount")} min="1" required/>
          <button type="submit" className="btn">Withdraw</button>
          <button type="button" className="btn cancel" onClick={closeForm}>Close</button>
        </form>
      </div>
    </div>
  );
}

export default Withdraw;