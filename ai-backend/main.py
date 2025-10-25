import os
import io
import uuid
import numpy as np
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, HTTPException
from docx import Document as DocxDocument
from pypdf import PdfReader
from sentence_transformers import SentenceTransformer
from langchain_text_splitters import RecursiveCharacterTextSplitter
from typing import List, Dict, Any, Optional
import json
import time

import chromadb 
from chromadb.utils import embedding_functions
import google.generativeai as genai
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables from .env file
load_dotenv() 

app = FastAPI()

# --- CORS Configuration ---
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8088",
    "http://127.0.0.1:8088",
    "http://localhost:8080",
    "http://127.0.0.1:8000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 1. FREE & EFFICIENT RAG COMPONENTS ---
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Embedding Model
embedding_model = SentenceTransformer('all-MiniLM-L6-v2') 

# Chroma Client
CHROMA_CLIENT = chromadb.PersistentClient(path="./chroma_db")

# Chroma Embedding Function Wrapper
class SbertEmbeddingFunction(embedding_functions.EmbeddingFunction):
    def __init__(self, model):
        self._model = model
    def __call__(self, texts):
        return self._model.encode(texts).tolist()

SBERT_EF = SbertEmbeddingFunction(embedding_model)

# Text Splitter
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=50,
    separators=["\n\n", "\n", " Vn", " SR ", " NAME ", " DEPARTMENT ", " BRANCH ", " ", ""],
    length_function=len,
)

# --- 2. PARSING FUNCTIONS ---
def parse_docx(file_data: bytes) -> str:
    """Extracts text from a DOCX file."""
    try:
        doc = DocxDocument(io.BytesIO(file_data))
        return "\n".join([paragraph.text for paragraph in doc.paragraphs if paragraph.text.strip()])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DOCX Parsing Error: {e}")

def parse_pdf(file_data: bytes) -> str:
    """Extracts text from a PDF file with robust handling for various PDF formats."""
    text = ""
    try:
        reader = PdfReader(io.BytesIO(file_data))
        
        print(f"📄 PDF has {len(reader.pages)} pages")
        
        for page_num, page in enumerate(reader.pages):
            try:
                page_text = page.extract_text()
                
                if page_text and page_text.strip():
                    # Clean up the text but preserve meaningful content
                    page_text = ' '.join(page_text.split())  # Normalize whitespace
                    
                    # Only add if we have meaningful content (not just page numbers)
                    if len(page_text.strip()) > 10:  # At least 10 characters of real content
                        text += f"Page {page_num + 1}:\n{page_text}\n\n"
                        print(f"✅ Page {page_num + 1}: extracted {len(page_text)} characters")
                    else:
                        print(f"⚠️ Page {page_num + 1}: insufficient content '{page_text}'")
                else:
                    print(f"❌ Page {page_num + 1}: no text extracted")
                    
            except Exception as page_error:
                print(f"❌ Error extracting page {page_num + 1}: {page_error}")
                continue
        
        # Check if we got any meaningful text
        if not text.strip():
            raise HTTPException(status_code=500, detail="PDF appears to be empty or contains no extractable text")
        
        print(f"📊 PDF extraction complete: {len(text)} total characters extracted")
        print(f"📖 Sample of extracted text: {text[:500]}...")
        
        return text
        
    except Exception as e:
        print(f"❌ PDF Parsing Error: {e}")
        raise HTTPException(status_code=500, detail=f"PDF Parsing Error: {e}")
    """Extracts text from a PDF file with better handling for tabular data."""
    text = ""
    try:
        reader = PdfReader(io.BytesIO(file_data))
        
        for page_num, page in enumerate(reader.pages):
            page_text = page.extract_text()
            
            if page_text:
                page_text = ' '.join(page_text.split())
                text += f"Page {page_num + 1}:\n{page_text}\n\n"
        
        if not text.strip():
            raise HTTPException(status_code=500, detail="PDF appears to be empty or contains no extractable text")
        
        print(f"PDF extraction: extracted {len(text)} characters")
        return text
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF Parsing Error: {e}")

