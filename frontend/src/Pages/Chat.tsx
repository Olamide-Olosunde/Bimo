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
  // const [response, setResponse] = useState<string>("");
  const [bot, setBot] = useState<botFormat>();
  const [thinking, setThinking] = useState<boolean>(false);
  const [count, setCount] = useState<number>(0);  // to keep updateChat() from erroring out every first mount

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
    return await fetch(`${import.meta.env.VITE_BACKEND}/api/bot/${bot.bot_id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(bot),
    })
    .then(result=>{
      toast("Please, refresh the page if changes aren't reflected yet.")
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
  async function updateChat(bot: botFormat)
  {
    await fetch(`${import.meta.env.VITE_BACKEND}/api/bot/${bot.bot_id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(bot)
    })
    .then(result=>console.log(result));
  }
  useEffect(()=>{
    if(bot)
      if(count > 1) // useEffect loads twice
        updateChat(bot);
      else
        setCount(count + 1);
  }, [bot?.chat]);
  useEffect(()=>{
    async function run(){
      if(question && bot)
      {
        await askNova(bot).then(result=>{
          // console.log(result.choices[0].message.content);
          setBot({...bot, chat: [...bot.chat, result.choices[0].message.content]});
        });
        setQuestion('');
      }
    }
    run();
  }, [bot]);

  return (
    (chat && bot) ?
      (size === 'icon') ?
        <BotMessageSquare onClick={()=>setSize("small")} className='fixed bottom-2.5 right-2.5 bg-[#C7FFED] rounded-full p-2 hover:cursor-pointer' size='60' />
      :
        <div className={`flex flex-col bg-[#BBC8CA] shadow-2xl border border-[#BBC8CA] ${size === 'fullscreen' ? 'h-screen w-screen fixed z-[5]' : 
                        'absolute h-[60vh] w-[92vw] sm:h-[50vh] sm:w-[60vw] md:h-[45vh] md:w-[38vw] lg:h-[38vh] lg:w-[20vw] bottom-5 right-3 rounded-2xl overflow-hidden'}`}>
          {/* "nav" */}
          <div className='relative flex flex-row justify-between items-center bg-white border-b border-[#BBC8CA] px-3 py-2.5'>
            <Button 
              className='text-xs font-medium text-black bg-[#C7FFED] hover:bg-[#AAFAC8] cursor-pointer border border-[#AAFAC8] rounded-lg px-3 py-1 h-auto transition-all duration-200'
              onClick={()=>{
                if( bot.chat.length > 0 )
                {
                  setBot({...bot, chat: []});
                  emptyChat(bot);
                }
                else
                  toast("Chat is cleared.");
              }}>Clear Chat</Button>

            {bot.chat.length > 0 && (
              <h2 className='text-sm font-semibold tracking-tight text-black absolute left-1/2 -translate-x-1/2'>
                {bot.bot_name}
              </h2>
            )}

            <div className='flex flex-row items-center gap-2 py-1 px-1'>
              {(size !== "icon") && <Minimize2 className='w-4 h-4 text-[#BBC8CA] hover:text-black cursor-pointer transition-colors duration-150' onClick={()=>setSize("icon")} />}
              {(size !== "small") && <ArrowDownRight className='w-4 h-4 text-[#BBC8CA] hover:text-black cursor-pointer transition-colors duration-150' onClick={()=>setSize("small")} />}
              {(size !== "fullscreen") && <MoveDiagonal className='w-4 h-4 text-[#BBC8CA] hover:text-black cursor-pointer transition-colors duration-150' onClick={()=>setSize("fullscreen")} />}
              <X onClick={()=>{ setChat(false); }} className='w-4 h-4 text-[#BBC8CA] hover:text-red-400 cursor-pointer transition-colors duration-150 ml-1' />
            </div>
          </div>

          {/* body */}
          <div className={`relative flex flex-col flex-1 overflow-hidden bg-white/60 ${bot.chat.length === 0 ? 'justify-center' : ''}`}>
            <div className={`flex-1 overflow-y-auto px-3 sm:px-4 ${bot.chat.length > 0 ? 'pb-16' : ''}`}>
              {bot.chat.length === 0 && (
                <h2 className={`flex justify-center text-center font-semibold tracking-tight text-black text-3xl sm:text-4xl relative ${size === 'fullscreen' ? 'top-[48%]' : 'top-[45%]'}`}>
                  {bot.bot_name}
                </h2>
              )}
              <div className='flex flex-col gap-2 py-2'>
                {bot.chat.map((text, i)=>
                  <span key={i} className={`px-3 py-2 rounded-xl text-sm leading-relaxed max-w-[85%] break-words ${i % 2 == 0 
                    ? 'bg-[#C7FFED] text-black self-end border border-[#AAFAC8]' 
                    : 'bg-white text-black self-start border border-[#BBC8CA]'}`}>{text}</span>
                )}
                {thinking && <BotThinking color='#C7FFED' />}
              </div>
            </div>

            <div className='flex flex-row gap-2 w-full px-3 py-3 backdrop-blur-sm border-[#BBC8CA]'>
              <Input onChange={(e)=>{
                if( e.target.value.length < 10000 )
                  setQuestion(e.target.value)
                else
                  scream("Prompt can only be 10000 characters long.");
              }} className='flex-1 bg-white border border-[#BBC8CA] text-black placeholder:text-[#BBC8CA] rounded-xl focus-visible:ring-[#AAFAC8] focus-visible:border-[#AAFAC8] transition-all duration-200'
              name='question' maxLength={10000} placeholder="Ask a question..." value={question} />
              <Button onClick={async ()=>{
                setBot({...bot, chat: [...bot.chat, question]})
              }} disabled={question ? false : true}
              className='bg-[#AAFAC8] hover:bg-[#C7FFED] text-black rounded-xl transition-all duration-200 shadow-md shadow-[#AAFAC8]/40 shrink-0 cursor-pointer'>
                <ArrowUp className='w-4 h-4' />
              </Button>
            </div>
          </div>
        </div>
    :
      <div className="flex fixed w-screen h-screen z-[5] bg-[#BBC8CA] justify-center items-center">
        <Loading size={20} />{/* will be changed to some bot animation later */}
      </div>
  )
}

export default Chat