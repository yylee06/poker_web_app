import './Board.css';
import images from '../assets/images/images';
import { useState, useEffect, useCallback, useRef } from 'react';
import audiofiles from '../assets/audio/audiofiles';

function Board({ socket }) {
    const [board, setBoard] = useState({first: "Empty", second: "Empty", third: "Empty", fourth: "Empty", fifth: "Empty"});
    const deal_flop_audio = useRef(new Audio(audiofiles.get('deal_flop')))
    const deal_card_audio = useRef(new Audio(audiofiles.get('deal_card')))

    const callbackBoard = useCallback(() => {
        function getBoard() {
          fetch('https://yunyeollee-server.com:3080/board_state')
            .then(res => res.json())
            .then((retrievedMessage) => {
              setBoard(retrievedMessage)
            })
        }
    
        getBoard()
    }, [])

    useEffect(() => {
        callbackBoard()
    }, [callbackBoard])

    //plays dealing audio files when board updates (except when board is cleared, hence the conditionals)
    useEffect(() => {
        if (board.third !== "Empty" && board.fourth === "Empty") {
            deal_flop_audio.current.play()
        }
        else if (board.fourth !== "Empty") {
            deal_card_audio.current.play()
        }
    }, [board])

    useEffect(() => {
        function handleBoard(event) {
            const received_message = JSON.parse(event.data)
            if (received_message.event === "update_board" || received_message.event === "first_turn" || received_message.event === "game_over") {
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