def parse_txt(file_data: bytes) -> str:
    """Extracts text from a TXT file."""
    return file_data.decode('utf-8')

# --- 3. CHROMA INSERTION LOGIC ---
def insert_chunks_to_chroma(chunks: list[str], document_id: str) -> str:
    """Generates embeddings and inserts them into a Chroma collection."""
    try:
        collection = CHROMA_CLIENT.get_or_create_collection(
            name=document_id,
            embedding_function=SBERT_EF
        )

        ids = [f"chunk_{i}" for i in range(len(chunks))]
        metadatas = [{"chunk_index": i} for i in range(len(chunks))]
        
        print(f"Inserting {len(chunks)} chunks into ChromaDB")
        for i, chunk in enumerate(chunks[:2]):
            print(f"Chunk {i}: {chunk[:100]}...")
        
        collection.add(
            documents=chunks,
            metadatas=metadatas,
            ids=ids
        )
        
        return document_id
    except Exception as e:
        print(f"ChromaDB Insertion Error: {e}")
        raise HTTPException(status_code=500, detail=f"Database error during indexing: {e}")

# --- 4. CHROMA RETRIEVAL LOGIC ---
def retrieve_context(query: str, document_id: str, k: int = 5) -> list[dict]:
    """Performs vector search in the local ChromaDB collection."""
    
    print(f"🔍 Retrieving context for document: {document_id}")
    print(f"📝 Query: {query}")
    
    try:
        collection = CHROMA_CLIENT.get_collection(name=document_id)
        collection_count = collection.count()
        print(f"📊 Collection has {collection_count} chunks")
        
        if collection_count == 0:
            print("❌ Collection is empty")
            return []
        
    except Exception as e:
        print(f"❌ Error accessing collection: {e}")
        return [] 
    
    # For normal queries, use semantic search
    try:
        results = collection.query(
            query_texts=[query],
            n_results=min(k, collection_count),
            include=['documents', 'metadatas', 'distances']
        )

        print(f"🎯 Search results: {len(results['documents'][0])} chunks found")
        print(f"📏 Distances: {results['distances'][0] if results['distances'] else 'None'}")

        context_data = []
        
        # VERY PERMISSIVE - accept all results regardless of distance
        # ChromaDB cosine distance: 0 = identical, 2 = completely different
        # Most relevant matches are usually < 1.0
        for i, content in enumerate(results['documents'][0]):
            distance = results['distances'][0][i]
            
            print(f"📋 Chunk {i}: distance={distance:.3f}")
            
            # Accept ALL chunks regardless of distance for now
            context_data.append({
                "content": content,
                "metadata": results['metadatas'][0][i],
                "similarity_score": 1 - (distance / 2)  # Convert to 0-1 scale
            })

        print(f"✅ Final context: {len(context_data)} chunks")
        
        # Log the actual content being sent to LLM
        if context_data:
            print("📖 First chunk content preview:")
            print(f"   {context_data[0]['content'][:500]}...")
        
        return context_data
        
    except Exception as e:
        print(f"❌ Error during query: {e}")
        return []
    """Performs vector search in the local ChromaDB collection."""
    
    print(f"🔍 Retrieving context for document: {document_id}")
    print(f"📝 Query: {query}")
    
    try:
        # First, check if collection exists
        collections = CHROMA_CLIENT.list_collections()
        collection_names = [col.name for col in collections]
        print(f"📚 Available collections: {collection_names}")
        
        if document_id not in collection_names:
            print(f"❌ Collection {document_id} not found in ChromaDB")
            return []
            
        collection = CHROMA_CLIENT.get_collection(name=document_id)
        
        # Check collection contents
        collection_count = collection.count()
        print(f"📊 Collection {document_id} has {collection_count} chunks")
        
        if collection_count == 0:
            print("❌ Collection is empty")
            return []
        
        # First, try to get all documents for counting/comprehensive queries
        all_docs = collection.get()
        total_chunks = len(all_docs['documents'])
        
        print(f"📄 Total chunks in collection: {total_chunks}")
        
        # For counting or comprehensive queries, use more chunks
        counting_keywords = ['count', 'total', 'how many', 'list all', 'comprehensive', 'all the']
        is_counting_query = any(keyword in query.lower() for keyword in counting_keywords)
        
        if is_counting_query:
            print(f"🔢 Counting query detected, using all {total_chunks} chunks")
            context_data = []
            for i, content in enumerate(all_docs['documents']):
                context_data.append({
                    "content": content,
                    "metadata": all_docs['metadatas'][i],
                    "similarity_score": 1.0
                })
            return context_data
        
    except Exception as e:
        print(f"❌ Error accessing collection: {e}")
        return [] 
    
    # For normal queries, use semantic search
    try:
        results = collection.query(
            query_texts=[query],
            n_results=min(k, total_chunks),
            include=['documents', 'metadatas', 'distances']
        )

        print(f"🎯 Search results: {len(results['documents'][0])} chunks found")
        print(f"📏 Distances: {results['distances'][0] if results['distances'] else 'None'}")

        context_data = []
        
        # Much more permissive threshold
        for i, content in enumerate(results['documents'][0]):
            distance = results['distances'][0][i]
            
            print(f"📋 Chunk {i}: distance={distance}, content_preview={content[:100]}...")
            
            # Very permissive threshold
            if distance < 2.5:  # Increased threshold
                context_data.append({
                    "content": content,
                    "metadata": results['metadatas'][0][i],
                    "similarity_score": 1 - distance
                })

        # If still no context, return top results regardless of distance
        if not context_data and results['documents'][0]:
            print("🔄 No chunks passed threshold, using top results")
            for i in range(min(3, len(results['documents'][0]))):
                context_data.append({
                    "content": results['documents'][0][i],
                    "metadata": results['metadatas'][0][i],
                    "similarity_score": 1 - results['distances'][0][i]
                })

        print(f"✅ Final context: {len(context_data)} chunks")
        
        return context_data
        
    except Exception as e:
        print(f"❌ Error during query: {e}")
        return []
    """Performs vector search in the local ChromaDB collection."""
    try:
        collection = CHROMA_CLIENT.get_collection(name=document_id)
        all_docs = collection.get()
        total_chunks = len(all_docs['documents'])
        
        # For counting or comprehensive queries, use more chunks
        counting_keywords = ['count', 'total', 'how many', 'list all', 'comprehensive', 'all the']
        is_counting_query = any(keyword in query.lower() for keyword in counting_keywords)
        
        if is_counting_query:
            print(f"Counting query detected, using all {total_chunks} chunks")
            context_data = []
            for i, content in enumerate(all_docs['documents']):
                context_data.append({
                    "content": content,
                    "metadata": all_docs['metadatas'][i],
                    "similarity_score": 1.0
                })
            return context_data
        
    except:
        return [] 
    
    # For normal queries, use semantic search
    results = collection.query(
        query_texts=[query],
        n_results=min(k, total_chunks),
        include=['documents', 'metadatas', 'distances']
    )

    context_data = []
    
    # Permissive threshold
    for i, content in enumerate(results['documents'][0]):
        distance = results['distances'][0][i]
        
        if distance < 2.0:
            context_data.append({
                "content": content,
                "metadata": results['metadatas'][0][i],
                "similarity_score": 1 - distance
            })

    # Fallback: return top results if no good matches
    if not context_data and results['documents'][0]:
        for i in range(min(3, len(results['documents'][0]))):
            context_data.append({
                "content": results['documents'][0][i],
                "metadata": results['metadatas'][0][i],
                "similarity_score": 1 - results['distances'][0][i]
            })

    print(f"Retrieval: query='{query}', found {len(context_data)} contexts")
    return context_data

