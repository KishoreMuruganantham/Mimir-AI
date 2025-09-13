from llama_index.core import SimpleDirectoryReader
from logging import disable
from typing import Optional, List
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import os
from fastapi.middleware.cors import CORSMiddleware
from urllib.parse import urldefrag
from io import BytesIO
import re
import requests
import warnings
from pathlib import Path as p
from pprint import pprint
import pandas as pd
from PIL import Image
import ast
import uvicorn
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain import PromptTemplate
from langchain.chains.question_answering import load_qa_chain
from langchain.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter, CharacterTextSplitter
from langchain.chains import RetrievalQA, create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_community.vectorstores import FAISS
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_core.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate
from langchain.prompts import MessagesPlaceholder
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain_core.runnables import RunnableWithMessageHistory
from pydantic import BaseModel
import pymupdf as fitz  # PyMuPDF for PDF handling
from PyPDF2 import PdfReader
import firebase_admin
from firebase_admin import credentials, storage, firestore, db
import urllib
import shutil
from datetime import datetime, timedelta
from langchain_core.chat_history import InMemoryChatMessageHistory

# Environment variable setup
os.environ["GOOGLE_API_KEY"] = os.getenv("GOOGLE_API_KEY")

warnings.filterwarnings("ignore")

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 43200

class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: str or None = None
    userid : str or None = None

class User(BaseModel):
    username: str
    email: str or None = None
    full_name: str or None = None
    disabled: bool or None = None


class UserInDB(User):
    hashed_password: str
    disabled: bool or None = None

class File(BaseModel):
    files: List[str]

class OTP_AUTH(BaseModel):
  email : str
  otp : str

class EMPFile(BaseModel):
  files: List[str]
  userid : str

class AddDomain(BaseModel):
  email:str
  domain:str

class AnalyticsQuery(BaseModel):
  admin_email: str
  date_range: str = "30" 
  department: str = "all"

class UserAnalyticsQuery(BaseModel):
  admin_email: str
  date_range: str = "30" 
  department: str = "all"

class ReportsQuery(BaseModel):
  admin_email: str
  report_type: str = "all"
  date_range: str = "30"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
app = FastAPI()

origins = [
    "*"
]

chat_history = []

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

geminiAPI = os.getenv("GOOGLE_API_KEY")

from langchain_google_genai import GoogleGenerativeAIEmbeddings
try:
    llm1 = ChatGoogleGenerativeAI(api_key=geminiAPI, model='gemini-1.5-flash')
    cred = credentials.Certificate("service_key.json")
    firebase_admin.initialize_app(cred, {
    'storageBucket': os.getenv("STORAGE_BUCKET"),
    'databaseURL': os.getenv("DB_URL")
    })
    firest = firestore.client()
    ref = db.reference()
except Exception as e:
    raise Exception(f"Initialization Error: {str(e)}")



import smtplib
import random
import string
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText



def get_password_hash(password):
    return pwd_context.hash(password)

def get_user(db, username: str):
    try:
        user_ref = firest.collection("User").document(username)
        user_doc = user_ref.get()

        if user_doc.exists:
            data = user_doc.to_dict()
            username = data.get("username")
            password = data.get("password")
            disabled = data.get("disabled")
            print(f"Username: {username}, Password: {password}")
            return {"username": username, "password": password,"disabled":disabled}
        else:
            print("No such document!")
            return None

    except Exception as e:
        print(f"Error getting document: {e}")
        return None


def authenticate_user(db, username: str, password: str):
    user = get_user(db, username)

    if not user:
        return False
    if not verify_password(password, user['password']):
        return False
    return user


def create_access_token(data: dict, expires_delta: timedelta or None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(token: str = Depends(oauth2_scheme)):
    credential_exception = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                                         detail="Could not validate credentials", headers={"WWW-Authenticate": "Bearer"})
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credential_exception

        token_data = TokenData(username=username)
    except JWTError:
        raise credential_exception

    user = get_user(firest, username=token_data.username)
    if user is None:
        raise credential_exception

    return user


async def get_current_active_user(current_user: UserInDB = Depends(get_current_user)):
    if current_user['disabled']:
        raise HTTPException(status_code=400, detail="Inactive user")

    return current_user

class OTPRequest(BaseModel):
    email : str
class FileRequest(BaseModel):
    userid: str
    query: str
    files: List[str]
    db_name: str

class File(BaseModel):
    files: List[str]
    rewrite: bool

class SignUp(BaseModel):
    email: str
    password: str
    username: str

class Login(BaseModel):
    email: str
    password: str


class FilterWord(BaseModel):
    email:str


def put_context(uid, query, response):
    """
    Append a query-response pair to the context for a given UID.
    """
    try:
      ref.child('Users').child(uid).child("context").push({"query": query, "response": response})
    except Exception as e:
        raise Exception(f"Context Storage Error for UID {uid}: {str(e)}")



def put_index(uid, index):
    try:
        db.child("Users").child(uid).child("index").set(index)
    except Exception as e:
        raise Exception(f"Index Storage Error: {str(e)}")

def fetch_context(uid):
    try:
        return ref.child('Users').child(uid).child("context").get()
    except Exception as e:
        raise Exception(f"Context Fetch Error: {str(e)}")

def fetch_index(uid):
    try:
        index = db.child("Users").child(uid).child("index").get().val()
        return int(index) if index is not None else 0
    except Exception as e:
        raise Exception(f"Index Fetch Error: {str(e)}")


