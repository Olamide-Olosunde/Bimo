import { useState } from 'react';
import MakeBot from './Pages/MakeBot';


function App() {

  const [chat, setChat] = useState<boolean>(false);
  return (
    <div>
      <MakeBot chat={chat} setChat={setChat} />
    </div>
  )
}

export default App