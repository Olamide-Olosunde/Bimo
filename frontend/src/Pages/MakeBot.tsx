import { useEffect, useRef, useState } from "react"
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import Chat from './Chat';

interface eachBot{  // each bot in local storage
  botId: string,
  botName: string
}
interface chat{
  chat: boolean,
  setChat: React.Dispatch<React.SetStateAction<boolean>>,
}

function MakeBot({ chat, setChat }: chat) {

  async function sendToBackend(document: string)  // might change to arr if we taking more than 1 doc
  {
    return await fetch("http://localhost:3000/api/bot", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({doc: document}),
    })
    .then((response)=>{
      setLoading(false);
      return response.json();
    });
  }
  const fileInput = useRef<HTMLInputElement>(null);
  const [fileInTxt, setFileInTxt] = useState<string>("");
  const [botName, setBotName] = useState<string>("");
  const [botId, setBotId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [bots, setBots] = useState<Array<eachBot>>();
  async function readFile()
  {
    const file = fileInput.current?.files?.[0];
    if(file)
    {
      const reader = new FileReader();
      if( file.name.split('.')[1] === 'json' || file.name.split('.')[1] === 'txt' ||
          file.name.split('.')[1] === 'csv' )
      {
        reader.onload = (e) => {
          setFileInTxt(e.target?.result as string)
        }
        reader.readAsText(file);
      } else if( file.name.split('.')[1] === 'pdf' ) {
        const loader = new PDFLoader(file);
        const docs = await loader.load();
        console.log(docs);
      }
    }
  }
  function chatPopUp(){
    setChat(true);
  }
  //when user inserts file
  useEffect(()=>{
    async function createBot()
    {
      await sendToBackend(fileInTxt)
      .then((bot)=>{
        setBotId(bot.id);
        setBotName(bot.name);
      })
    }
    if(fileInTxt)
    {
      if(fileInput.current)
        fileInput.current.value = '';
      createBot();
    }
  }, [fileInTxt]);

  useEffect(()=>{
    if(botId && botName)
    {
      if( localStorage.getItem('Bimo_bots') === null )
      {
        let bots = [];
        bots.push(JSON.stringify({
          botId: botId,
          botName: botName
        }));
        localStorage.setItem('Bimo_bots', JSON.stringify(bots));
      } else 
      {
        const bimo_bots = localStorage.getItem('Bimo_bots');
        const bots = JSON.parse(bimo_bots ? bimo_bots : "");
        bots.push(JSON.stringify({
          botId: botId,
          botName: botName
        }));
        localStorage.setItem('Bimo_bots', JSON.stringify(bots));
      }
      //re-route to chat
      chatPopUp();
    }
  }, [botName]); // not dependent on botId cause that changes frequently -- when user clicks to chat with their bots

  function retrieveBots()
  {
    if( localStorage.getItem('Bimo_bots') !== null )
    {
      const bimo_bots = localStorage.getItem('Bimo_bots');
      const retrieved_bots = JSON.parse(bimo_bots ? bimo_bots : "");
      retrieved_bots.forEach((bot: string, i: number)=>{
        retrieved_bots[i] = JSON.parse(bot);
      })
      setBots(retrieved_bots);
      // console.log(retrieved_bots[0].botId);
    } else 
    {
      console.log("No bots stored");
    }
  }
  useEffect(()=>{
    retrieveBots();
  }, []);

  return (
    chat ? 
      <Chat id={botId} name={botName} chat={chat} setChat={setChat} />
    :
      <div style={{
        display: 'flex',
        flexDirection: 'row',
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
        }}>
          {bots?.map((bot, key)=><span onClick={()=>{
            setBotId(bot.botId);
            chatPopUp();
          }} key={key}>{bot.botName}</span>)}
        </div>
        <div style={{
          display: "flex",
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: '30%',
          flexDirection: 'column',
        }}>
          <input type='file' name='document' id='doc' ref={fileInput} />
          <button onClick={()=>{
            setLoading(true);
            readFile();
          }} disabled={loading}>Submit</button>
        </div>
      </div>
  )
}

export default MakeBot;