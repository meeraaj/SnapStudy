import os
import psycopg2
import ollama
from sentence_transformers import SentenceTransformer

# Configuration
DB_NAME = os.getenv("DB_NAME", "your_db")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASS = os.getenv("DB_PASS", "pass")
DB_HOST = os.getenv("DB_HOST", "localhost")
MODEL_NAME = "llama3.2"

print("Loading embedding model...")
embed_model = SentenceTransformer('all-MiniLM-L6-v2')
print("Model loaded. Ready to answer questions!")
print("-" * 50)

def search_database(query, top_k=3):
    """Embed the user's query and search postgres using pgvector's cosine distance."""
    # 1. Generate embedding for query
    query_vector = embed_model.encode(query).tolist()
    
    # 2. Connect to postgres
    try:
        conn = psycopg2.connect(
            dbname=DB_NAME, 
            user=DB_USER, 
            password=DB_PASS, 
            host=DB_HOST
        )
        cur = conn.cursor()
    except Exception as e:
        print(f"Error connecting to database: {e}")
        return []
    
    # 3. Retrieve relevant chunks using cosine distance (<=>)
    # The lowest distance comes first1
    sql = """
        SELECT content 
        FROM book_vectors 
        ORDER BY embedding <=> %s::vector 
        LIMIT %s
    """
    cur.execute(sql, (query_vector, top_k))
    rows = cur.fetchall()
    
    cur.close()
    conn.close()
    
    return [row[0] for row in rows]

def ask_llama(question, contexts):
    """Format the prompt and stream the response from local Ollama."""
    
    # Combine the context documents into one string
    context_text = "\n\n---\n\n".join(contexts)
    
    # Basic RAG prompt template
    prompt = f"""You are a helpful assistant. Provide a detailed answer to the user's question based strictly on the Context below. 
If the answer cannot be found in the Context, just say you don't know based on the provided documents.

Context: 
{context_text}

Question:
{question}
"""

    print("\n[Thinking...]")
    # Stream the response back to the CLI
    response = ollama.chat(
        model=MODEL_NAME,
        messages=[{'role': 'user', 'content': prompt}],
        stream=True
    )
    
    for chunk in response:
        print(chunk['message']['content'], end='', flush=True)
    print("\n")

def main():
    while True:
        # CLI interactive loop
        try:
            user_input = input("\nAsk a question (or type 'quit' to exit): ").strip()
            if not user_input:
                continue
            if user_input.lower() in ['quit', 'exit']:
                break
            
            # Retrieve
            context_chunks = search_database(user_input)
            
            if not context_chunks:
                print("No context found in database!")
                continue
                
            # Generate and stream
            ask_llama(user_input, context_chunks)
            print("-" * 50)
            
        except KeyboardInterrupt:
            break
            
    print("\nGoodbye!")

if __name__ == "__main__":
    main()