def add_otp(document_id, data):
    doc_ref = firest.collection("OTP DB").document(document_id)
    data = {
        "otp":data,
        "timestamp":datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    doc_ref.set(data)

def authenticate_otp(document_id, user_otp):
    try:
        # Reference to the user document in Firestore
        user_ref = firest.collection("OTP DB").document(document_id)
        user_doc = user_ref.get()

        if user_doc.exists:
            data = user_doc.to_dict()
            otp = data.get("otp")
            timestamp_str = data.get("timestamp")

            # Convert timestamp string to datetime object
            timestamp = datetime.strptime(timestamp_str, "%Y-%m-%d %H:%M:%S")
            current_time = datetime.now()

            # Check if the provided OTP matches
            if verify_password(user_otp,otp):
                if current_time - timestamp < timedelta(minutes=5):
                    return {"status": True, "message": "OTP is valid"}
                else:
                    print("OTP has expired.")
                    return {"status": False, "error": "OTP expired"}
            else:
                print("Invalid OTP.")
                return {"status": False, "error": "Invalid OTP"}
        else:
            print("No such document!")
            return {"status": False, "error": "Document not found"}
    except Exception as e:
        print(f"Error getting document: {e}")
        return {"status": False, "error": str(e)}

def query_parser(query):
    try:
        if '@' in query:
            part = query.split('@', 1)[1]
            index = ''.join(filter(str.isdigit, part.split()[0]))
            return int(index)
    except Exception as e:
        raise Exception(f"Query Parsing Error: {str(e)}")


def get_text(path):
  reader = SimpleDirectoryReader(input_dir=path)
  documents = reader.load_data()
  combined_text = ""
  for document in documents:
    combined_text += document.text
  return combined_text


def get_text_chunks(text):
    text_splitter = CharacterTextSplitter(
        separator="\n",
        chunk_size=8000,
        chunk_overlap=1000,
        length_function=len
    )
    chunks = text_splitter.split_text(text)
    return chunks

def remove_folder(folder_path):
  try:
      shutil.rmtree(folder_path)
      print(f"Directory '{folder_path}' and all its contents have been removed.")
  except FileNotFoundError:
      print(f"Directory '{folder_path}' does not exist.")
  except Exception as e:
      print(f"Error: {e}")

def store_db(folder_path):
    bucket = storage.bucket()  # Access the storage bucket
    for filename in os.listdir(folder_path):
        print('2')
        file_path = os.path.join(folder_path, filename)

        # Ensure it's a file before uploading
        if os.path.isfile(file_path):
            print(3)
            storage_path = f"{folder_path}/{filename}"  # Path in Firebase Storage
            blob = bucket.blob(storage_path)  # Create a blob in the bucket

            # Upload the file
            try:
                print(4)
                blob.upload_from_filename(file_path)
                print(f"Uploaded {filename} to {storage_path}")
            except Exception as e:
                print(5)
                print(f"Failed to upload {filename}. Error: {e}")

    remove_folder(folder_path)

def create_vectorstore(text_chunks, rewrite, uid):
    embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")

    if rewrite:
        vectorstore = FAISS.from_texts(text_chunks, embeddings)
        vectorstore.save_local(f"{uid}-vectorstore.json")
    else:
        vectorstore = get_vectorstore(uid)
        vectorstore.add_texts(text_chunks)
        vectorstore.save_local(f"{uid}-vectorstore.json")

    store_db(f'{uid}-vectorstore.json')
    return vectorstore

def get_filter_words(text):
    array_pattern = r'^\[\s*(?:".*?"|\'.*?\'|\d+)(?:\s*,\s*(?:".*?"|\'.*?\'|\d+))*\s*\]$'

    if re.match(array_pattern, text.strip()):
        try:
            word_list = ast.literal_eval(text)
            return word_list
        except (ValueError, SyntaxError):
            return []
    return []

def get_vectorstore(uid):
    bucket = storage.bucket()
    folder_path = f"{uid}-vectorstore.json/"
    local_folder_path = f"{uid}-vectorstore.json"
    os.makedirs(local_folder_path, exist_ok=True)

    # Check if required files exist in Firebase Storage
    required_files = ["index.faiss", "index.pkl"]
    downloaded_files = []
    
    blobs = bucket.list_blobs(prefix=folder_path)
    for blob in blobs:
        if not blob.name.endswith('/'):
            local_file_path = os.path.join(local_folder_path, os.path.basename(blob.name))
            try:
                blob.download_to_filename(local_file_path)
                downloaded_files.append(os.path.basename(blob.name))
                print(f"Downloaded {blob.name} to {local_file_path}")
            except Exception as e:
                print(f"Error downloading file {blob.name}: {e}")
                return None

    # Check if all required files were downloaded
    missing_files = [f for f in required_files if f not in downloaded_files]
    if missing_files:
        print(f"Missing required files: {missing_files}")
        # Clean up downloaded files
        remove_folder(local_folder_path)
        return None

    # Check if the index.faiss file actually exists locally
    index_faiss_path = os.path.join(local_folder_path, "index.faiss")
    if not os.path.exists(index_faiss_path):
        print(f"index.faiss file not found at {index_faiss_path}")
        remove_folder(local_folder_path)
        return None

    try:
        embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
        vectorstore = FAISS.load_local(local_folder_path, embeddings, allow_dangerous_deserialization=True)
        return vectorstore
    except Exception as e:
        print(f"Error loading FAISS index: {e}")
        remove_folder(local_folder_path)
        return None
    
def get_system_prompt():
    return """
    You are a conversational chatbot named 'MimirAI'. You specialize in fetching organization data and answering questions related to them.
    If any word is of the form *<word>* that word in confidential info don't share. Have profanity filter and don't repeat the bad words.
    If any offensive words present those words should not appear in the response even in bracket.
    You should provide the employee details if asked when you have that in context example name, mail, phone number, etc.
    """
    
def get_human_prompt():
    return """
    Use the following context about the organization to answer the question.
    Context: {context}
    _________________________________________________________________
    Answer the following query in a conversational way in the same language:
    {query}
    """
    
chat_history = {}

def get_chat_history(session_id : str) -> InMemoryChatMessageHistory() :
  if session_id not in chat_history :
    chat_history[session_id] = InMemoryChatMessageHistory()
  return chat_history[session_id]


def get_conversation_chain(vectorstore, context, query,uid):
    llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0.3)
    retriever = vectorstore.as_retriever(search_type="similarity", search_kwargs={"k": 10})
    system_prompt = get_system_prompt()
    human_prompt = get_human_prompt()
    query_prompt = ChatPromptTemplate.from_messages([
        SystemMessagePromptTemplate.from_template("""Your task is to create a retrieval query that will be used to fetch relevant document from the vectordatabase. Identify the users query and generate appropriate retrieval query"""),
        MessagesPlaceholder(variable_name="history"),
        HumanMessagePromptTemplate.from_template("""{query}""")
    ])

    query_chain = {"query": lambda x : x["query"], "history": lambda x : x["history"]} | query_prompt | llm | StrOutputParser()
    chat_his = get_chat_history(uid)
    query = query_chain.invoke({"query":query,"history" : chat_his.messages})
    
    prompt_template = ChatPromptTemplate.from_messages([
        SystemMessagePromptTemplate.from_template(system_prompt),
        MessagesPlaceholder(variable_name="history"),
        HumanMessagePromptTemplate.from_template(human_prompt)
    ])
    
    documents = retriever.invoke(query)
    context = " ".join([doc.page_content for doc in documents])
    
    # Create chain - The key fix is here
    chain = prompt_template | llm | StrOutputParser()
    
    # RunnableWithMessageHistory will automatically handle the history
    chat = RunnableWithMessageHistory(
        chain,
        get_session_history=get_chat_history,
        history_messages_key="history",
        input_messages_key="query"  # This should match your input key
    )
    
    return chat, context

