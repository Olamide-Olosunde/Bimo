import {useEffect, useState} from 'react';
import Loading from './Loading';
import BotThinking from './BotThinking';

interface props{
  id: string;
}
interface botFormat{
  bot_id: string,
  bot_name: string,
  chunks: string[],
  embeddings: number[],
  chat: string[]
}

const Chat = (id: props) => {
  const [question, setQuestion] = useState<string>("");
  const [response, setResponse] = useState<string>("");
  const [bot, setBot] = useState<botFormat>();
  const [thinking, setThinking] = useState<boolean>(false);

  // fetch bot from backend
  async function fetchBot()
  {
    return await fetch(`http://localhost:3000/api/bot/${id.id}`, {
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
  // useEffect(()=>{
  //   if(bot)
  //   {
  //     askNova(bot);
  //   }
  // }, [bot]);

  return (
    bot ?
      <div>
        <h2>{bot.bot_name}</h2>
        <input name='question' placeholder="Enter text" value={question} onChange={(e)=>setQuestion(e.target.value)} />
        {thinking ? <p>{response}</p> : <BotThinking />}
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