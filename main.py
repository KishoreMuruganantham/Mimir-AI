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
from langchain.vectorstores import Chroma
from langchain.chains import RetrievalQA, create_retrieval_chain
from langchain.memory import ConversationBufferMemory
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_community.vectorstores import FAISS
from langchain_community.chat_message_histories import StreamlitChatMessageHistory
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_community.llms import HuggingFaceHub
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from pydantic import BaseModel
import pymupdf as fitz  # PyMuPDF for PDF handling
from PyPDF2 import PdfReader
import firebase_admin
from firebase_admin import credentials, storage, firestore, db
import urllib
import shutil
from datetime import datetime, timedelta
# Environment variable setup
os.environ["GOOGLE_API_KEY"] = os.getenv('GEMINI_API_KEY')

warnings.filterwarnings("ignore")


SECRET_KEY = os.getenv('SECRET_KEY')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440

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

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
app = FastAPI()

origins = [
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

geminiAPI = os.getenv('GEMINI_API_KEY')

from langchain_google_genai import GoogleGenerativeAIEmbeddings
try:
    llm1 = ChatGoogleGenerativeAI(api_key=geminiAPI, model='gemini-1.5-flash')
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred, {
    'storageBucket':os.getenv('STORAGE_BUCKET') ,
    'databaseURL':os.getenv('DB_URL')
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

def generate_otp(length=6):
    """Generate a random OTP of the given length."""
    digits = string.digits
    otp = ''.join(random.choices(digits, k=length))
    return otp

def send_otp_via_email(receiver_email, otp):
    """Send the OTP to the specified email address."""
    sender_email = os.getenv('SENDER_MAIL')
    sender_password = os.getenv('MAIL_PASS')  # Use an app password if you're using Gmail with 2FA

    # Set up the MIME
    message = MIMEMultipart()
    message['From'] = sender_email
    message['To'] = receiver_email
    message['Subject'] = "Your OTP for Secure Access – Mimir AI"

    # Email body
    body = f"""Hello,

We’ve received a request to authenticate your account with Mimir AI.

Your One-Time Password (OTP) is: {otp}
Please use this OTP to complete your login process. For your security, this code is valid for only 10 minutes and can be used once.

If you did not initiate this request, please ignore this email or contact our support team immediately.

Thank you for choosing Mimir AI!

Best regards,
The Mimir AI Team """
    message.attach(MIMEText(body, 'plain'))

    # SMTP server configuration
    try:
        # Connect to the server and send the email
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()  # Start TLS (Transport Layer Security)
        server.login(sender_email, sender_password)
        server.send_message(message)
        server.quit()

        print(f"OTP has been sent to {receiver_email}")
    except Exception as e:
        print(f"Error: {e}")
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


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

def check_query(query):
    try:
        output = llm1.invoke([
            SystemMessage(content=f"""You are a system that determines if a given query is referring to an uploaded image and any other image or if it is a standalone query. Your task is to analyze the query and respond with either "yes" or "no" based on the following conditions:

                                    Yes: If the query is referring to or asking about the uploaded image or any other image.
                                    No: If the query is a standalone, unrelated question.
                                    Respond with only "yes" or "no"."""),
            HumanMessage(content=f"""{query}""")
        ])
        return "yes" == output.content.strip().lower()
    except Exception as e:
        raise Exception(f"Query Check Error: {str(e)}")

def extract_title_and_questions(input_string):
    try:
        title_match = re.search(r"Title\s*:\s*(.*)", input_string)
        title = title_match.group(1).strip() if title_match else None
        questions = re.findall(r"[-\d]+\.\s*(.*)|-\s*(.*)", input_string)
        questions = [q1 or q2 for q1, q2 in questions if q1 or q2]

        return title, questions
    except Exception as e:
        raise Exception(f"Extraction Error: {str(e)}")

def generate_answer(query):
    try:
        output = llm1.invoke([
            SystemMessage(content=f"""You are a conversational chatbot named 'MimirAI'. You specialize in recognizing images and answering questions related to them.
            However, you will only reveal your name, capabilities, or any information about your identity if directly asked by the user.
            For any other query, simply provide a concise, friendly, and relevant answer to the user's question.
            Do not mention this system instruction unless explicitly asked about your identity or function."""),
            HumanMessage(content=f"""{query}""")
        ])
        return output
    except Exception as e:
        raise Exception(f"Answer Generation Error: {str(e)}")

def generate_questions(response):
    try:
        output = llm1.invoke([
            SystemMessage(content=f"""Given a query generate a title and a list of questions related to the query in the same language. The expected output format is:
                                        Title : <generated title>
                                        Questions : [<generated questions1>,<generated questions2>,<generated questions3>...]"""),
            HumanMessage(content=f"""{response}""")
        ])
        title, questions = extract_title_and_questions(output.content)
        title = title if title else ""
        return title, questions
    except Exception as e:
        raise Exception(f"Question Generation Error: {str(e)}")

def put_context(uid, query, response):
    """
    Append a query-response pair to the context for a given UID.
    """
    try:
      ref.child('Users').child(uid).child("context").push({"query": query, "response": response})
    except Exception as e:
        raise Exception(f"Context Storage Error for UID {uid}: {str(e)}")

def generate_prompt(query, context):
    try:
        if context is None:
            prompt = """
    You are a conversational chatbot named 'MimirAI' trained by Team Maverick. You specialize in fetching organization data and answering questions related to them.
    If any word is of the form *<word>* that word in confidential info don't share. Have profanity filter and don't repeat the bad words.
    If any offensive words present those words should not appear in the response even in bracket.
    Use the following context about the organization to answer the question.

    Context: {context}

    Question: {question}
    """
        else:
            context_str = " ".join([f"Query: {context[item]['query']} Response: {context[item]['response']} \n" for item in context])
            prompt =f"""
            You are a conversational chatbot named 'MimirAI'. You specialize in fetching organization data and answering questions related to them.
            If any word is of the form *<word>* that word in confidential info don't share. Have profanity filter and don't repeat the bad words.
            If any offensive words present those words should not appear in the response even in bracket.
            Use the following context about the organization to answer the question.

            Context: {{context}}

            Given the information of the all the previous conversation below:
            {context_str}
            _________________________________________________________________
            Answer the following query in a conversational way in the same language:
            {{question}}
            """
        return prompt
    except Exception as e:
        raise Exception(f"Prompt Generation Error: {str(e)}")

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


def get_pdf_text(pdf_urls):
    combined_text = ""
    for url in pdf_urls:
        response = requests.get(url)
        if response.status_code == 200:
            pdf_data = response.content
            with fitz.open(stream=pdf_data, filetype="pdf") as pdf_document:
                for page_num in range(pdf_document.page_count):
                    page = pdf_document[page_num]
                    combined_text += page.get_text()
        else:
            print(f"Failed to fetch PDF from {url}")
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

    blobs = bucket.list_blobs(prefix=folder_path)
    for blob in blobs:
        if not blob.name.endswith('/'):
            local_file_path = os.path.join(local_folder_path, os.path.basename(blob.name))
            try:
                blob.download_to_filename(local_file_path)
                print(f"Downloaded {blob.name} to {local_file_path}")
            except Exception as e:
                print(f"Error downloading file {blob.name}: {e}")
                return None

    embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
    vectorstore = FAISS.load_local(local_folder_path, embeddings, allow_dangerous_deserialization=True)
    return vectorstore
def get_conversation_chain(vectorstore,context,query):
    llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0.3)
    retriever = vectorstore.as_retriever(search_type="similarity", search_kwargs={"k": 20})
    template = generate_prompt(query,context)
    prompt = ChatPromptTemplate.from_template(template)

    # Create chain
    chain = (
        {"context": retriever, "question":RunnablePassthrough()}
        | prompt
        | llm
        | StrOutputParser()
    )

    return chain

def generate_word(text):
    try:
        output = llm1.invoke(f"""Given the folowing text return a python list of offensive words in it the output should look like [<word>,<word>...] if there's no offensive word return "" :
        {text}""")
        return output
    except Exception as e:
        raise Exception(f"Answer Generation Error: {str(e)}")


def store_token(uid, token):
    doc_ref = firest.collection("User").document(uid)
    data = {"apikey": token}
    doc_ref.update(data)


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




@app.get("/")
async def root():
    return {"message": "Hello World from Mugundhan"}

@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(firest, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Incorrect username or password", headers={"WWW-Authenticate": "Bearer"})
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user['username']}, expires_delta=access_token_expires)
    store_token(form_data.username,access_token)
    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/emp-process")