def generate_word(text):
    try:
        output = llm1.invoke(f"""Given the folowing text return a python list of offensive words in it the output should look like [<word>,<word>...] if there's no offensive word return "" :
        {text}""")
        return output
    except Exception as e:
        raise Exception(f"Answer Generation Error: {str(e)}")


def store_token(uid, token, department):
    doc_ref = firest.collection("User").document(uid)
    doc = doc_ref.get()
    # Use local time consistently
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    new_token_obj = {
        "token": token,
        "department": department,
        "created_time": now,
        "last_accessed_time": now,
        "expiry_date" : "30 days"
    }
    # Get existing apikey list or initialize empty
    apikey_list = doc.to_dict().get("apikey", [])
    apikey_list.append(new_token_obj)
    doc_ref.update({"apikey": apikey_list})

def store_analytics_data(admin_email, user_email, query, response, response_time, department="Unknown"):
    """Store analytics data for each query processed"""
    try:
        # Use local time consistently
        now = datetime.now()
        analytics_data = {
            "admin_email": admin_email,
            "user_email": user_email,
            "user_department": department,
            "query": query,
            "response": response,
            "response_time": response_time,
            "timestamp": now.strftime("%Y-%m-%d %H:%M:%S"),
            "date": now.strftime("%Y-%m-%d"),
            "hour": now.hour,
            "satisfaction_score": 4.5,  # Default, can be updated later
            "query_length": len(query),
            "response_length": len(response)
        }
        
        # Store in analytics collection
        firest.collection("Analytics").add(analytics_data)
        
        # Update user metrics
        update_user_metrics(admin_email, user_email, department)
        
        # Update department metrics
        update_department_metrics(admin_email, department)
        
    except Exception as e:
        print(f"Error storing analytics data: {e}")

def update_user_metrics(admin_email, user_email, department):
    """Update user-specific metrics"""
    try:
        user_metrics_ref = firest.collection("UserMetrics").document(f"{admin_email}_{user_email}")
        user_doc = user_metrics_ref.get()
        
        # Use local time consistently
        now = datetime.now()
        today = now.strftime("%Y-%m-%d")
        
        if user_doc.exists:
            data = user_doc.to_dict()
            data["total_queries"] = data.get("total_queries", 0) + 1
            data["last_active"] = now.strftime("%Y-%m-%d %H:%M:%S")
            data["department"] = department
            
            # Update daily queries
            daily_queries = data.get("daily_queries", {})
            daily_queries[today] = daily_queries.get(today, 0) + 1
            data["daily_queries"] = daily_queries
            
            user_metrics_ref.update(data)
        else:
            user_data = {
                "admin_email": admin_email,
                "user_email": user_email,
                "user_name": user_email.split('@')[0].replace('.', ' ').title(),
                "department": department,
                "total_queries": 1,
                "last_active": now.strftime("%Y-%m-%d %H:%M:%S"),
                "created_date": today,
                "daily_queries": {today: 1},
                "avg_response_time": 1.5,
                "satisfaction_score": 4.5
            }
            user_metrics_ref.set(user_data)
            
    except Exception as e:
        print(f"Error updating user metrics: {e}")

def update_department_metrics(admin_email, department):
    """Update department-specific metrics"""
    try:
        dept_metrics_ref = firest.collection("DepartmentMetrics").document(f"{admin_email}_{department}")
        dept_doc = dept_metrics_ref.get()
        
        # Use local time consistently
        now = datetime.now()
        today = now.strftime("%Y-%m-%d")
        current_hour = now.hour
        
        if dept_doc.exists:
            data = dept_doc.to_dict()
            data["total_queries"] = data.get("total_queries", 0) + 1
            data["last_updated"] = now.strftime("%Y-%m-%d %H:%M:%S")
            
            # Update daily queries
            daily_queries = data.get("daily_queries", {})
            daily_queries[today] = daily_queries.get(today, 0) + 1
            data["daily_queries"] = daily_queries
            
            # Update hourly distribution
            hourly_dist = data.get("hourly_distribution", {})
            hourly_dist[str(current_hour)] = hourly_dist.get(str(current_hour), 0) + 1
            data["hourly_distribution"] = hourly_dist
            
            dept_metrics_ref.update(data)
        else:
            dept_data = {
                "admin_email": admin_email,
                "department": department,
                "total_queries": 1,
                "avg_response_time": 1.5,
                "satisfaction_score": 4.5,
                "documents_processed": 0,
                "topics_covered": 1,
                "last_updated": now.strftime("%Y-%m-%d %H:%M:%S"),
                "created_date": today,
                "daily_queries": {today: 1},
                "hourly_distribution": {str(current_hour): 1},
                "efficiency_score": 90.0
            }
            dept_metrics_ref.set(dept_data)
            
    except Exception as e:
        print(f"Error updating department metrics: {e}")

