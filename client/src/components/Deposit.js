import './Deposit.css';
import { useState, useEffect} from 'react';
import { useForm } from "react-hook-form"

function Deposit() {
  const { register, handleSubmit, getValues, reset } = useForm();
  const [show, setShow] = useState(0);
  const [chips, setChips] = useState('0');
  const openForm = () => setShow(1);
  const closeForm = () => setShow(0);

  useEffect(() => {
    const token_unparsed = sessionStorage.getItem('login-token')
    const token_parsed = JSON.parse(token_unparsed)
    const deposit_headers = {'Accept': 'application/json', 'Content-Type': 'application/json'};

    fetch('https://yunyeollee-server.com:3080/show_chips_useable', {method: 'POST', body: JSON.stringify({token: token_parsed?.token}), headers: deposit_headers})
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
    const deposit_headers = {'Accept': 'application/json', 'Content-Type': 'application/json'};

    let deposit = getValues();
    let deposit_amount = parseInt(deposit.amount)
    const deposit_body = JSON.stringify({token: token_parsed?.token, amount: deposit_amount});

    fetch('https://yunyeollee-server.com:3080/deposit', {method: 'POST', body: deposit_body, headers: deposit_headers})
      .then(res => res.json())
      .then((retrievedMessage) => {
        if (retrievedMessage.auth === 1) {
          setChips(retrievedMessage.amount)
        }
        else {
          alert('User does not have sufficient chips.');
        }
    })

    reset()
  }

  return (
    <div>
      <button className="deposit-button" onClick={openForm}>Deposit Chips</button>
      <div style={{ visibility : (show === 1) ? "visible" : "hidden" }} className="deposit-popup">
        <form onSubmit={handleSubmit(onSubmit)} className="form-container">
          <h3>Chips on Hand: </h3>
          <h3>{(!chips && chips !== 0) ? "Loading..." : chips}</h3>
          <label className="form_label" htmlFor="amount"><b>Requested Deposit:</b></label>

          <input type="number" placeholder="Requested Chips" name="amount" {...register("amount")} min="1" required/>
          <button type="submit" className="btn">Deposit</button>
          <button type="button" className="btn cancel" onClick={closeForm}>Close</button>
        </form>
      </div>
    </div>
  );
}

export default Deposit;