import './Actions.css'
import { useState, useEffect } from 'react'
import { useForm } from "react-hook-form"

function Actions({ socket }) {
    const { register, handleSubmit, getValues } = useForm();
    const [showRaiseForm, setShowRaiseForm] = useState(0);
    const [highestBet, setHighestBet] = useState(0);

    const token_unparsed = sessionStorage.getItem('ingame-token')
    const token_parsed = JSON.parse(token_unparsed)
    const player_headers = {'Accept': 'application/json', 'Content-Type': 'application/json'};

    const openRaiseForm = () => setShowRaiseForm(1);
    const closeRaiseForm = () => setShowRaiseForm(0);

    //raise
    function onSubmit() {
        let raise = getValues();
        let raise_amount = parseInt(raise.amount)
        const raise_body = JSON.stringify({token: token_parsed?.token, amount: raise_amount});

        fetch('http://localhost:3080/raise', {method: 'POST', body: raise_body, headers: player_headers})
            .then(res => res.json())
            .then((retrievedMessage) => {
                console.log(retrievedMessage.message)
            })
            .catch((err) => {
                console.log(err)
            })
    }

    function doAction(action) {
        switch(action) {
            case "check":
                fetch('http://localhost:3080/check', {method: 'POST', body: JSON.stringify({token: token_parsed?.token}), headers: player_headers})
                    .then(res => res.json())
                    .then((retrievedMessage) => {
                        console.log(retrievedMessage.message)
                    })
                    .catch((err) => {
                        console.log(err)
                    })
                break;
            case "call":
                fetch('http://localhost:3080/call', {method: 'POST', body: JSON.stringify({token: token_parsed?.token}), headers: player_headers})
                    .then(res => res.json())
                    .then((retrievedMessage) => {
                        console.log(retrievedMessage.message)
                    })
                    .catch((err) => {
                        console.log(err)
                    })
                break;
            case "fold":
                fetch('http://localhost:3080/fold', {method: 'POST', body: JSON.stringify({token: token_parsed?.token}), headers: player_headers})
                    .then(res => res.json())
                    .then((retrievedMessage) => {
                        console.log(retrievedMessage.message)
                    })
                    .catch((err) => {
                        console.log(err)
                    })
                break;
            default:
        }
    }

    useEffect(() => {
        console.log("Actions event listeners added!")
    
        function handleChips(event) {
            const received_message = JSON.parse(event.data)
            if (received_message.event === "next_turn") {
                setHighestBet(received_message.highest_bet)
            }
        }
    
        socket.addEventListener('message', handleChips)

        return () => { socket.removeEventListener('message', handleChips) }
    }, [socket]);



    return (
        <div>
            <button className="raise-button" onClick={openRaiseForm}>Raise</button>
            <div style={{ visibility : (showRaiseForm === 1) ? "visible" : "hidden" }} className="raise-popup">
                <form onSubmit={handleSubmit(onSubmit)} className="raise-form-container">
                    <label className="form_label" htmlFor="amount"><b>Raise To:</b></label>
                    <input type="number" placeholder="Chips to Raise" name="amount" {...register("amount")} min={highestBet + 20} required/>
                    <div className="btn-container">
                        <button type="submit" className="btn">Raise</button>
                        <button type="button" className="btn cancel" onClick={closeRaiseForm}>Cancel</button>
                    </div>
                </form>
            </div>
            <button className="check-button" onClick={() => doAction("check")}>Check</button>
            <button className="call-button" onClick={() => doAction("call")}>Call</button>
            <button className="fold-button" onClick={() => doAction("fold")}>Fold</button>
        </div>
    )
}

export default Actions;