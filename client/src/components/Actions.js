import './Actions.css'
import { useState, useEffect, useCallback } from 'react'
import { useForm } from "react-hook-form"

function Actions({ socket }) {
    const { register, handleSubmit, getValues, reset } = useForm();
    const [showRaiseForm, setShowRaiseForm] = useState(0);
    const [highestBet, setHighestBet] = useState(0);
    const [chipDifferential, setChipDifferential] = useState(0);
    const [currTableChips, setCurrTableChips] = useState(0);
    const [currPlayerChips, setCurrPlayerChips] = useState(0);
    const [buttonDisabled, setButtonDisabled] = useState(0);

    const openRaiseForm = () => setShowRaiseForm(1);
    const closeRaiseForm = () => setShowRaiseForm(0);

    //sends login token to server, receives table chips and player chips of this user, for dynamic rendering of call button
    const callbackCurrentChips = useCallback(() => {
        const token_unparsed = sessionStorage.getItem('ingame-token')
        const token_parsed = JSON.parse(token_unparsed)
        const player_headers = {'Accept': 'application/json', 'Content-Type': 'application/json'};

        function getCurrentChips() {
            fetch('http://54.91.205.171:3080/current_chips', {method: 'POST', body: JSON.stringify({token: token_parsed?.token}), headers: player_headers})
            .then(res => res.json())
            .then((retrievedMessage) => {
                if (retrievedMessage.auth === 1) {
                    setCurrTableChips(retrievedMessage.tableChips)
                    setCurrPlayerChips(retrievedMessage.playerChips)
                }
            })
        }

        getCurrentChips()
    }, [])

    useEffect(() => {
        fetch('http://54.91.205.171:3080/highest_bet')
            .then(res => res.json())
            .then((retrievedMessage) => {
                setHighestBet(retrievedMessage.highest_bet)
            })
    }, [])

    useEffect(() => {
        setChipDifferential((highestBet - currTableChips) < currPlayerChips ? highestBet - currTableChips : currPlayerChips)
    }, [highestBet, currTableChips, currPlayerChips])

    const token_unparsed = sessionStorage.getItem('ingame-token')
    const token_parsed = JSON.parse(token_unparsed)
    const player_headers = {'Accept': 'application/json', 'Content-Type': 'application/json'};

    //raise
    function onSubmit() {
        //disable buttons, and re-enable after 500ms
        setButtonDisabled(1)
        setTimeout(() => {
            setButtonDisabled(0)
        }, 500)
        
        let raise = getValues();
        let raise_amount = parseInt(raise.amount)
        const raise_body = JSON.stringify({token: token_parsed?.token, amount: raise_amount});

        fetch('http://54.91.205.171:3080/raise', {method: 'POST', body: raise_body, headers: player_headers})
            .then(res => res.json())
            .then((retrievedMessage) => {
                if (retrievedMessage.auth === 1) {
                    console.log(retrievedMessage.message)
                    setChipDifferential(0)
                }
            })
            .catch((err) => {
                console.log(err)
            })
        
        reset()
        closeRaiseForm()
    }

    function doAction(action) {
        //disable buttons, and re-enable after 500ms
        setButtonDisabled(1)
        setTimeout(() => {
            setButtonDisabled(0)
        }, 500)

        switch(action) {
            case "check":
                fetch('http://54.91.205.171:3080/check', {method: 'POST', body: JSON.stringify({token: token_parsed?.token}), headers: player_headers})
                    .then(res => res.json())
                    .then((retrievedMessage) => {
                        if (retrievedMessage.auth === 1) {
                            console.log(retrievedMessage.message)
                        }
                    })
                    .catch((err) => {
                        console.log(err)
                    })
                break;
            case "call":
                fetch('http://54.91.205.171:3080/call', {method: 'POST', body: JSON.stringify({token: token_parsed?.token}), headers: player_headers})
                    .then(res => res.json())
                    .then((retrievedMessage) => {
                        if (retrievedMessage.auth === 1) {
                            console.log(retrievedMessage.message)
                            setChipDifferential(0)
                        }
                    })
                    .catch((err) => {
                        console.log(err)
                    })
                break;
            case "fold":
                fetch('http://54.91.205.171:3080/fold', {method: 'POST', body: JSON.stringify({token: token_parsed?.token}), headers: player_headers})
                    .then(res => res.json())
                    .then((retrievedMessage) => {
                        if (retrievedMessage.auth === 1) {
                            console.log(retrievedMessage.message)
                            setChipDifferential(0)
                        }
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
                callbackCurrentChips()
                setHighestBet(received_message.highest_bet)
            }
        }
    
        socket.addEventListener('message', handleChips)

        return () => { socket.removeEventListener('message', handleChips) }
    }, [socket, callbackCurrentChips]);



    return (
        <div>
            <button className="raise-button" onClick={openRaiseForm}>Raise</button>
            <div style={{ visibility : (showRaiseForm === 1) ? "visible" : "hidden" }} className="raise-popup">
                <form onSubmit={handleSubmit(onSubmit)} className="raise-form-container">
                    <label className="form_label" htmlFor="amount"><b>Raise To:</b></label>
                    <input type="number" placeholder="Chips to Raise" name="amount" {...register("amount")} min={highestBet + 20} required/>
                    <div className="btn-container">
                        <button type="submit" className="btn" disabled={buttonDisabled}>Raise</button>
                        <button type="button" className="btn cancel" onClick={closeRaiseForm}>Cancel</button>
                    </div>
                </form>
            </div>
            <button className="check-button" disabled={buttonDisabled} onClick={() => doAction("check")}>Check</button>
            <button className="call-button" disabled={buttonDisabled} onClick={() => doAction("call")}>{(chipDifferential === 0) ? ("Call") : ("Call " + chipDifferential)}</button>
            <button className="fold-button" disabled={buttonDisabled} onClick={() => doAction("fold")}>Fold</button>
        </div>
    )
}

export default Actions;