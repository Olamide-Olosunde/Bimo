import { useState } from 'react';
import MakeBot from './Pages/MakeBot';


function App() {

  const [chat, setChat] = useState<boolean>(false);
  return (
    <div className="font-['GT America']">
      <MakeBot chat={chat} setChat={setChat} />
    </div>
  )
}

export default App