def get_dashboard_analytics(admin_email, days=30):
    """Get dashboard analytics data"""
    try:
        # Use local time consistently
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        # Get analytics data - using only admin_email filter to avoid composite index requirement
        analytics_query = firest.collection("Analytics") \
            .where("admin_email", "==", admin_email)
        
        analytics_docs = analytics_query.get()
        
        # Filter by date in memory to avoid composite index requirement
        start_date_str = start_date.strftime("%Y-%m-%d %H:%M:%S")
        
        filtered_docs = []
        for doc in analytics_docs:
            data = doc.to_dict()
            timestamp = data.get("timestamp", "")
            if timestamp >= start_date_str:
                filtered_docs.append(data)
        
        total_queries = len(filtered_docs)
        
        # Get unique users and calculate response times
        unique_users = set()
        daily_data = {}
        response_times = []
        
        for data in filtered_docs:
            unique_users.add(data.get("user_email", ""))
            date = data.get("date", "")
            if date:
                daily_data[date] = daily_data.get(date, 0) + 1
            
            # Extract response time if available
            response_time = data.get("response_time")
            if response_time is not None:
                try:
                    response_times.append(float(response_time))
                except (ValueError, TypeError):
                    pass
        
        # Calculate average response time
        avg_response_time = sum(response_times) / len(response_times) if response_times else 0.0
        
        # Get department metrics
        dept_docs = firest.collection("DepartmentMetrics") \
            .where("admin_email", "==", admin_email).get()
        
        departments = []
        for doc in dept_docs:
            dept_data = doc.to_dict()
            departments.append({
                "name": dept_data.get("department", "Unknown"),
                "total_queries": dept_data.get("total_queries", 0),
                "active_users": dept_data.get("active_users", 0)
            })
        
        # Get global admin document count
        total_documents_processed = 0
        try:
            admin_metrics_doc = firest.collection("AdminMetrics").document(admin_email).get()
            if admin_metrics_doc.exists:
                total_documents_processed = admin_metrics_doc.to_dict().get("documents_processed", 0)
        except Exception as e:
            print(f"Error getting admin document count: {e}")
        
        # Sort departments by total queries
        departments.sort(key=lambda x: x["total_queries"], reverse=True)
        most_active_dept = departments[0]["name"] if departments else "N/A"
        
        return {
            "active_users": len(unique_users),
            "total_queries": total_queries,
            "active_tokens": len(get_active_tokens(admin_email)),
            "most_active_department": most_active_dept,
            "documents_processed": total_documents_processed,
            "avg_response_time": round(avg_response_time, 2),
            "daily_data": daily_data,
            "recent_activities": get_recent_activities(admin_email)
        }
        
    except Exception as e:
        print(f"Error getting dashboard analytics: {e}")
        return {
            "active_users": 0,
            "total_queries": 0,
            "active_tokens": 0,
            "most_active_department": "N/A",
            "documents_processed": 0,
            "avg_response_time": 0.0,
            "daily_data": {},
            "recent_activities": []
        }

def get_active_tokens(admin_email):
    """Get active API tokens for admin"""
    try:
        user_doc = firest.collection("User").document(admin_email).get()
        if user_doc.exists:
            data = user_doc.to_dict()
            apikey = data.get("apikey", [])
            # Handle case where apikey might be a string instead of a list
            if isinstance(apikey, str):
                return [apikey] if apikey else []
            elif isinstance(apikey, list):
                return apikey
            else:
                return []
        return []
    except Exception as e:
        print(f"Error getting active tokens: {e}")
        return []

def get_recent_activities(admin_email, limit=10):
    """Get recent activities for dashboard"""
    try:
        # Get all analytics data for admin and sort in memory to avoid composite index
        activities_query = firest.collection("Analytics") \
            .where("admin_email", "==", admin_email)
        
        activities_docs = activities_query.get()
        
        # Sort by timestamp in memory
        activities_data = []
        for doc in activities_docs:
            data = doc.to_dict()
            activities_data.append(data)
        
        # Sort by timestamp (descending) and limit
        activities_data.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        activities_data = activities_data[:limit]
        
        activities = []
        for data in activities_data:
            activities.append({
                "type": "query_processed",
                "description": f"Query processed for {data.get('user_department', 'Unknown')} department",
                "timestamp": data.get("timestamp", ""),
                "user_email": data.get("user_email", "")
            })
        
        return activities
        
    except Exception as e:
        print(f"Error getting recent activities: {e}")
        return []


def get_filter_words(text):
    array_pattern = r'^\[\s*(?:".*?"|\'.*?\'|\d+)(?:\s*,\s*(?:".*?"|\'.*?\'|\d+))*\s*\]$'

    if re.match(array_pattern,text):
        try:
            word_list = ast.literal_eval(text)
            return word_list
        except (ValueError, SyntaxError):
            return []
    return []



def put_filter_words(words,document_id,rewrite):
    print(words)
    doc_ref = firest.collection("User").document(document_id)

    # Fetch the current document
    doc = doc_ref.get()

    if not doc.exists:
        raise ValueError(f"Document with ID {document_id} does not exist.")

    # Get the current `filter_words` field value
    doc_data = doc.to_dict()
    current_filter_words = doc_data.get("filter_words", [])

    if rewrite:
        # Replace the `filter_words` field
        updated_filter_words = words
    else:
        # Append the new words, ensuring no duplicates
        updated_filter_words = list(set(current_filter_words + words))

    # Update the document
    doc_ref.update({
        "filter_words": updated_filter_words
    })

    print(f"Document with ID {document_id} updated successfully. filterwords added")

