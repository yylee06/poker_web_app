import './Board.css';
import images from '../images/images';
import { useState, useEffect, useCallback } from 'react';

//currentDealer: index of the current owner of the dealer chip
function Dealer({ socket }) {
    const [dealer, setDealer] = useState(-1);

    const callbackDealer = useCallback(() => {
        function getDealer() {
          fetch('http://localhost:3080/dealer')
            .then(res => res.json())
            .then((retrievedMessage) => {
              setDealer(retrievedMessage.dealer)
            })
        }
    
        getDealer()
    }, [])

    useEffect(() => {
        console.log("Dealer event listeners added!")
    
        function handleDealer(event) {
            const received_message = JSON.parse(event.data)
            if (received_message.event === "first_turn") {
                callbackDealer()
            }
        }
    
        socket.addEventListener('message', handleDealer)

        return () => { socket.removeEventListener('message', handleDealer) }
    }, [callbackDealer]);

    return (
        <div>
            <div className="card-slot">
                <img src={!board.first ? images.get("Empty") : images.get(board.first)} className="card" alt=""></img>
            </div>
            <div className="card-slot">
                <img src={!board.second ? images.get("Empty") : images.get(board.second)} className="card" alt=""></img>
            </div>
            <div className="card-slot">
                <img src={!board.third ? images.get("Empty") : images.get(board.third)} className="card" alt=""></img>
            </div>
            <div className="card-slot">
                <img src={!board.fourth ? images.get("Empty") : images.get(board.fourth)} className="card" alt=""></img>
            </div>
            <div className="card-slot">
                <img src={!board.fifth ? images.get("Empty") : images.get(board.fifth)} className="card" alt=""></img>
            </div>
        </div>
    );
}

export default Dealer;