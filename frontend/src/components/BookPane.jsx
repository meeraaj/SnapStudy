import React, { useState } from 'react';
import PDFViewer from './PDFViewer';
import './BookPane.css';

const PDF_URL = '/llm-datasette-io-en-latest.pdf';

const BookPane = ({ book, activeChapterId, onSelectChapter }) => {
  const [expandedNodes, setExpandedNodes] = useState({});

  if (!book) {
    return (
      <div className="book-pane animate-fade-in">
        <div className="book-pane-empty">
          <div className="empty-icon">📚</div>
          <p>Select a book to begin reading.</p>
        </div>
      </div>
    );
  }

  const toggleExpand = (id, e) => {
    e.stopPropagation();
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSelect = (id) => {
    setExpandedNodes(prev => ({ ...prev, [id]: true }));
    onSelectChapter(id);
  };

  let targetPage = 1;
  if (activeChapterId && book.toc) {
    for (const ch of book.toc) {
      if (ch.id === activeChapterId) { targetPage = ch.page_num || 1; break; }
      if (ch.subtopics) {
        const sub = ch.subtopics.find(s => s.id === activeChapterId);
        if (sub) { targetPage = sub.page_num || 1; break; }
      }
    }
  }

  return (
    <div className="book-pane animate-fade-in">
      <div className="book-pane-header">
        <h3 className="book-title">{book.title}</h3>
      </div>
      <div className="book-layout">

        <div className="toc-sidebar">
          <div className="toc-header">Table of Contents</div>
          <div className="toc-list">
            {book.toc && book.toc.map(chapter => {
              const hasSubtopics = chapter.subtopics && chapter.subtopics.length > 0;
              const isExpanded = expandedNodes[chapter.id];
              const isActive = activeChapterId === chapter.id;
              return (
                <div key={chapter.id} className="toc-node-wrapper">
                  <div
                    className={`toc-item ${isActive ? 'active' : ''}`}
                    onClick={() => handleSelect(chapter.id)}
                  >
                    <span className="toc-item-title">{chapter.title}</span>
                    {hasSubtopics && (
                      <span
                        className={`accordion-chevron ${isExpanded ? 'open' : ''}`}
                        onClick={(e) => toggleExpand(chapter.id, e)}
                      >▼</span>
                    )}
                  </div>
                  {hasSubtopics && isExpanded && (
                    <div className="toc-subtopics animate-pull-down">
                      {chapter.subtopics.map(sub => (
                        <div
                          key={sub.id}
                          className={`toc-sub-item ${activeChapterId === sub.id ? 'active-sub' : ''}`}
                          onClick={() => handleSelect(sub.id)}
                        >
                          {sub.title}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="chapter-content" style={{padding: 0, overflow: 'hidden'}}>
          <PDFViewer pdfUrl={PDF_URL} targetPage={targetPage} />
        </div>

      </div>
    </div>
  );
};

export default BookPane;
