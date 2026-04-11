import React, { useState } from 'react';
import StudentPane from '../components/StudentPane';
import BookPane from '../components/BookPane';
import AIAssistant from '../components/AIAssistant';
import { bookData } from '../data/bookData';
import { markChapterCompleted } from '../utils/progress';
import './MainApp.css';

const MainApp = () => {
  const firstBookId = Object.keys(bookData.books)[0];
  const [activeBookId, setActiveBookId] = useState(firstBookId);
  const [activeChapterId, setActiveChapterId] = useState(
    bookData.books[firstBookId]?.toc?.[0]?.id || null
  );
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);

  const handleSelectBook = (bookId) => {
    setActiveBookId(bookId);
    const book = bookData.books[bookId];
    if (book?.toc?.length > 0) {
      setActiveChapterId(book.toc[0].id);
    } else {
      setActiveChapterId(null);
    }
  };

  const handleSelectChapter = (chapterId) => {
    setActiveChapterId(chapterId);
    if (activeBookId) markChapterCompleted(activeBookId, chapterId);
  };

  const activeBookData = activeBookId ? bookData.books[activeBookId] : null;

  return (
    <div className="main-app-container">
      <div className="main-layout">

        {/* Left sidebar with collapse toggle */}
        <div className={`sidebar-wrapper left-sidebar-wrapper ${isLeftCollapsed ? 'collapsed' : ''}`}>
          <div className="sidebar-inner">
            <StudentPane
              subjectsData={bookData.subjects}
              activeBookId={activeBookId}
              onSelectBook={handleSelectBook}
            />
          </div>
          <button
            className="sidebar-toggle-btn left-toggle-btn"
            onClick={() => setIsLeftCollapsed(!isLeftCollapsed)}
            title={isLeftCollapsed ? 'Expand' : 'Collapse'}
          >
            {isLeftCollapsed ? '›' : '‹'}
          </button>
        </div>

        {/* Center pane */}
        <div className="center-wrapper">
          <div className="glass-pane center-pane">
            <BookPane
              book={activeBookData}
              activeChapterId={activeChapterId}
              onSelectChapter={handleSelectChapter}
            />
          </div>
        </div>

        {/* Right sidebar with collapse toggle */}
        <div className={`sidebar-wrapper right-sidebar-wrapper ${isRightCollapsed ? 'collapsed' : ''}`}>
          <button
            className="sidebar-toggle-btn right-toggle-btn"
            onClick={() => setIsRightCollapsed(!isRightCollapsed)}
            title={isRightCollapsed ? 'Expand' : 'Collapse'}
          >
            {isRightCollapsed ? '‹' : '›'}
          </button>
          <div className="sidebar-inner">
            <AIAssistant />
          </div>
        </div>

      </div>
    </div>
  );
};

export default MainApp;
