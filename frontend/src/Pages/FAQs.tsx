import { ArrowLeft } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../Components/ui/accordion";


const FAQs = () => {
  return (
    <div className="h-screen w-screen bg-[#BBC8CA] flex flex-col justify-center items-center">
        <ArrowLeft onClick={()=>{
            window.location.href="/"
        }} className='cursor-pointer fixed z-[1] top-5 left-5' size="30"/>
        <p className='text-4xl mb-5 font-serif'>FAQs</p>
        <Accordion
            type="multiple"
            defaultValue={["faq"]}
            className="max-w-lg"
        >
            <AccordionItem value="what" className='border-black'>
                <AccordionTrigger>What is this for?</AccordionTrigger>
                <AccordionContent>
                    Turn any file into a bot that can answer questions about your data.
                    {/* You upload a file; we create a bot; the bot answers questions based on data in your uploaded file. */}
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="data_privacy" className='border-black'>
                <AccordionTrigger>What do you do with my data?</AccordionTrigger>
                <AccordionContent>
                    Your data is used solely to power your bot.
                    Delete a bot, and all associated data is permanently removed.
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="special" className='border-black'>
                <AccordionTrigger>What's so special about this?</AccordionTrigger>
                <AccordionContent>
                    These bots are designed not to hallucinate. If they don't know the answer, they say “I don't know.”
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    </div>
  )
}

export default FAQs