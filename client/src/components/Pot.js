import './Pot.css';
import { useState, useEffect, useCallback } from 'react';

function Pot({ socket }) {
    const [pot, setPot] = useState(0)

    const callbackPot = useCallback(() => {
        function getPot() {
          fetch('http://54.91.205.171:3080/pot')
            .then(res => res.json())
            .then((retrievedMessage) => {
              setPot(retrievedMessage.pot)
            })
        }
    
        getPot()
    }, [])

    useEffect(() => {
        callbackPot()
    }, [callbackPot])

    useEffect(() => {
        console.log("Pot event listeners added!")
    
        function handlePot(event) {
            const received_message = JSON.parse(event.data)
            if (received_message.event === "next_turn" || received_message.event === "game_over") {
                callbackPot()
            }
        }
    
        socket.addEventListener('message', handlePot)

        return () => { socket.removeEventListener('message', handlePot) }
    }, [socket, callbackPot]);

    return (
        <div>
            <div className="pot-container">
                <h5 className="pot">{!pot ? 0 : pot}</h5>
            </div>
        </div>
    );
}

export default Pot;