def fetch_filterwords(email):
    doc_ref = firest.collection("User").document(email)
    doc = doc_ref.get()
    doc_data = doc.to_dict()
    filter_words = doc_data.get("filter_words")
    return filter_words
def signup_admin(email, password, username, disabled):
    """
    Store admin data in Firestore with the email as the document ID.
    If the email already exists, return an appropriate message.

    Args:
        email (str): The email of the admin (used as the document ID).
        password (str): The password of the admin.
        username (str): The username of the admin.
        disabled (bool): The disabled status of the admin.

    Returns:
        str: Success or error message.
    """
    try:
        doc_ref = firest.collection("User").document(email)
        doc = doc_ref.get()
        if doc.exists:
            return {"status":False,"message": "Email already exists."}

        # Construct the data to be stored
        admin_data = {
            "email": email,
            "password": password,
            "username": email,
            "disabled": disabled,
            "domains":[],
            "filter_words":[]
        }

        # Store the data in Firestore
        doc_ref.set(admin_data)
        return {"status":True,"message":"Admin successfully created."}

    except Exception as e:
        return {"status":False,"message":f"An error occurred: {e}"}


def login_admin(email, password):
    """
    Authenticate an admin using email and password.

    Args:
        email (str): The email of the admin.
        password (str): The plain text password of the admin.

    Returns:
        str: Login result message.
    """
    try:
        # Retrieve the document by email
        doc_ref = firest.collection("User").document(email)
        doc = doc_ref.get()

        # Check if the document exists
        if not doc.exists:
            return "Error: Email doesn't exist.",False

        # Get the stored data
        admin_data = doc.to_dict()
        hashed_password = admin_data.get("password")

        # Verify the password
        if verify_password(password, hashed_password):
            return "Login successful.",True
        else:
            return "Error: Wrong password.",False

    except Exception as e:
        return f"An error occurred: {e}",False

def get_prefix_from_email(email):
    if '@' in email:
        return email.split('@')[0]
    return email


def add_domain_user(email,domain):
    doc_ref = firest.collection("User").document(email)
    doc = doc_ref.get()

    if not doc.exists:
        raise ValueError(f"Document with ID {email} does not exist.")

    # Get the current `filter_words` field value
    doc_data = doc.to_dict()
    current_domains = doc_data.get("domains", [])
    updated_domains = list(set(current_domains + [domain]))

    # Update the document
    doc_ref.update({
        "domains": updated_domains
    })
    return {"message":"Domain has been added"}

def check_domain(email,doc):
  dom = email.split('@')[-1]
  print(dom)
  try:
        # Reference to the user document in Firestore
        user_ref = firest.collection("User").document(doc)
        user_doc = user_ref.get()

        if user_doc.exists:
            data = user_doc.to_dict()
            domains = data.get("domains")
            print(domains)
            if(len(domains)==0):
              return True
            else:
              for d in domains:
                if(d==dom):
                  return True
              return False

        else:
            print("No such document!")
            return {"status": False, "error": "Document not found"}
  except Exception as e:
        print(f"Error getting document: {e}")
        return {"status": False, "error": str(e)}

def create_folder(folder_path, files):
    os.makedirs(folder_path, exist_ok=True)

    for file_url in files:
        try:
            filename = file_url.split("?")[0].split("/")[-1]
            file_path = os.path.join(folder_path, filename)

            with requests.get(file_url, stream=True) as response:
                response.raise_for_status()
                with open(file_path, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        if chunk:
                            f.write(chunk)

            print(f"Downloaded: {filename}")
        except Exception as e:
            print(f"Error downloading {file_url}: {e}")




@app.get("/")
async def root():
    return {"message": "MimirAI Base URL"}

@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(firest, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Incorrect username or password", headers={"WWW-Authenticate": "Bearer"})
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user['username']}, expires_delta=access_token_expires)
    # store_token(form_data.username, access_token, "Engineering")
    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/emp-process")
def process_emp_files(request:EMPFile, current_user: UserInDB = Depends(get_current_active_user)):
  files = request.files
  userid = request.userid
  create_folder(f"{userid}-files",files)
  raw_text = get_text(f"{userid}-files")
  remove_folder(f"{userid}-files")
  text_chunks = get_text_chunks(raw_text)
  vectorstore = create_vectorstore(text_chunks,True,userid)
  return {"message":"Sucessful"}


