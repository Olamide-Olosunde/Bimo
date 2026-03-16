import { useEffect, useRef, useState } from "react"
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OpenAIEmbeddings } from "@langchain/openai";


function App() {

  const fileInput = useRef<HTMLInputElement>(null);
  // const question = useRef<HTMLInputElement>(null);
  const [question, setQuestion] = useState<string>("");
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
  async function embedChunks(chunks: string[])
  {
    const embeddings = [];
    for(let i = 0; i < chunks.length; i++ )
    {
      const batchEmbeddings = await embedText(chunks[i]);
      // embeddings.push({
      //   content: chunks[i],
      //   embedding: batchEmbeddings
      // });
      embeddings.push(batchEmbeddings);
    }
    return embeddings;
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
  useEffect(()=>{
    async function run()
    {
      console.log(fileInTxt);
      const chunks = await chunkText(fileInTxt);
      const embeddedChunks = await embedChunks(chunks);
      const embeddedQuestion = await embedText(question);
      const similarChunks = similarityFunction(embeddedQuestion, embeddedChunks, chunks, 2);  //an array with each index having a json: {content, similarity}
      similarChunks.forEach(e=>{
        console.log(e.content);
      })
    }
    if(fileInTxt)
      run();
  }, [fileInTxt]);
  

  const [response, setResponse] = useState<string>("");
  return (
    <div style={{
      display: "flex",
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: '30%',
      flexDirection: 'column',
    }}>
      <input type='file' name='document' id='doc' ref={fileInput} />
      <input type='text' name='question' value={question} onChange={(e)=>setQuestion(e.target.value)} placeholder="Enter text" />
      <p>{response}</p>
      <button onClick={readFile}>Submit</button>
    </div>
  )
}

export default App