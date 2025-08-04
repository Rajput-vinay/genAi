        import * as dotenv from "dotenv"
        import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
        import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
        import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
        import { Pinecone } from '@pinecone-database/pinecone';
        import { PineconeStore } from '@langchain/pinecone';
        dotenv.config();

        //  step for store the data into the database

                //  load the pdf
                //  chuck the pdf
                //   Initializing the Embedding model
                // Intializing the Db
                //  upload the data in db


        async function storeDB() {
            //  step 1
            const PDF_PATH = "./dsa.pdf"
            const PdfLoader = new PDFLoader(PDF_PATH);
            const rawDocs = await PdfLoader.load()
            // console.log(rawDocs)

            console.log("loadDoc");

            //  step 2 chucking

            const textsplitters = new RecursiveCharacterTextSplitter({
                chunkSize: 1000,
                chunkOverlap: 200
            })

            const chunkDocs = await textsplitters.splitDocuments(rawDocs)

            console.log("chunking done")

            // Embedding the model
            const embeddings = new GoogleGenerativeAIEmbeddings({
                apiKey: process.env.GEMINI_API_KEY,
                model: 'text-embedding-004',
            });

            console.log("embeddings done succesufully")

            //   intialize the db

            const pinecone = new Pinecone()
            const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME)

            console.log("pineconeIndex created")

            //  now chunk upload into the db

            await PineconeStore.fromDocuments(chunkDocs,embeddings,{
                pineconeIndex,
                maxConcurrency:5,
            })

            console.log("data store in the pinecone")
        }

        storeDB()