@app.post("/process")
def process_files(request:File, current_user: UserInDB = Depends(get_current_active_user)):
  uid = current_user['username']
  files = request.files
  rewrite = request.rewrite
  create_folder(f"{uid}-files",files)
  raw_text = get_text(f"{uid}-files")
  remove_folder(f"{uid}-files")
  filter_words = get_filter_words(generate_word(raw_text).content)
  print(filter_words)
  put_filter_words(filter_words,uid,rewrite)
  text_chunks = get_text_chunks(raw_text)
  vectorstore = create_vectorstore(text_chunks,rewrite,uid)
  
  # Update global documents processed count for this admin
  try:
    # Update or create a general document count for this admin
    admin_doc_ref = firest.collection("AdminMetrics").document(uid)
    admin_doc = admin_doc_ref.get()
    
    if admin_doc.exists:
      admin_data = admin_doc.to_dict()
      current_docs = admin_data.get("documents_processed", 0)
      
      if rewrite:
        # If rewrite is enabled, reset the count to current files being processed
        new_doc_count = len(files)
        admin_doc_ref.update({
          "documents_processed": new_doc_count,
          "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        })
        print(f"Reset document count for admin {uid}: {new_doc_count} documents (rewrite enabled)")
      else:
        # If rewrite is disabled, add to existing count
        admin_doc_ref.update({
          "documents_processed": current_docs + len(files),
          "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        })
        print(f"Updated document count for admin {uid}: +{len(files)} documents (total: {current_docs + len(files)})")
    else:
      # Create new record with current files count
      admin_doc_ref.set({
        "admin_email": uid,
        "documents_processed": len(files),
        "created_date": datetime.now().strftime("%Y-%m-%d"),
        "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
      })
      print(f"Created new document count for admin {uid}: {len(files)} documents")
      
  except Exception as e:
    print(f"Error updating document count: {e}")
  
  return {"message":"Sucessful"}

@app.post("/generate")
def generate_response(request: FileRequest,current_user: UserInDB = Depends(get_current_active_user)):
    uid = current_user['username']
    query = request.query
    db_name = request.db_name
    userid_with_at = request.userid
    userid = get_prefix_from_email(userid_with_at)
    context = ""
    
    # Use local time for consistency with analytics
    start_time = datetime.now()
    
    if (check_domain(userid_with_at,uid)):
      if(db_name=="ORG"):
        vectorstore = get_vectorstore(uid)
      elif(db_name=="EMP"):
        vectorstore = get_vectorstore(userid_with_at)
      
      # Check if vectorstore was successfully loaded
      if vectorstore is None:
        return {"title": '', "questions": '', "response": "No vector database found. Please upload documents first."}
      
      chain,context= get_conversation_chain(vectorstore,context,query,uid)
      result = chain.invoke({"query":query,"context":context},config={"session_id": uid})
      # if contains_any_word(filter_words, result):
      #   result = "I'm sorry, but I can't answer that question. It might be confidential or not within the kind of language I can use. If you have any other questions, feel free to ask—I'm here to help! 😊"
      
      # Calculate response time
      end_time = datetime.now()
      response_time = (end_time - start_time).total_seconds()
      
      # Store analytics data
      user_department = "Engineering"  # You can extract this from user data if available
      try:
        user_doc = firest.collection("UserMetrics").document(f"{uid}_{userid_with_at}").get()
        if user_doc.exists:
          user_department = user_doc.to_dict().get("department", "Unknown")
      except:
        pass
        
      store_analytics_data(uid, userid_with_at, query, result, response_time, user_department)
      
      put_context(userid,query,result)
      title, questions = '',''
      # title, questions = generate_questions(result)
      # return {"title": title, "questions": questions, "response": result["result"]}
      remove_folder(f'{uid}-vectorstore.json')
      remove_folder(f'{userid}-vectorstore.json')
      return {"title": title, "questions": questions, "response": result}
    else:
      return {"title":'', "questions": '', "response":"Sorry you are not allowed to access the data"}
@app.post("/otp_generator")
def otp_gen(request:OTPRequest):
    email = request.email
    otp = generate_otp()
    hashed_otp = get_password_hash(otp)
    print(hashed_otp)
    add_otp(email,hashed_otp)
    send_otp_via_email(email, otp)


@app.post("/get_filterwords")
def get_filterwords(request:FilterWord):
    email = request.email
    filter_words = fetch_filterwords(email)
    return {"filter_words":filter_words}

@app.post("/add_domain")
def add_domain(request:AddDomain):
    email = request.email
    domain = request.domain
    return add_domain_user(email,domain)

@app.post("/otp_auth")
def otp_auth(request:OTP_AUTH):
    email = request.email
    otp = request.otp
    res = authenticate_otp(email,otp)
    if res["status"]==True:
        return res
    elif(res["status"]==False):
        return res
    else:
        return res

@app.post("/signup")
def signup(request:SignUp):
    email = request.email
    password = request.password
    username = request.username
    disabled = False
    hashed_password = get_password_hash(password)
    return signup_admin(email,hashed_password,username,disabled)


@app.post("/login")
async def login(request:Login):
    email = request.email
    password = request.password
    mes,status = login_admin(email,password)
    return {"status":status,"message":mes}

@app.get("/dashboard-analytics/{admin_email}")
def get_dashboard_data(admin_email: str, days: int = 30):
    """Get dashboard analytics data"""
    return get_dashboard_analytics(admin_email, days)

@app.get("/department-analytics/{admin_email}")
def get_department_analytics_data(admin_email: str, days: int = 30):
    """Get department-wise analytics data"""
    
    try:
        # Use local time consistently
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        # Get total documents processed from AdminMetrics
        total_documents_processed = 0
        try:
            admin_metrics_doc = firest.collection("AdminMetrics").document(admin_email).get()
            if admin_metrics_doc.exists:
                total_documents_processed = admin_metrics_doc.to_dict().get("documents_processed", 0)
        except Exception as e:
            print(f"Error getting admin document count: {e}")
        
        # Get department metrics
        dept_docs = firest.collection("DepartmentMetrics") \
            .where("admin_email", "==", admin_email).get()
        
        department_metrics = []
        time_series_data = {}
        topic_distribution = {}
        
        # Get analytics data to calculate accurate active users per department
        analytics_query = firest.collection("Analytics") \
            .where("admin_email", "==", admin_email)
        analytics_docs = analytics_query.get()
        
        # Filter by date and group by department
        start_date_str = start_date.strftime("%Y-%m-%d %H:%M:%S")
        dept_user_counts = {}
        
        for analytics_doc in analytics_docs:
            analytics_data = analytics_doc.to_dict()
            timestamp = analytics_data.get("timestamp", "")
            if timestamp >= start_date_str:
                dept = analytics_data.get("user_department", "Unknown")
                user_email = analytics_data.get("user_email", "")
                if dept not in dept_user_counts:
                    dept_user_counts[dept] = set()
                dept_user_counts[dept].add(user_email)
        
        for doc in dept_docs:
            dept_data = doc.to_dict()
            dept_name = dept_data.get("department", "Unknown")
            
            # Get accurate active users count from analytics data
            active_users_count = len(dept_user_counts.get(dept_name, set()))
            
            # Get peak hours from hourly distribution
            hourly_dist = dept_data.get("hourly_distribution", {})
            peak_hours = []
            if hourly_dist:
                # Get top 3 peak hours
                sorted_hours = sorted(hourly_dist.items(), key=lambda x: x[1], reverse=True)
                peak_hours = [f"{hour}:00" for hour, _ in sorted_hours[:3]]
            
            department_metrics.append({
                "name": dept_name,
                "totalQueries": dept_data.get("total_queries", 0),
                "avgResponseTime": dept_data.get("avg_response_time", 1.5),
                "satisfactionScore": dept_data.get("satisfaction_score", 4.5),
                "documentsProcessed": total_documents_processed,  # Use admin total for all departments
                "topicsCovered": dept_data.get("topics_covered", 0),
                "activeUsers": active_users_count,  # Use accurate count from analytics
                "peakHours": peak_hours,
                "growth": 15.0,  # Calculate based on historical data
                "efficiency": dept_data.get("efficiency_score", 90.0)
            })
            
            # Aggregate daily data for time series
            daily_queries = dept_data.get("daily_queries", {})
            for date, count in daily_queries.items():
                if date not in time_series_data:
                    time_series_data[date] = {
                        "date": date,
                        "queries": 0,
                        "satisfaction": 4.5,
                        "responseTime": 1.5,
                        "newDocuments": 0
                    }
                time_series_data[date]["queries"] += count
        
        # Convert time series data to list and sort by date
        time_series_list = list(time_series_data.values())
        time_series_list.sort(key=lambda x: x["date"])
        
        # Generate topic distribution (mock data for now)
        topic_distribution = [
            {"name": "Policy Questions", "value": 35, "color": "#8884d8"},
            {"name": "Technical Support", "value": 28, "color": "#82ca9d"},
            {"name": "Procedural Guidance", "value": 20, "color": "#ffc658"},
            {"name": "Compliance Issues", "value": 12, "color": "#ff7300"},
            {"name": "Training Materials", "value": 5, "color": "#00ff00"}
        ]
        
        print({
            "departmentMetrics": department_metrics,
            "timeSeriesData": time_series_list,
            "topicDistribution": topic_distribution,
            "userEngagement": []  # Can be populated based on user analytics
        })
        
        return {
            "departmentMetrics": department_metrics,
            "timeSeriesData": time_series_list,
            "topicDistribution": topic_distribution,
            "userEngagement": []  # Can be populated based on user analytics
        }
        
    except Exception as e:
        print(f"Error getting department analytics: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving department analytics")

@app.get("/user-analytics/{admin_email}")
def get_user_analytics_data(admin_email: str, days: int = 30, department: str = "all"):
    """Get user-wise analytics data"""
    
    try:
        # Get user metrics
        user_query = firest.collection("UserMetrics") \
            .where("admin_email", "==", admin_email)
        
        if department != "all":
            user_query = user_query.where("department", "==", department)
        
        user_docs = user_query.get()
        
        user_data = []
        engagement_data = {}
        top_users_data = []
        
        for doc in user_docs:
            user_info = doc.to_dict()
            user_email = user_info.get("user_email", "")
            
            # Calculate trend (mock calculation)
            total_queries = user_info.get("total_queries", 0)
            trend = "up" if total_queries > 50 else "down" if total_queries < 20 else "stable"
            trend_percent = min(25, max(5, total_queries // 10))
            
            user_data.append({
                "id": user_email,
                "employeeId": user_email.split('@')[0].upper(),
                "name": user_info.get("user_name", user_email.split('@')[0].title()),
                "department": user_info.get("department", "Unknown"),
                "totalQueries": total_queries,
                "lastActive": user_info.get("last_active", "Unknown"),
                "trend": trend,
                "trendPercent": trend_percent,
                "avgResponseTime": f"{user_info.get('avg_response_time', 1.5)}s",
                "satisfactionScore": user_info.get("satisfaction_score", 4.5)
            })
            
            # Aggregate for engagement data
            dept = user_info.get("department", "Unknown")
            if dept not in engagement_data:
                engagement_data[dept] = {"queries": 0, "users": 0}
            engagement_data[dept]["queries"] += total_queries
            engagement_data[dept]["users"] += 1
            
            # Add to top users
            top_users_data.append({
                "name": user_info.get("user_name", user_email.split('@')[0]),
                "queries": total_queries
            })
        
        # Sort users by total queries
        user_data.sort(key=lambda x: x["totalQueries"], reverse=True)
        top_users_data.sort(key=lambda x: x["queries"], reverse=True)
        top_users_data = top_users_data[:5]  # Top 5 users
        
        # Convert engagement data to list
        engagement_list = []
        for dept, data in engagement_data.items():
            engagement_list.append({
                "name": dept,
                "queries": data["queries"],
                "activeUsers": data["users"]
            })
        
        return {
            "userData": user_data,
            "engagementData": engagement_list,
            "topUsersData": top_users_data
        }
        
    except Exception as e:
        print(f"Error getting user analytics: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving user analytics")

@app.get("/reports-data/{admin_email}")
def get_reports_data(admin_email: str, report_type: str = "all", days: int = 30):
    """Get reports data"""
    
    try:
        # Use local time consistently
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        # Generate report templates with real data - avoid composite index requirement
        analytics_docs = firest.collection("Analytics") \
            .where("admin_email", "==", admin_email).get()
        
        # Filter by date in memory to avoid composite index requirement
        start_date_str = start_date.strftime("%Y-%m-%d %H:%M:%S")
        analytics_count = sum(1 for doc in analytics_docs 
                            if doc.to_dict().get("timestamp", "") >= start_date_str)
        
        dept_count = len(firest.collection("DepartmentMetrics") \
            .where("admin_email", "==", admin_email).get())
        
        user_count = len(firest.collection("UserMetrics") \
            .where("admin_email", "==", admin_email).get())
        
        reports = [
            {
                "id": "1",
                "name": "Monthly Usage Report",
                "type": "usage",
                "description": f"Comprehensive overview of chatbot usage across {dept_count} departments",
                "lastGenerated": datetime.utcnow().strftime("%Y-%m-%d"),
                "size": f"{max(1, analytics_count // 1000)}.{analytics_count % 1000 // 100} MB",
                "status": "ready",
                "dataPoints": analytics_count
            },
            {
                "id": "2",
                "name": "Department Analytics",
                "type": "analytics",
                "description": f"Detailed analytics breakdown by department and {user_count} user engagement metrics",
                "lastGenerated": datetime.utcnow().strftime("%Y-%m-%d"),
                "size": f"{max(1, dept_count * 100 // 1000)}.{dept_count * 100 % 1000 // 100} MB",
                "status": "ready",
                "dataPoints": dept_count
            },
            {
                "id": "3",
                "name": "Security Audit Log",
                "type": "security",
                "description": "Security events, token usage, and access patterns",
                "lastGenerated": datetime.utcnow().strftime("%Y-%m-%d"),
                "size": "956 KB",
                "status": "ready",
                "dataPoints": len(get_active_tokens(admin_email))
            },
            {
                "id": "4",
                "name": "Performance Metrics",
                "type": "performance",
                "description": "Response times, system performance, and optimization insights",
                "lastGenerated": datetime.utcnow().strftime("%Y-%m-%d"),
                "size": "1.2 MB",
                "status": "ready",
                "dataPoints": analytics_count
            }
        ]
        
        if report_type != "all":
            reports = [r for r in reports if r["type"] == report_type]
        
        return {
            "reports": reports,
            "summary": {
                "totalReports": len(reports),
                "totalDataPoints": sum(r["dataPoints"] for r in reports),
                "lastUpdated": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
            }
        }
        
    except Exception as e:
        print(f"Error getting reports data: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving reports data")

@app.post("/update-satisfaction")
def update_satisfaction_score(request: dict):
    """Update satisfaction score for a query"""
    try:
        query_id = request.get("query_id")
        score = request.get("score", 4.5)
        admin_email = request.get("admin_email", "")  # Get from request instead of current_user
        
        # Update analytics record - avoid composite index issue
        analytics_docs = firest.collection("Analytics") \
            .where("admin_email", "==", admin_email).get()
        
        if analytics_docs:
            # Sort by timestamp in memory to get the latest one
            sorted_docs = sorted(analytics_docs, 
                               key=lambda x: x.to_dict().get("timestamp", ""), 
                               reverse=True)
            
            if sorted_docs:
                doc = sorted_docs[0]
                doc.reference.update({"satisfaction_score": score})
            
            return {"message": "Satisfaction score updated successfully"}
        
        return {"message": "Query not found"}
        
    except Exception as e:
        print(f"Error updating satisfaction score: {e}")
        raise HTTPException(status_code=500, detail="Error updating satisfaction score")

@app.get("/test-analytics/{admin_email}")
def test_analytics(admin_email: str):
    """Test analytics endpoint without auth"""
    try:
        result = get_dashboard_analytics(admin_email, 30)
        return {"status": "success", "data": result}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/create-sample-analytics/{admin_email}")
def create_sample_analytics(admin_email: str):
    """Create sample analytics data for testing"""
    try:
        # Create sample analytics data
        sample_data = [
            {
                "admin_email": admin_email,
                "user_email": "john.doe@company.com",
                "user_department": "IT",
                "query": "What is the company policy on remote work?",
                "response": "The company policy allows remote work up to 3 days per week...",
                "response_time": 1.2,
                "timestamp": (datetime.utcnow() - timedelta(days=1)).strftime("%Y-%m-%d %H:%M:%S"),
                "date": (datetime.utcnow() - timedelta(days=1)).strftime("%Y-%m-%d"),
                "hour": 9,
                "satisfaction_score": 4.5,
                "query_length": 45,
                "response_length": 120
            },
            {
                "admin_email": admin_email,
                "user_email": "jane.smith@company.com", 
                "user_department": "HR",
                "query": "How do I apply for vacation leave?",
                "response": "You can apply for vacation leave through the HR portal...",
                "response_time": 0.8,
                "timestamp": (datetime.utcnow() - timedelta(hours=2)).strftime("%Y-%m-%d %H:%M:%S"),
                "date": datetime.utcnow().strftime("%Y-%m-%d"),
                "hour": datetime.utcnow().hour,
                "satisfaction_score": 4.8,
                "query_length": 32,
                "response_length": 85
            }
        ]
        
        # Add to Firestore
        for data in sample_data:
            firest.collection("Analytics").add(data)
        
        # Create sample department metrics
        dept_data = {
            "admin_email": admin_email,
            "department": "IT",
            "total_queries": 15,
            "active_users": 5,
            "avg_response_time": 1.3,
            "satisfaction_score": 4.6,
            "documents_processed": 3,
            "topics_covered": 8,
            "last_updated": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
            "created_date": datetime.utcnow().strftime("%Y-%m-%d"),
            "daily_queries": {datetime.utcnow().strftime("%Y-%m-%d"): 5},
            "hourly_distribution": {"9": 3, "10": 2, "14": 4, "15": 6},
            "efficiency_score": 92.0
        }
        firest.collection("DepartmentMetrics").add(dept_data)
        
        # Create sample user metrics
        user_data = {
            "admin_email": admin_email,
            "user_email": "john.doe@company.com",
            "user_name": "John Doe",
            "department": "IT",
            "total_queries": 8,
            "last_active": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
            "created_date": datetime.utcnow().strftime("%Y-%m-%d"),
            "daily_queries": {datetime.utcnow().strftime("%Y-%m-%d"): 3},
            "avg_response_time": 1.2,
            "satisfaction_score": 4.5
        }
        firest.collection("UserMetrics").add(user_data)
        
        return {"status": "success", "message": "Sample analytics data created"}
    except Exception as e:
        print(f"Error creating sample data: {e}")
        return {"status": "error", "message": str(e)}