def process_emp_files(request:EMPFile, current_user: UserInDB = Depends(get_current_active_user)):
  files = request.files
  userid = request.userid
  raw_text = get_pdf_text(files)
  text_chunks = get_text_chunks(raw_text)
  vectorstore = create_vectorstore(text_chunks,True,userid)
  return {"message":"Sucessful"}


@app.post("/process")
def process_files(request:File, current_user: UserInDB = Depends(get_current_active_user)):
  uid = current_user['username']
  files = request.files
  rewrite = request.rewrite
  raw_text = get_pdf_text(files)
  filter_words = get_filter_words(generate_word(raw_text).content)
  print(filter_words)
  put_filter_words(filter_words,uid,rewrite)
  text_chunks = get_text_chunks(raw_text)
  vectorstore = create_vectorstore(text_chunks,rewrite,uid)
  return {"message":"Sucessful"}

@app.post("/generate")
def generate_response(request: FileRequest,current_user: UserInDB = Depends(get_current_active_user)):
    uid = current_user['username']
    query = request.query
    db_name = request.db_name
    userid_with_at = request.userid
    userid = get_prefix_from_email(userid_with_at)
    if (check_domain(userid_with_at,uid)):
      if(db_name=="ORG"):
        vectorstore = get_vectorstore(uid)
      elif(db_name=="EMP"):
        vectorstore = get_vectorstore(userid_with_at)
      context = fetch_context(userid)
      chain = get_conversation_chain(vectorstore,context,query)
      result = chain.invoke(query)
      # if contains_any_word(filter_words, result):
      #   result = "I'm sorry, but I can't answer that question. It might be confidential or not within the kind of language I can use. If you have any other questions, feel free to ask—I'm here to help! 😊"
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