# --- 5. LLM GENERATION LOGIC ---
def generate_rag_response(context: list[dict], user_question: str) -> str:
    """Uses the retrieved context and the LLM to generate a factual answer."""
    
    if not context:
        return "I could not find relevant context in the document to answer that question."

    context_text = "\n---\n".join([item['content'] for item in context])

    print(f"🤖 Sending {len(context)} chunks to LLM")
    print(f"📝 Question: {user_question}")
    print(f"📄 Context preview: {context_text[:500]}...")

    # More helpful and permissive RAG Prompt
    prompt = f"""
    You are a helpful document analysis assistant. Analyze the following document content and answer the user's question.

    DOCUMENT CONTENT:
    {context_text}

    USER QUESTION: {user_question}

    INSTRUCTIONS:
    1. Carefully read and analyze the document content provided
    2. Answer the question based SOLELY on the information in the document content
    3. If the document contains relevant information, provide a comprehensive answer
    4. If the document doesn't directly answer the question but contains related information, share what you can infer
    5. Be helpful and provide as much useful information as possible from the document
    6. Only say you cannot find the answer if the document content is completely irrelevant

    Please provide a helpful answer based on the document content:
    """

    try:
        model = genai.GenerativeModel('gemini-2.0-flash')
        response = model.generate_content(prompt)
        
        print(f"✅ LLM response generated: {response.text[:200]}...")
        return response.text
        
    except Exception as e:
        print(f"❌ Gemini API Error: {e}")
        return f"Error: The AI service failed to generate a response: {e}"
    """Uses the retrieved context and the LLM to generate a factual answer."""
    context_text = "\n---\n".join([item['content'] for item in context])

    prompt = f"""
    You are an expert document analysis and Q&A assistant.
    Answer the following question truthfully and only based on the context provided below.
    If the context does not contain the answer, state that you cannot find the answer in the document.
    
    --- CONTEXT ---
    {context_text}
    ---
    
    --- QUESTION ---
    {user_question}
    """
    
    try:
        model = genai.GenerativeModel('gemini-2.0-flash')
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Gemini API Error: {e}")
        return f"Error: The AI service failed to generate a response: {e}"

