import {useEffect, useState} from 'react';
import Loading from '../Components/Loading';
import BotThinking from '../Components/BotThinking';
import { toast } from "sonner"
import { Button } from "../Components/ui/button"
import { ArrowDownRight, ArrowUp, BotMessageSquare, Minimize2, MoveDiagonal, X } from 'lucide-react';
import { Input } from "../Components/ui/input";

interface props{
  id: string;
  chat: boolean;
  setChat: React.Dispatch<React.SetStateAction<boolean>>;
  size: string;
  setSize: React.Dispatch<React.SetStateAction<string>>;
}
interface botFormat{
  bot_id: string,
  bot_name: string,
  chunks: string[],
  embeddings: number[],
  chat: string[]
}

const Chat = ({id, chat, setChat, size, setSize}: props) => {
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
      (size === 'icon') ?
        <BotMessageSquare className='fixed bottom-2.5 right-2.5 bg-white rounded-full p-2' size='60' />
      :
        <div className={`flex flex-col bg-[#BBC8CA] ${size === 'fullscreen' ? 'h-screen' : 
                        'absolute h-[30vh] bottom-5 right-5 bg-white rounded-lg'}`}>
          {/* "nav" */}
          <div className='flex flex-row justify-between items-center'>
            <Button onClick={()=>{
              if( bot.chat.length > 0 )
                emptyChat(bot);
              else
                toast("Chat is cleared.");
            }}>Clear Chat</Button>
            <div className='flex flex-row w-[30%] py-2 mx-1.5 justify-between'>
              {/* will add a hover to describe each of these to user */}
              <Minimize2 onClick={()=>setSize("icon")} />
              <ArrowDownRight onClick={()=>setSize("small")} />
              <MoveDiagonal onClick={()=>setSize("fullscreen")} />
              <X onClick={()=>{
                setChat(false);
              }} className='rounded-md bg-destructive/50' />
            </div>
          </div>
          {
            <div className={`${(bot.chat.length === 0) ? 'mt-[40vh]' : ''}`}>
              <h2 className={`flex justify-center text-center font-bold
                              ${(bot.chat.length === 0) ? 'text-5xl' : 'text-2xl'}`}>{bot.bot_name}</h2>
              {bot.chat.map((text, i)=><span className={`${i % 2 == 0} ? bg-[#C7FFED] : bg-[#B592A0]`}>{text}</span>)}
              <div className={`flex flex-row gap-1 fixed bottom-2 w-[100%] px-2`}>
                <Input className='flex w-[90%]' name='question' placeholder="Enter text" value={question} onChange={(e)=>setQuestion(e.target.value)} />
                <Button onClick={()=>{
                  // push user question to bot.chat
                  bot.chat.push(question);

                  // askNova(bot)
                  askNova(bot)
                  .then(result=>setResponse(result));
                }} disabled={question ? false : true}>{/* will add a hover to tell user it's disabled */}
                  <ArrowUp />
                </Button>
              </div>
            </div>
          }
        </div>
    :
      <div className="flex fixed w-screen h-screen z-[5] bg-[#BBC8CA] justify-center items-center">
        <Loading size={20} />{/* will be changed to some bot animation later */}
      </div>
  )
}

export default Chat