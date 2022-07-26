import './TableChips.css';
import TableChip from './TableChip';
import { useState, useEffect, useCallback, useRef } from 'react';
import audiofiles from '../assets/audio/audiofiles';

function TableChips({ socket }) {
    const [tableChips, setTableChips] = useState([]);
    const totalChips = useRef(0);
    const totalNumPlayers = useRef(-1);
    const play_chips_audio = useRef(new Audio(audiofiles.get('play_chips')))
    const check_audio = useRef(new Audio(audiofiles.get('check')))
    
    const callbackTableChipsState = useCallback(() => {
        function getTableChipsState() {
          fetch('http://localhost:3080/table_chips')
            .then(res => res.json())
            .then((retrievedMessage) => {
                setTableChips(retrievedMessage.chips)

                //find sum of tableChips, if larger than last sum, this means a player has called/raised
                //if sum of tableChips and sum of numPlayers is the same as last cycle, a player has checked
                let newTotalChips = retrievedMessage.chips.reduce((a, b) => a + b, 0)
                let newTotalNumPlayers = retrievedMessage.num_players_ingame
                //boolean values denoting whether or not totalChips and totalNumPlayers remain the same between renders
                let totalChips_stagnant = (newTotalChips === totalChips.current)
                let totalNumPlayers_stagnant = (newTotalNumPlayers === totalNumPlayers.current)

                if (newTotalChips > totalChips.current && totalNumPlayers.current > 1) {
                    play_chips_audio.current.play()
                }
                else if (totalChips_stagnant && totalNumPlayers_stagnant && newTotalNumPlayers > 1 && retrievedMessage.current_turn !== -1) {
                    check_audio.current.play()
                }

                totalNumPlayers.current = newTotalNumPlayers
                totalChips.current = newTotalChips
            })
        }
    
        getTableChipsState()
    }, [])

    useEffect(() => {
        console.log("Table chips initially rendered.")
        play_chips_audio.current.volume = 0.5
        check_audio.current.volume = 0.5

        callbackTableChipsState()
    }, [callbackTableChipsState])

    useEffect(() => {
        console.log("Table chips event listeners added!")
    
        function handleTableChips(event) {
            const received_message = JSON.parse(event.data)
            if (received_message.event === "next_turn" || received_message.event === "game_over") {
                callbackTableChipsState()
            }
        }
    
        socket.addEventListener('message', handleTableChips)

        return () => { socket.removeEventListener('message', handleTableChips) }
    }, [socket, callbackTableChipsState]);


    return (
        <div>
            <TableChip chips={(tableChips.length < 1) ? 0 : tableChips[0]}/>
            <TableChip chips={(tableChips.length < 2) ? 0 : tableChips[1]}/>
            <TableChip chips={(tableChips.length < 3) ? 0 : tableChips[2]}/>
            <TableChip chips={(tableChips.length < 4) ? 0 : tableChips[3]}/>
            <TableChip chips={(tableChips.length < 5) ? 0 : tableChips[4]}/>
            <TableChip chips={(tableChips.length < 6) ? 0 : tableChips[5]}/>
            <TableChip chips={(tableChips.length < 7) ? 0 : tableChips[6]}/>
            <TableChip chips={(tableChips.length < 8) ? 0 : tableChips[7]}/>
            <TableChip chips={(tableChips.length < 9) ? 0 : tableChips[8]}/>
            <TableChip chips={(tableChips.length < 10) ? 0 : tableChips[9]}/>
        </div>
    )
}

export default TableChips;