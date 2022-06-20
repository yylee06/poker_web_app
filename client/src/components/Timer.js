import { useState, useEffect, useRef } from 'react'
import './Timer.css'
const ALLOTTED_TIME = 30

//turn = index of user currently on timer
function Timer({ socket }) {
    const [timer, setTimer] = useState(0)
    const [turn, setTurn] = useState(-1)
    const proxy_timer = useRef(0)
    console.log(turn)

    useEffect(() => {
        console.log("Timer turn event listeners added!")
    
        function handleTurn(event) {
            const received_message = JSON.parse(event.data)
            if (received_message.event === "next_turn") {
                setTurn(received_message.turn)
            }
            else if (received_message.event === "update_board") {
                //default value, essentially timer is hidden when turn is not progressing
                setTurn(-1)
            }
        }
    
        socket.addEventListener('message', handleTurn)

        return () => { socket.removeEventListener('message', handleTurn) }
    }, [socket]);

    useEffect(() => {
        console.log("Timer event re-rendered!")
        setTimer(ALLOTTED_TIME)
        proxy_timer.current = ALLOTTED_TIME

        const countdown = setInterval(() => {
            setTimer(lastTimer => lastTimer - 1)
            proxy_timer.current -= 1

            if (proxy_timer.current <= 0) {
                clearInterval(countdown)
            }
                
        }, 1000);

        return () => { clearInterval(countdown) }   
    }, [turn])

    //idea: set conditional as intervalExists, using useRef. (do later)
    if (timer) {
        return (
            <div className={"timer-loc-" + turn} id="timer">
                <h5>{timer}</h5>
            </div>
        )
    }

    return (null);
}

export default Timer;