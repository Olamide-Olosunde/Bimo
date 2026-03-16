import { useEffect, useRef, useState } from "react"
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OpenAIEmbeddings } from "@langchain/openai";


function App() {

  const fileInput = useRef<HTMLInputElement>(null);
  const [fileInTxt, setFileInTxt] = useState<string>("");
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
  async function chunkText(txt: string)
  {
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 512,
      chunkOverlap: 64,
    });
    const chunks = await splitter.splitText(txt);
    // console.log(chunks);
    return chunks;
  }
  async function embedText(txt: string)
  {
    const embeddings = new OpenAIEmbeddings({
      model: 'text-embedding-3-small',
      apiKey: import.meta.env.VITE_OPEN_AI_API_KEY,
    });
    const embedding = await embeddings.embedQuery(txt);
    return embedding;
  }
  async function embedChunks(chunks: Array<string>)
  {
    const embeddings = [];
    for(let i = 0; i < chunks.length; i++ )
    {
      const batchEmbeddings = await embedText(chunks[i]);
      embeddings.push(batchEmbeddings);
    }
    return embeddings;
  }
  useEffect(()=>{
    async function run()
    {
      console.log(fileInTxt);
      const chunks = await chunkText(fileInTxt);
      await embedChunks(chunks);
    }
    if(fileInTxt)
      run();
  }, [fileInTxt]);
  

  return (
    <div style={{
      display: "flex",
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: '30%',
    }}>
      <input type='file' name='document' id='doc' ref={fileInput} />
      <button onClick={readFile}>Submit</button>
    </div>
  )
}

export default App