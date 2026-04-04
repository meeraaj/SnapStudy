import React, { useState } from 'react';
import './BookPane.css';

const BookPane = ({ book, activeChapterId, onSelectChapter }) => {
  // Track which accordion dropdowns are open
  const [expandedNodes, setExpandedNodes] = useState({});

  if (!book) {
    return (
      <div className="book-pane animate-fade-in">
        <div className="book-pane-header">
          <h3 className="book-title">No Book Selected</h3>
        </div>
      </div>
    );
  }

  const toggleExpand = (id, e) => {
    e.stopPropagation();
    setExpandedNodes(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleSelect = (id) => {
    // Expand automatically when selected if it has children
    setExpandedNodes(prev => ({
      ...prev,
      [id]: true
    }));
    onSelectChapter(id);
  };

  // Find active flat title
  let activeTitle = 'Chapter';
  if (book.toc) {
    for (const ch of book.toc) {
      if (ch.id === activeChapterId) {
        activeTitle = ch.title;
        break;
      }
      if (ch.subtopics) {
        const sub = ch.subtopics.find(s => s.id === activeChapterId);
        if (sub) {
          activeTitle = sub.title;
          break;
        }
      }
    }
  }

  const contentHTML = book.content && activeChapterId && book.content[activeChapterId] 
    ? book.content[activeChapterId] 
    : "<div class='skeleton-body'><p>Content not loaded...</p></div>";

  return (
    <div className="book-pane animate-fade-in" style={{ animationDelay: '0.1s' }}>
      <div className="book-pane-header">
        <h3 className="book-title">{book.title}</h3>
      </div>
      
      <div className="book-layout">
        <div className="toc-sidebar">
          <div className="toc-header">Table of Contents</div>
          <div className="toc-content toc-list">
            
            {/* Map Top-level Chapters */}
            {book.toc && book.toc.map(chapter => {
              const hasSubtopics = chapter.subtopics && chapter.subtopics.length > 0;
              const isExpanded = expandedNodes[chapter.id];
              const isActive = activeChapterId === chapter.id;

              return (
                <div key={chapter.id} className="toc-node-wrapper">
                  
                  {/* Chapter Header Link */}
                  <div 
                    className={`toc-item ${isActive ? 'active' : ''}`}
                    onClick={() => handleSelect(chapter.id)}
                  >
                    <div className="toc-item-title">{chapter.title}</div>
                    
                    {hasSubtopics && (
                      <div 
                        className={`accordion-chevron ${isExpanded ? 'open' : ''}`}
                        onClick={(e) => toggleExpand(chapter.id, e)}
                      >
                        ▼
                      </div>
                    )}
                  </div>

                  {/* Subtopics Dropdown */}
                  {hasSubtopics && isExpanded && (
                    <div className="toc-subtopics animate-pull-down">
                      {chapter.subtopics.map(sub => (
                         <div 
                           key={sub.id} 
                           className={`toc-sub-item ${activeChapterId === sub.id ? 'active-sub' : ''}`}
                           onClick={() => handleSelect(sub.id)}
                         >
                           - {sub.title}
                         </div>
                      ))}
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </div>
        
        <div className="chapter-content">
          <div className="chapter-marker">
            &lt;{activeTitle}&gt;
          </div>
          
          <div 
            className="chapter-body textual-content"
            dangerouslySetInnerHTML={{ __html: contentHTML }}
          />
        </div>
      </div>
    </div>
  );
};

export default BookPane;
