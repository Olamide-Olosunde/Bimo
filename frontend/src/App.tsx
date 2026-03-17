import { useEffect, useRef, useState } from "react"
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";


function App() {

  async function sendDocToBackend(doc: string)  // might change to arr if we taking more than 1 doc
  {
    fetch("http://localhost:3000/api/doc", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(doc),
    });
  }
  const fileInput = useRef<HTMLInputElement>(null);
  // const question = useRef<HTMLInputElement>(null);
  const [question, setQuestion] = useState<string>("");
  const [fileInTxt, setFileInTxt] = useState<string>("");
  // const [botName, setBotName] = useState<string>("");
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
  function cosineSimilarity(vecA: number[], vecB: number[])
  {
    if( vecA.length !== vecB.length )
    {
      throw new Error('Vectors must be of equal length');
    }

    let dotProduct = 0;
    for(let i = 0; i < vecA.length; i++)
      dotProduct += vecA[i] * vecB[i];

    const magnitudeA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));
    
    if(magnitudeA == 0 || magnitudeB == 0)
      return 0;

    return dotProduct / (magnitudeA * magnitudeB);
  }
  function similarityFunction(questionEmbedding: number[], embeddedChunks: Array<number[]>, chunks: string[], topN = 3)
  {
    const similarities = embeddedChunks.map((chunk, index) => ({
      content: chunks[index],
      similarity: cosineSimilarity(questionEmbedding, chunk),
    }))

    similarities.sort((a,b) => b.similarity - a.similarity);
    return similarities.slice(0, topN);
  }
  //when user inserts file
  useEffect(()=>{
    async function run()
    {
      sendDocToBackend(fileInTxt);
      // // console.log(fileInTxt);
      // const chunks = await chunkText(fileInTxt);
      // const embeddedChunks = await embedChunks(chunks);
      // const embeddedQuestion = await embedText(question);
      // const similarChunks = similarityFunction(embeddedQuestion, embeddedChunks, chunks, 2);  //an array with each index having a json: {content, similarity}
      // let prompt = "Generate a file name for this:";
      // similarChunks.forEach(e=>{
      //   // console.log(e.content);
      //   prompt += `\n\n${e.content}`;
      // })
      // // askNova(prompt)
      // // .then( async ()=>{
      
      
      // // const requestOptions = {
      // //   method: "POST",
      // //   headers: {
      // //     "Content-Type": "application/json"
      // //   },
      // //   body: JSON.stringify({"chat": bodyToSend})
      // // };

      // // fetch("http://localhost:3000/api/chat", requestOptions)
      // //   .then((response) => response.json())
      // //   .then((result) => {
      // //     // console.log(result);
      // //     setResponse(result.choices[0].message.content);
      // //     return result;
      // //   })
      // //   .catch((error) => console.error(error))
      // //   .finally(()=>{
      // //     setLoading(false);
      // //   });
      // //   const botName = response.split('"')[1]

      // //   // bot creation
      // //   createBot({
      // //     "bot_id": "",
      // //     "bot_name": botName,
      // //     "embeddings": embeddedChunks,
      // //     "chat": []
      // //   });
      // // });
    }
    if(fileInTxt)
      run();
  }, [fileInTxt]);
  

  const [response, setResponse] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  return (
    <div style={{
      display: "flex",
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: '30%',
      flexDirection: 'column',
    }}>
      <input type='file' name='document' id='doc' ref={fileInput} />
      {/* <input type='text' name='question' value={question} onChange={(e)=>setQuestion(e.target.value)} placeholder="Enter text" />
      <p>{loading ? 'loading...' : response}</p> */}
      <button onClick={()=>{
        setLoading(true);
        readFile();
      }}>Submit</button>
    </div>
  )
}

export default App