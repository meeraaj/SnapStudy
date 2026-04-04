import React, { useState, useEffect } from 'react';
import StudentPane from '../components/StudentPane';
import BookPane from '../components/BookPane';
import AIAssistant from '../components/AIAssistant';
import { bookData } from '../data/bookData';
import { markChapterCompleted } from '../utils/progress';
import './MainApp.css';

const MainApp = () => {
  const [activeBookId, setActiveBookId] = useState('llm-docs');
  const [activeChapterId, setActiveChapterId] = useState('ch_0');

  const handleSelectBook = (bookId) => {
    setActiveBookId(bookId);
    
    // Auto-select first chapter of the new book
    const book = bookData.books[bookId];
    if (book && book.toc && book.toc.length > 0) {
      setActiveChapterId(book.toc[0].id);
      markChapterCompleted(bookId, book.toc[0].id);
    } else {
      setActiveChapterId(null);
    }
  };

  const handleSelectChapter = (chapterId) => {
    setActiveChapterId(chapterId);
    // Mark as complete whenever a user views it!
    if (activeBookId) {
      markChapterCompleted(activeBookId, chapterId);
    }
  };

  // Run on initial mount
  useEffect(() => {
    if (activeBookId && activeChapterId) {
       markChapterCompleted(activeBookId, activeChapterId);
    }
  }, [activeBookId, activeChapterId]);

  const activeBookData = activeBookId ? bookData.books[activeBookId] : null;

  return (
    <div className="main-app-container">
      <div className="main-layout">
        <StudentPane 
          subjectsData={bookData.subjects}
          activeBookId={activeBookId}
          onSelectBook={handleSelectBook}
        />
        
        <div className="center-wrapper">
          <div className="glass-pane center-pane">
            <div className="center-header">
              <h2>Main Pane</h2>
            </div>
            <BookPane 
              book={activeBookData}
              activeChapterId={activeChapterId}
              onSelectChapter={handleSelectChapter}
            />
          </div>
        </div>

        <AIAssistant />
      </div>
    </div>
  );
};

export default MainApp;
