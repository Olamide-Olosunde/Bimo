import { useState } from 'react';
import MakeBot from './Pages/MakeBot';
import { Toaster } from "./Components/ui/sonner"


function App() {

  const [chat, setChat] = useState<boolean>(false);
  return (
    <div className="font-['GT America']">
      <Toaster />
      <MakeBot chat={chat} setChat={setChat} />
    </div>
  )
}

export default App