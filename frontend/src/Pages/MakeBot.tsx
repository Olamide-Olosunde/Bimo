import { useEffect, useRef, useState } from "react"
import Chat from './Chat';
import { Textarea } from "../Components/ui/textarea"
import { MessageCircleMore, Menu, Ellipsis, InfoIcon, Trash2Icon } from 'lucide-react';
import { Field, FieldDescription, FieldLabel } from "../Components/ui/field"
import { Input } from "../Components/ui/input"
import { Button } from "../Components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "../Components/ui/popover"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../Components/ui/alert-dialog"

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
    return await fetch(`${import.meta.env.VITE_BACKEND}/api/bot`, {
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
  async function sendPDFToBackend(pdf: FormData)
  {
    return await fetch(`${import.meta.env.VITE_BACKEND}/api/bot`, {
      method: "POST",
      body: pdf,
    })
    .then((response)=>{
      setLoading(false);
      return response.json();
    });
  }
  function scream(msg: string){
    toast.error(msg);
  }
  const fileInput = useRef<HTMLInputElement>(null);
  const [fileInTxt, setFileInTxt] = useState<string>("");
  const [botName, setBotName] = useState<string>("");
  const [botId, setBotId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [bots, setBots] = useState<Array<eachBot>>();
  const [feedbackOpen, setFeedbackOpen] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string>("");
  const [botsBar, setBotsBar] = useState<boolean>(false); 
  const [openPopOver, setOpenPopOver] = useState<boolean>(true); 
  async function readFile()
  {
    const file = fileInput.current?.files?.[0];
    if(file)
    {
      const reader = new FileReader();
      const splitLength = file.name.split('.').length
      if( file.name.split('.')[splitLength - 1] === 'json' || file.name.split('.')[splitLength - 1] === 'txt' ||
          file.name.split('.')[splitLength - 1] === 'csv' )
      {
        reader.onload = (e) => {
          setFileInTxt(e.target?.result as string)
        }
        reader.readAsText(file);
      } else if( file.name.split('.')[splitLength - 1] === 'pdf' ) {
        // send it to the backend
        const formData = new FormData();
        formData.append("file", file);
        await sendPDFToBackend(formData) // gonna send a bot back
        .then((bot)=>{
          setBotId(bot.id);
          setBotName(bot.name);
        });
      } else {
        scream("Invalid document. Please, upload a document of one of the following types: pdf, csv, txt, json.");
      }
    }
  }
  function chatPopUp(){
    setChat(true);
  }
  async function renameBot()
  {
    // console.log("Rename bot");
    toast.info("Feature coming soon");
  }
  async function deleteBot(botid: string)
  {
    return await fetch(`${import.meta.env.VITE_BACKEND}/api/bot/${botid}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json"
      }
    })
    .then(response=>{
      //remove the id from local storage
      const bimo_bots = localStorage.getItem('Bimo_bots');
      let bots = JSON.parse(bimo_bots ? bimo_bots : "");
      bots.forEach((bot: string, i: number)=>{
        bots[i] = JSON.parse(bot);
      })

      bots = bots.filter((bot: eachBot) => bot.botId != botid);

      bots.forEach((bot: string, i: number)=>{
        bots[i] = JSON.stringify(bot);
      })
      localStorage.setItem('Bimo_bots', JSON.stringify(bots));  //set in local storage
      setBots(bots);  // set in state

      toast.success("Successfully deleted bot.");
      setOpenPopOver(false);
      return response;
    })
    .catch(err=>{
      scream(`An error occured.`);
      console.error(err);
    });
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
  useEffect(()=>{
    retrieveBots();
  }, [chat]);

  return (
    chat ? 
      <Chat id={botId} chat={chat} setChat={setChat} />
    :
      <div className="flex flex-row min-h-screen">
        <div className={`flex flex-col bg-[#C7FFED] items-center transition-[width] duration-500 ease-in-out ${botsBar ? 'w-[20%]' : 'w-0'}`}>
          <span className="border-b border-black w-full p-2 text-center font-bold">Bots</span>
          {bots ?
          bots.map((bot, key)=>
            <div key={key} className="flex flex-row p-2 border-b border-[#000] w-full pl-5 justify-between">
              <span onClick={()=>{
                setBotId(bot.botId);
                chatPopUp();
              }} >{bot.botName}
              </span>
              <Popover>
                <PopoverTrigger asChild>
                  <Ellipsis onClick={()=>setOpenPopOver(true)} />
                </PopoverTrigger>
                {openPopOver && 
                <PopoverContent className="translate-x-10 w-30 p-0 gap-0">
                  <Button className="bg-white text-black hover:bg-[#9C7178] hover:text-white focus:shadow-none border-none rounded-b-none h-7" onClick={()=>{renameBot()}}>Rename</Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="bg-white text-black hover:bg-[#9C7178] hover:text-white focus:shadow-none border-none rounded-t-none h-7">Delete</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="flex flex-col">
                      <AlertDialogHeader>
                        <AlertDialogMedia className="bg-destructive/10 text:destructive">
                          <Trash2Icon />
                        </AlertDialogMedia>
                        <AlertDialogTitle>Delete bot?</AlertDialogTitle>
                        <AlertDialogDescription>Are you sure you want to delete this bot?</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={()=>{
                          setOpenPopOver(false);
                        }} size="sm" variant="outline">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={()=>{
                          deleteBot(bot.botId);
                        }} size="sm" variant="destructive">Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </PopoverContent>
                }
              </Popover>
            </div>
          )
          :
          <span className="flex text-center font-bold mt-[40vh]">Created bots will appear here :)</span>
          
          }
        </div>
        <div className="flex bg-[#BBC8CA] justify-center align-center flex-col h-screen w-screen">
          <Menu onClick={()=>setBotsBar(!botsBar)} className="fixed top-0 m-3" size="35"/>

          <div className="flex justify-center items-center">
            <Field className="w-[45vw] mr-7">
              <FieldLabel htmlFor="picture">File</FieldLabel>
              <Input type='file' name='document' id='doc' ref={fileInput} className="file:w-[20%] file:h-[100%] file:bg-white file:text-black file:rounded-md" />
              <FieldDescription>Select a pdf to upload.</FieldDescription>
            </Field>
            <Button onClick={()=>{
              setLoading(true);
              readFile();
            }} disabled={loading} className="bg-white text-black font-bold bg-white">Create bot</Button>
          </div>

          <div className="fixed bottom-5 right-5">
            { feedbackOpen ?
                <div className="w-[25vw] h-[22vh] border rounded-lg p-2 pb-5 bg-white">
                  <p className="text-center p-2 font-bold">Feedback</p>
                  <Textarea className="h-[60%] bg-[#DDE3E4] focus:shadow-none" placeholder="I value your feedback."/>
                  <Button className="mt-2 w-[100%]">Submit Feedback</Button>
                </div>
              :
                <MessageCircleMore size="40" onClick={()=>setFeedbackOpen(!feedbackOpen)} />
            }
          </div>
        </div>
      </div>
  )
}

export default MakeBot;