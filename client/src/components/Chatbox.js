import './Chatbox.css';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useForm } from "react-hook-form";

function Chatbox({ socket }) {
  const [chatbox, setChatbox] = useState('Please be kind in chat! Or don\'t, I\'m just a sign!')
  const numLines = useRef(1)
  const messageDump = useRef('Please be kind in chat! Or don\'t, I\'m just a sign!')
  const { register, handleSubmit, getValues } = useForm();

  const callbackChatbox = useCallback((message) => {
    const updateChatbox = (message) => {
        if (numLines.current > 9) {
            let line_break_index = messageDump.current.indexOf('\n')
            if (line_break_index > -1) {
                setChatbox(lastChatbox => lastChatbox.slice(line_break_index + 1))
                messageDump.current = messageDump.current.slice(line_break_index + 1)
            }
            numLines.current -= 1
        }

        setChatbox(lastChatbox => lastChatbox + '\n' + message)
        messageDump.current = messageDump.current + '\n' + message
        numLines.current += 1
    }

    updateChatbox(message)
  }, [])

  useEffect(() => {
    console.log("Chat event listeners added!")

    function handleChat(event) {
        const received_message = JSON.parse(event.data)
        if (received_message.event === "chat_message") {
            callbackChatbox(received_message.content)
        }
    }

    socket.addEventListener('message', handleChat)

    return () => { socket.removeEventListener('message', handleChat) }
  }, [socket, callbackChatbox]);

  function onSubmit() {
    let message = getValues();
    const token_unparsed = sessionStorage.getItem('login-token')
    const token_parsed = JSON.parse(token_unparsed)
    const user_headers = {'Accept': 'application/json', 'Content-Type': 'application/json'};

    fetch('http://localhost:3080/chat', {method: 'POST', body: JSON.stringify({token: token_parsed?.token, content: message.content}), headers: user_headers})
        .then((res) => res.json())
        .then((retrievedMessage) => console.log(retrievedMessage.message))
  }

  return (
    <div className="chatbox">
      <div className="message-container">
        <h6 className="messages">{chatbox}</h6>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="chatbox-form-container">
        <input type="text" className="chatbox-form" placeholder="Write a message!" name="content" {...register("content")} maxLength={50} required/>
        <button type="submit" className="chatbox-btn">Send</button>
      </form>
    </div>
  );
}

export default Chatbox;