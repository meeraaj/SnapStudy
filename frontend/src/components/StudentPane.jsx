import React from 'react';
import './StudentPane.css';

const StudentPane = ({ subjectsData, activeBookId, onSelectBook }) => {
  return (
    <div className="glass-pane student-pane animate-fade-in">
      <div className="pane-header">
        <h3 className="pane-title">Student Pane</h3>
      </div>
      
      <div className="pane-content">
        {subjectsData.map(subject => (
          <div className="course-section" key={subject.id}>
            <div className="course-title">{subject.name}:</div>
            <ul className="subject-list">
              {subject.courses.map(course => (
                <li key={course.id} className="subject-item">
                  <span className="bullet"></span>
                  {course.name}
                  
                  {course.books && course.books.length > 0 && (
                    <ul className="sub-list">
                      {course.books.map(book => (
                        <li 
                          key={book.id}
                          className={activeBookId === book.id ? 'active-book' : ''}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectBook(book.id);
                          }}
                          style={{
                            cursor: 'pointer',
                            color: activeBookId === book.id ? 'var(--accent-primary)' : 'var(--text-muted)'
                          }}
                        >
                          - {book.type}: {book.title.substring(0, 20)}...
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      
      <div className="pane-footer">
        <div className="search-box">
          <label className="search-label">Ask AI:</label>
          <div className="search-input-wrapper">
            <input type="text" placeholder="search" className="search-input" />
            <div className="search-icon">🔍</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentPane;
