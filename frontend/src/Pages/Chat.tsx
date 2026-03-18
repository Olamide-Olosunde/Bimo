import {useEffect, useState} from 'react';

const Chat = (id: string) => {
  const [question, setQuestion] = useState<string>("");
  const [response, setResponse] = useState<string>("");
  const [bot, setBot] = useState<object>({});

  // fetch bot from backend
  async function fetchBot()
  {
    await fetch(`http://localhost:3000/api/bot/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    })
    .then(botInfo=>setBot(botInfo));
  }
  async function askNova(bot: object)
  {
    fetch("http://localhost:3000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(bot)
    })
    .then(result=>console.log(result));
  }
  useEffect(()=>{
    if(bot)
    {
      askNova(bot);
    }
  }, [bot]);

  return (
    <input name='question' placeholder="Enter text" value={question} onChange={(e)=>setQuestion(e.target.value)} />
  )
}

export default Chat