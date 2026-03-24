import { useState } from 'react';
import MakeBot from './Pages/MakeBot';
import { Toaster } from "./Components/ui/sonner"
import { BrowserRouter, Routes, Route } from "react-router-dom";
import FAQs from './Pages/FAQs';


function App() {

  const [chat, setChat] = useState<boolean>(false);
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={
          <div>
            <Toaster />
            <MakeBot chat={chat} setChat={setChat} />
          </div>}
        />
        <Route path='/FAQs' element={<FAQs />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App