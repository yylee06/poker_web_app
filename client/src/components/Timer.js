import { useState, useEffect, useRef } from 'react'
import './Timer.css'
const ALLOTTED_TIME = 25

//turn = index of user currently on timer
function Timer({ socket, playerIndex }) {
    const [timer, setTimer] = useState(0)
    //turn is a stateful value that holds the player index of the user who's turn it is
    const [turn, setTurn] = useState(-1)
    //playerTurn is a stateful value that holds whether or not it is this specific user's turn
    const player_turn = useRef(false)
    const proxy_timer = useRef(0)

    useEffect(() => {
        console.log("Timer turn event listeners added!")
    
        function handleTurn(event) {
            const received_message = JSON.parse(event.data)
            if (received_message.event === "next_turn") { 
                setTurn(received_message.turn)
                if (received_message.turn === (playerIndex - 1)) {
                    player_turn.current = true      
                }
                else {
                    player_turn.current = false
                }
            }
            else if (received_message.event === "update_board" || received_message.event === "first_turn") {
                //default value, essentially timer is hidden when turn is not progressing
                //also used such that stateful value "turn" is toggled, causing re-render on edge-cases
                setTurn(false)
            }
            else if (received_message.event === "game_over") {
                player_turn.current = false
            }
        }
    
        socket.addEventListener('message', handleTurn)

        return () => { socket.removeEventListener('message', handleTurn) }
    }, [socket, playerIndex]);

    useEffect(() => {
        console.log("Timer event re-rendered!")
        setTimer(player_turn.current ? ALLOTTED_TIME : 0)
        proxy_timer.current = (player_turn.current ? ALLOTTED_TIME : 0)

        const countdown = setInterval(() => {
            setTimer(lastTimer => lastTimer - 1)
            proxy_timer.current -= 1

            if (proxy_timer.current <= 0) {
                clearInterval(countdown)
            }

            if (!player_turn.current) {
                clearInterval(countdown)
            }
                
        }, 1000);

        return () => { clearInterval(countdown) }   
    }, [turn])

    //idea: set conditional as intervalExists, using useRef. (do later)
    if (player_turn.current) {
        return (
            <div className="timer_container">
                <div className="timer_bar_container">
                    <div className="timer_bar" style={{width : (timer > 0) ? (timer * 4) + "%" : 0}} ></div>
                </div>
            </div>
    
        )
    }

    return (null);
}

export default Timer;