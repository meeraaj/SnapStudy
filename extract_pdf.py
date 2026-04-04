import sys
import json
import PyPDF2
import os

pdf_path = "llm-datasette-io-en-latest.pdf"
output_path = "frontend/src/data/bookData.js"

if not os.path.exists(pdf_path):
    print(f"Error: Could not find {pdf_path}")
    sys.exit(1)

def build_fallback_toc(reader):
    toc = []
    content = {}
    total_pages = len(reader.pages)
    chunk_size = 5
    
    for i in range(0, total_pages, chunk_size):
        end_page = min(i + chunk_size, total_pages)
        title = f"Pages {i+1} to {end_page}"
        ch_id = f"pg_{i+1}"
        
        toc.append({"id": ch_id, "title": title, "subtopics": []})
        
        text_chunk = []
        for p in range(i, end_page):
            text_chunk.append(reader.pages[p].extract_text() or "")
            
        html_content = f"<h1>{title}</h1>"
        for block in "\n".join(text_chunk).split("\n\n"):
            if block.strip():
                html_content += f"<p>{block.strip()}</p>"
                
        content[ch_id] = html_content
        
    return toc, content

def resolve_nested_destinations(reader):
    outline = reader.outline
    toc = []
    content = {}
    
    if not outline:
        return build_fallback_toc(reader)
    
    # We will collect everything into a structured tree of chapters -> subtopics
    structured_outline = []
    
    for node in outline:
        if isinstance(node, list):
            # If the node is a list, it belongs to the previous parent
            if not structured_outline:
                continue
            parent = structured_outline[-1]
            parent["subtopics"] = []
            
            for child in node:
                # We only go 1 depth deep effectively
                if isinstance(child, list):
                     continue # Ignore deep hierarchies
                try:
                    title = child.title
                    page_num = reader.get_destination_page_number(child)
                    parent["subtopics"].append({"title": title, "page_num": page_num})
                except:
                    pass
        else:
            try:
                title = node.title
                page_num = reader.get_destination_page_number(node)
                structured_outline.append({"title": title, "page_num": page_num, "subtopics": []})
            except:
                pass
                
    if not structured_outline:
         return build_fallback_toc(reader)
         
    # Generate ID combinations and extract text
    global_page_map = [] # Track all page destinations to know when to stop text extraction
    
    for ch in structured_outline:
        global_page_map.append(ch["page_num"])
        for sub in ch["subtopics"]:
            global_page_map.append(sub["page_num"])
            
    global_page_map = sorted(list(set(global_page_map)))
    
    def get_end_page(start_page):
        # find the next bookmark page to slice until
        for pg in global_page_map:
            if pg > start_page:
                return min(pg, start_page + 3) # Strict limit to stop UI locking
        return min(len(reader.pages), start_page + 3)

    def extract_html(title, start_page):
        end_page = get_end_page(start_page)
        end_page = max(start_page + 1, end_page)
        
        text_chunk = []
        for p in range(start_page, end_page):
            if p < len(reader.pages):
                text_chunk.append(reader.pages[p].extract_text() or "")
                
        html_content = f"<h1>{title}</h1>"
        blocks = "\n".join(text_chunk).split("\n\n")
        # Keep only up to 10 paragraphs max to avoid massive DOM
        for block in blocks[:10]:
            if block.strip():
                html_content += f"<p>{block.strip()}</p>"
        return html_content

    # Now construct the TOC format
    for i, item in enumerate(structured_outline):
        ch_id = f"ch_{i}"
        
        chapter_node = {
            "id": ch_id,
            "title": item["title"],
            "subtopics": []
        }
        
        content[ch_id] = extract_html(item["title"], item["page_num"])
        
        for j, sub in enumerate(item["subtopics"]):
            sub_id = f"{ch_id}_sub_{j}"
            chapter_node["subtopics"].append({
                "id": sub_id,
                "title": sub["title"]
            })
            content[sub_id] = extract_html(sub["title"], sub["page_num"])
            
        toc.append(chapter_node)
        
    return toc, content

with open(pdf_path, "rb") as f:
    reader = PyPDF2.PdfReader(f)
    print(f"Opened {pdf_path}: {len(reader.pages)} pages detected.")
    
    toc, content = resolve_nested_destinations(reader)

    book_data_template = {
      "subjects": [
        {
          "id": "datasette-tools",
          "name": "Datasette ecosystem",
          "courses": [
            {
              "id": "llm-dev",
              "name": "LLM Developer Toolkit",
              "books": [
                { "id": "llm-docs", "title": "LLM: Datasette IO Documentation", "type": "Documentation" }
              ]
            }
          ]
        }
      ],
      "books": {
        "llm-docs": {
          "id": "llm-docs",
          "title": "LLM: Datasette IO Documentation",
          "toc": toc,
          "content": content
        }
      }
    }

    # Generate javascript export
    js_output = f"export const bookData = {json.dumps(book_data_template, indent=2)};"
    
    with open(output_path, "w", encoding="utf-8") as out_f:
        out_f.write(js_output)
        
    print(f"Successfully wrote hierarchical JSON mapping to {output_path}")
