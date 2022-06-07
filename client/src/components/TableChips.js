import './TableChips.css';
import TableChip from './TableChip';
import { useState, useEffect, useCallback } from 'react';

function TableChips({ socket }) {
    const [tableChips, setTableChips] = useState([]);
    
    const callbackTableChipsState = useCallback(() => {
        function getTableChipsState() {
          fetch('http://localhost:3080/table_chips')
            .then(res => res.json())
            .then((retrievedMessage) => {
              setTableChips(retrievedMessage.chips)
            })
        }
    
        getTableChipsState()
    }, [])

    useEffect(() => {
        console.log("Table chips event listeners added!")
    
        function handleTableChips(event) {
            const received_message = JSON.parse(event.data)
            if (received_message.event === "next_turn") {
                callbackTableChipsState()
            }
        }
    
        socket.addEventListener('message', handleTableChips)

        return () => { socket.removeEventListener('message', handleTableChips) }
    }, [callbackTableChipsState]);


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