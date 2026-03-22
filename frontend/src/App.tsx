import { useState } from 'react';
import MakeBot from './Pages/MakeBot';
import { Toaster } from "./Components/ui/sonner"


function App() {

  const [chat, setChat] = useState<boolean>(false);
  return (
    <div>
      <Toaster />
      <MakeBot chat={chat} setChat={setChat} />
    </div>
  )
}

export default App