def generate_rag_response_with_sources(context: List[Dict], user_question: str, contexts_by_doc: Dict) -> str:
    """Generates answer with explicit source attribution."""
    # Build context text with source labels
    context_text = ""
    for doc_id, contexts in contexts_by_doc.items():
        context_text += f"\n--- DOCUMENT: {doc_id} ---\n"
        for i, ctx in enumerate(contexts):
            context_text += f"[Source {i+1}]: {ctx['content']}\n\n"

    prompt = f"""
    You are an expert document analysis assistant. Answer the question based ONLY on the provided context from multiple documents.
    
    IMPORTANT: 
    - Cite which document each piece of information comes from using the source labels
    - If information comes from multiple documents, mention this
    - If documents contradict each other, point this out
    - Only use information from the provided contexts
    
    CONTEXT FROM MULTIPLE DOCUMENTS:
    {context_text}
    
    QUESTION: {user_question}
    
    Provide a comprehensive answer that synthesizes information from all relevant documents, with clear source attribution.
    """
    
    try:
        model = genai.GenerativeModel('gemini-2.0-flash')  # Fixed: using genai directly
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Error generating response: {e}"

# --- 6. MULTI-DOCUMENT RETRIEVAL ---
def retrieve_context_multiple_docs(query: str, document_ids: List[str], k_per_doc: int = 3) -> List[Dict]:
    """Performs vector search across multiple document collections."""
    all_contexts = []
    
    for doc_id in document_ids:
        try:
            collection = CHROMA_CLIENT.get_collection(name=doc_id)
            results = collection.query(
                query_texts=[query],
                n_results=k_per_doc,
                include=['documents', 'metadatas', 'distances']
            )
            
            # Add document source info to each context
            for i, content in enumerate(results['documents'][0]):
                distance = results['distances'][0][i]
                
                if distance < 1.5:
                    all_contexts.append({
                        "content": content,
                        "metadata": results['metadatas'][0][i],
                        "similarity_score": 1 - distance,
                        "document_id": doc_id,
                        "source": f"Document: {doc_id} | Chunk: {i}"
                    })
                    
        except Exception as e:
            print(f"Error searching document {doc_id}: {e}")
            continue
    
    # Sort by similarity score and return top results
    all_contexts.sort(key=lambda x: x['similarity_score'], reverse=True)
    return all_contexts[:10]

