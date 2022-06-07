import { useState, useEffect, useRef } from 'react'
import './Timer.css'
const ALLOTTED_TIME = 30

//turn = index of user current on timer
//myTurn = 1 or 0, 1 if current user's turn, 0 otherwise
function Timer({ socket }) {
    const [timer, setTimer] = useState(ALLOTTED_TIME)

    useEffect(() => {
        console.log("Timer event listeners added!")
    
        function handleTimer(event) {
            const received_message = JSON.parse(event.data)
            if (received_message.event === "next_turn") {
                const proxy_timer = useRef(ALLOTTED_TIME)

                const countdown = setInterval(() => {
                    
                })
            }
        }
    
        socket.addEventListener('message', handleDealer)

        return () => { socket.removeEventListener('message', handleDealer) }
    }, [callbackDealer]);

    useEffect(() => {
        const countdown = setInterval(() => {
            setTimer(lastTimer => lastTimer - 1)
            proxy_timer.current -= 1
            console.log(proxy_timer)
    
            if (proxy_timer.current <= 0) {
                clearInterval(countdown)
            }
        }, 1000);

        return () => { clearInterval(countdown) }
    }, [myTurn])

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