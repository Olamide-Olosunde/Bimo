import {useEffect, useState} from 'react';
import Loading from './Loading';
import BotThinking from './BotThinking';

interface props{
  id: string;
  chat: boolean;
  setChat: React.Dispatch<React.SetStateAction<boolean>>
}
interface botFormat{
  bot_id: string,
  bot_name: string,
  chunks: string[],
  embeddings: number[],
  chat: string[]
}

const Chat = ({id, chat, setChat}: props) => {
  const [question, setQuestion] = useState<string>("");
  const [response, setResponse] = useState<string>("");
  const [bot, setBot] = useState<botFormat>();
  const [thinking, setThinking] = useState<boolean>(false);

  // fetch bot from backend
  async function fetchBot()
  {
    return await fetch(`http://localhost:3000/api/bot/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    })
    .then(botInfo=>{
      return botInfo.json()
    })
    .catch(err=>console.error(err));
  }
  useEffect(()=>{
    fetchBot()
    .then((bot)=>setBot(bot));
  }, []);
  async function askNova(bot: botFormat)
  {
    setThinking(true);
    return await fetch("http://localhost:3000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(bot)
    })
    .then(result=>{
      setThinking(false);
      return result.json();
    });
  }

  return (
    (chat && bot) ?
      <div style={{
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'flex-end',
        }}>
          <button>small</button>
          <button>corner</button>
          <button>Fullscreen</button>
          <button onClick={()=>{
            setChat(false);
          }}>Close x</button>
        </div>
        <h2 style={{
          display: 'flex',
          justifyContent: 'center',
          textAlign: 'center',
        }}>{bot.bot_name}</h2>
        <input name='question' placeholder="Enter text" value={question} onChange={(e)=>setQuestion(e.target.value)} />
        {thinking ? <BotThinking /> : <p>{response}</p>}
        <button onClick={()=>{
          // push user question to bot.chat
          bot.chat.push(question);

          // askNova(bot)
          askNova(bot)
          .then(result=>setResponse(result));
        }} disabled={question ? false : true}>Submit</button>
      </div>
    :
      <Loading />
  )
}

export default Chat