# --- 7. API ENDPOINTS ---

@app.post("/api/v1/document/index")
async def index_document(file: UploadFile = File(...)):
    """Handles parsing, chunking, embedding, and storing in local ChromaDB."""
    file_extension = os.path.splitext(file.filename)[1].lower()
    file_data = await file.read()
    
    # 1. Parsing
    if file_extension == '.pdf':
        raw_text = parse_pdf(file_data)
    elif file_extension == '.docx':
        raw_text = parse_docx(file_data)
    elif file_extension == '.txt':
        raw_text = parse_txt(file_data)
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {file_extension}")
    
    if not raw_text.strip():
        raise HTTPException(status_code=422, detail="Could not extract any meaningful text.")

    # 2. Chunking
    chunks = text_splitter.split_text(raw_text)
    
    # 3. Embedding and Storage
    document_id = str(uuid.uuid4()) 
    indexed_collection_id = insert_chunks_to_chroma(chunks, document_id) 
    
    return {
        "status": "success",
        "document_id": indexed_collection_id,
        "filename": file.filename,
        "total_chunks_indexed": len(chunks)
    }

@app.post("/api/v1/qa/ask")
async def contextual_qa(data: dict):
    """Handles user question, performs RAG, and returns the LLM's answer."""
    document_id = data.get("document_id")
    question = data.get("question")

    if not document_id or not question:
        raise HTTPException(status_code=400, detail="Missing document_id or question.")

    # 1. Retrieve the most relevant text chunks (Context)
    context_data = retrieve_context(question, document_id, k=5)
    
    if not context_data:
        return {"answer": "I could not find relevant context in the document to answer that question."}

    # 2. Generate the RAG Answer
    answer = generate_rag_response(context_data, question)

    # 3. Prepare response with source information
    source_metadata = [
        {"content_preview": c['content'][:150] + "...", 
         "source_info": c['metadata'], 
         "similarity": c['similarity_score']} 
        for c in context_data
    ]
    
    return {
        "answer": answer,
        "document_id": document_id,
        "sources_used": source_metadata
    }

@app.post("/api/v1/qa/ask-multiple")
async def contextual_qa_multiple(data: dict):
    """Handles user question across multiple documents with source attribution."""
    document_ids = data.get("document_ids", [])
    question = data.get("question", "")

    if not document_ids or not question:
        raise HTTPException(status_code=400, detail="Missing document_ids or question.")

    # 1. Retrieve context from all specified documents
    context_data = retrieve_context_multiple_docs(question, document_ids, k_per_doc=3)
    
    if not context_data:
        return {
            "answer": "I could not find relevant context in the selected documents to answer that question.",
            "sources": []
        }

    # 2. Group contexts by document for the prompt
    contexts_by_doc = {}
    for context in context_data:
        doc_id = context['document_id']
        if doc_id not in contexts_by_doc:
            contexts_by_doc[doc_id] = []
        contexts_by_doc[doc_id].append(context)

    # 3. Generate the RAG Answer with source attribution
    answer = generate_rag_response_with_sources(context_data, question, contexts_by_doc)

    # 4. Prepare detailed source information
    source_metadata = [
        {
            "document_id": c['document_id'],
            "content_preview": c['content'][:200] + "...",
            "similarity": c['similarity_score'],
            "source_info": c['source']
        } 
        for c in context_data
    ]
    
    return {
        "answer": answer,
        
    }

