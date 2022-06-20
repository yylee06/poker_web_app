import './Board.css';
import images from '../images/images';
import { useState, useEffect, useCallback } from 'react';

function Board({ socket }) {
    const [board, setBoard] = useState({first: "Empty", second: "Empty", third: "Empty", fourth: "Empty", fifth: "Empty"});

    const callbackBoard = useCallback(() => {
        function getBoard() {
          fetch('http://localhost:3080/board_state')
            .then(res => res.json())
            .then((retrievedMessage) => {
              setBoard(retrievedMessage)
            })
        }
    
        getBoard()
    }, [])

    useEffect(() => {
        console.log("Board event listeners added!")
    
        function handleBoard(event) {
            const received_message = JSON.parse(event.data)
            if (received_message.event === "update_board") {
                callbackBoard()
            }
        }
    
        socket.addEventListener('message', handleBoard)

        return () => { socket.removeEventListener('message', handleBoard) }
    }, [socket, callbackBoard]);

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

export default Board;