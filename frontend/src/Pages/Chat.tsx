import {useEffect, useState} from 'react';
import Loading from '../Components/Loading';
import BotThinking from '../Components/BotThinking';
import { toast } from "sonner"

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

  function scream(msg: string){
    toast.error(msg);
  }
  // fetch bot from backend
  async function fetchBot()
  {
    return await fetch(`${import.meta.env.VITE_BACKEND}/api/bot/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    })
    .then(botInfo=>{
      return botInfo.json()
    })
    .catch(err=>{
      scream(`An error occured.`);
      console.error(err);
    });
  }
  async function emptyChat(bot: botFormat)
  {
    bot.chat.length = 0;
    return await fetch(`${import.meta.env.VITE_BACKEND}/api/bot/${bot.bot_id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(bot),
    })
    .then(result=>{
      return result;
    })
    
  }
  useEffect(()=>{
    fetchBot()
    .then((bot)=>setBot(bot));
  }, []);
  async function askNova(bot: botFormat)
  {
    setThinking(true);
    return await fetch(`${import.meta.env.VITE_BACKEND}/api/chat`, {
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
          justifyContent: 'space-between',
        }}>
          <button onClick={()=>{
            if( bot.chat.length > 0 )
              emptyChat(bot);
            else
              window.alert("Chat is cleared.");
          }}>Clear Chat</button>
          <div>
            <button>small</button>
            <button>corner</button>
            <button>Fullscreen</button>
            <button onClick={()=>{
              setChat(false);
            }}>Close x</button>
          </div>
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