import './Dealer.css';
import dealer_chip from '../assets/images/dealer_chip.png'
import { useState, useEffect, useCallback } from 'react';

//currentDealer: index of the current owner of the dealer chip
function Dealer({ socket }) {
    const [dealer, setDealer] = useState(0);

    const callbackDealer = useCallback(() => {
        function getDealer() {
          fetch('https://yunyeollee-server.com:3080/dealer')
            .then(res => res.json())
            .then((retrievedMessage) => {
              setDealer(retrievedMessage.dealer)
            })
        }
    
        getDealer()
    }, [])

    useEffect(() => {
        function handleDealer(event) {
            const received_message = JSON.parse(event.data)
            if (received_message.event === "first_turn") {
                callbackDealer()
            }
        }
    
        socket.addEventListener('message', handleDealer)

        return () => { socket.removeEventListener('message', handleDealer) }
    }, [socket, callbackDealer]);

    return (
        <div>
            <div className={"dealer_slot-loc-" + dealer} id="dealer_slot">
                <img src={dealer_chip} className="chip" alt="" />
            </div>
        </div>
    );
}

export default Dealer;