# Debug endpoints
@app.get("/api/v1/debug/document/{document_id}")
async def debug_document(document_id: str):
    """Debug endpoint to check what's in ChromaDB for a document"""
    try:
        collection = CHROMA_CLIENT.get_collection(name=document_id)
        results = collection.get()
        
        return {
            "document_id": document_id,
            "total_chunks": len(results['documents']),
            "chunks": results['documents'][:3] if results['documents'] else [],
            "metadatas": results['metadatas'][:3] if results['metadatas'] else []
        }
    except Exception as e:
        return {"error": str(e), "document_id": document_id}

@app.get("/api/v1/debug/search/{document_id}")
async def debug_search(document_id: str, query: str = "what is this document about"):
    """Debug endpoint to test search"""
    try:
        context_data = retrieve_context(query, document_id, k=5)
        return {
            "query": query,
            "document_id": document_id,
            "context_found": len(context_data),
            "contexts": context_data
        }
    except Exception as e:
        return {"error": str(e), "document_id": document_id}

def generate_document_summary(document_id: str, chunks: List[str], summary_type: str = "overview") -> str:
    """Generates AI-powered summaries with different focus types."""
    
    # Combine chunks for context (limit to avoid token limits)
    context_text = "\n".join(chunks[:15])  # First 15 chunks for better context
    
    prompts = {
        "overview": f"""
        You are an expert document analysis assistant. Provide a comprehensive overview of the following document.
        
        Focus on:
        - Main topics and themes
        - Key findings or conclusions
        - Overall purpose and scope
        - Important data points or statistics
        
        DOCUMENT CONTENT:
        {context_text}
        
        Provide a concise yet informative summary (3-4 paragraphs). Focus on the most important information that gives a complete picture of the document.
        """,
        
        "key_points": f"""
        Extract the key points and main ideas from this document. Focus on the most important information.
        
        DOCUMENT CONTENT:
        {context_text}
        
        Provide a bullet-point list of the 5-7 most important points from the document.
        """,
        
        "executive": f"""
        Create an executive summary of this document suitable for quick understanding by busy professionals.
        
        DOCUMENT CONTENT:
        {context_text}
        
        Provide a very concise summary (2-3 paragraphs) highlighting:
        - Primary objective/purpose
        - Main findings/conclusions
        - Key recommendations or next steps
        """,
        
        "detailed": f"""
        Provide a detailed, comprehensive analysis of this document covering all major aspects.
        
        DOCUMENT CONTENT:
        {context_text}
        
        Provide an in-depth summary covering:
        1. Introduction and context
        2. Main content and analysis
        3. Key findings and data
        4. Conclusions and implications
        5. Recommendations (if any)
        """
    }
    
    prompt = prompts.get(summary_type, prompts["overview"])
    
    try:
        model = genai.GenerativeModel('gemini-2.0-flash')
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Summary generation error: {e}")
        return f"Unable to generate {summary_type} summary at this time."

# Enhanced indexing with summary generation
@app.post("/api/v1/document/index-with-summary")
async def index_document_with_summary(file: UploadFile = File(...)):
    """Enhanced document indexing that includes AI-powered summary."""
    
    file_extension = os.path.splitext(file.filename)[1].lower()
    file_data = await file.read()
    
    # 1. Parsing
    if file_extension == '.pdf':
        raw_text = parse_pdf(file_data)
    elif file_extension == '.docx':
        raw_text = parse_docx(file_data)
    elif file_extension == '.txt':
        raw_text = parse_txt(file_data)
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {file_extension}")
    
    if not raw_text.strip():
        raise HTTPException(status_code=422, detail="Could not extract any meaningful text.")

    # 2. Chunking
    chunks = text_splitter.split_text(raw_text)
    
    # 3. Generate AI summary
    summary = generate_document_summary("temp_id", chunks, "overview")
    
    # 4. Embedding and Storage
    document_id = str(uuid.uuid4())
    
    indexed_collection_id = insert_chunks_to_chroma(chunks, document_id)
    
    return {
        "status": "success",
        "document_id": indexed_collection_id,
        "filename": file.filename,
        "total_chunks_indexed": len(chunks),
        "ai_summary": summary,
        "file_size": len(file_data),
        "upload_date": time.time()
    }

