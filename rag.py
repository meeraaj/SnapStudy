import os
import psycopg2
from docling.document_converter import DocumentConverter
from langchain_text_splitters import MarkdownHeaderTextSplitter, RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer

# Configuration
PDF_PATH = os.getenv("PDF_PATH", "data/BEEE-UNIT 2.pdf")
DB_NAME = os.getenv("DB_NAME", "your_db")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASS = os.getenv("DB_PASS", "pass")
DB_HOST = os.getenv("DB_HOST", "localhost")

# 1. Load book text using Docling
if not os.path.exists(PDF_PATH):
    print(f"Error: PDF file not found at {PDF_PATH}")
    exit(1)

print("Converting PDF to Markdown using Docling. This may take a moment...")
converter = DocumentConverter()
result = converter.convert(PDF_PATH)
md_string = result.document.export_to_markdown()

# 2. Split into chunks structurally
headers_to_split_on = [
    ("#", "chapter_title"),
    ("##", "section_title"),
]
print("Splitting via Markdown headers into Chapters & Sections...")
markdown_splitter = MarkdownHeaderTextSplitter(headers_to_split_on=headers_to_split_on)
md_header_splits = markdown_splitter.split_text(md_string)

print("Recursively splitting chunks exceeding 1000 characters...")
text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=150)
splits = text_splitter.split_documents(md_header_splits)

# 3. Create the Embedding Model
print("Loading semantic model...")
model = SentenceTransformer('all-MiniLM-L6-v2') 

# 4. Connect to Postgres and Insert
try:
    conn = psycopg2.connect(
        dbname=DB_NAME, 
        user=DB_USER, 
        password=DB_PASS, 
        host=DB_HOST
    )
    cur = conn.cursor()
    print("Connected to database.")
except Exception as e:
    print(f"Error connecting to database: {e}")
    exit(1)

print(f"Inserting {len(splits)} structured chunks into db...")
for split in splits:
    text = split.page_content
    metadata = split.metadata
    
    chapter_title = metadata.get("chapter_title", None)
    section_title = metadata.get("section_title", None)
    
    # Generate the vector
    vector = model.encode(text).tolist()
    
    # Save to pgvector table
    cur.execute(
        "INSERT INTO book_vectors (content, embedding, chapter_title, section_title) VALUES (%s, %s, %s, %s)",
        (text, vector, chapter_title, section_title)
    )

conn.commit()
cur.close()
conn.close()
print("Success! Data structured and inserted.")