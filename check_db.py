import psycopg2

conn = psycopg2.connect(
    dbname="your_db", 
    user="postgres", 
    password="pass", 
    host="localhost"
)
cur = conn.cursor()

# Fetch the first 2 rows
cur.execute("SELECT id, content, embedding FROM book_vectors LIMIT 2;")
rows = cur.fetchall()

for row in rows:
    row_id, content, embedding = row
    
    # The pgvector extension returns the embedding as a string or list
    # Let's count the dimensions to verify it works
    vector_list = eval(embedding) if isinstance(embedding, str) else embedding
    
    print(f"\n--- ID: {row_id} ---")
    print(f"Content Snippet: {content[:100]}...")
    print(f"Vector Dimensions: {len(vector_list)}")
    print(f"First 3 values: {vector_list[:3]}")

cur.close()
conn.close()