# New endpoint to generate summary for existing documents
@app.post("/api/v1/document/{document_id}/generate-summary")
async def generate_summary_for_document(document_id: str, summary_type: str = "overview"):
    """Generate AI summary for an already indexed document."""
    
    try:
        collection = CHROMA_CLIENT.get_collection(name=document_id)
        results = collection.get()
        
        if not results['documents']:
            raise HTTPException(status_code=404, detail="Document not found or has no content")
        
        chunks = results['documents']
        summary = generate_document_summary(document_id, chunks, summary_type)
        
        return {
            "document_id": document_id,
            "ai_summary": summary,
            "summary_type": summary_type,
            "status": "success"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating summary: {e}")

# New endpoint to get multiple summary types
@app.post("/api/v1/document/{document_id}/generate-comprehensive-summaries")
async def generate_comprehensive_summaries(document_id: str):
    """Generate multiple types of summaries for a document."""
    
    try:
        collection = CHROMA_CLIENT.get_collection(name=document_id)
        results = collection.get()
        
        if not results['documents']:
            raise HTTPException(status_code=404, detail="Document not found or has no content")
        
        chunks = results['documents']
        
        # Generate different types of summaries
        overview = generate_document_summary(document_id, chunks, "overview")
        key_points = generate_document_summary(document_id, chunks, "key_points")
        executive = generate_document_summary(document_id, chunks, "executive")
        
        return {
            "document_id": document_id,
            "summaries": {
                "overview": overview,
                "key_points": key_points,
                "executive": executive
            },
            "status": "success"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating summaries: {e}")
      
@app.get("/api/v1/debug/collections")
async def debug_collections():
    """Debug endpoint to list all ChromaDB collections"""
    try:
        collections = CHROMA_CLIENT.list_collections()
        collection_info = []
        
        for collection in collections:
            count = collection.count()
            collection_info.append({
                "name": collection.name,
                "document_count": count
            })
        
        return {
            "total_collections": len(collection_info),
            "collections": collection_info
        }
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/v1/debug/retrieve/{document_id}")
async def debug_retrieval(document_id: str, query: str = "what is this document about"):
    """Debug endpoint to test retrieval and see what context is found."""
    
    try:
        # Test retrieval
        context_data = retrieve_context(query, document_id, k=5)
        
        # Test LLM generation with the context
        if context_data:
            context_text = "\n---\n".join([item['content'] for item in context_data])
            
            # Create a simple test prompt
            test_prompt = f"Based on this document content, answer: {query}\n\nCONTENT:\n{context_text}"
            
            model = genai.GenerativeModel('gemini-2.0-flash')
            test_response = model.generate_content(test_prompt)
            
            return {
                "query": query,
                "document_id": document_id,
                "context_found": len(context_data),
                "context_preview": context_text[:1000] + "..." if len(context_text) > 1000 else context_text,
                "llm_answer": test_response.text,
                "chunks_retrieved": [
                    {
                        "content_preview": ctx['content'][:200] + "...",
                        "similarity": ctx['similarity_score']
                    } for ctx in context_data
                ]
            }
        else:
            return {
                "query": query,
                "document_id": document_id,
                "context_found": 0,
                "error": "No context retrieved"
            }
            
    except Exception as e:
        return {"error": str(e), "document_id": document_id}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
    
    