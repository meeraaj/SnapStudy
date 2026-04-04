import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookData } from '../data/bookData';
import { getCompletedChapters, getProgressMetrics } from '../utils/progress';
import './SemesterView.css';

const SemesterView = () => {
  const navigate = useNavigate();
  // We use the book ID as the core active subject to make progression tracking simple
  const initialDataNode = bookData.books ? Object.keys(bookData.books)[0] : '';
  const [selectedBookId, setSelectedBookId] = useState(initialDataNode);
  const [metrics, setMetrics] = useState({ completed: 0, total: 0, percent: 0 });
  const [completedList, setCompletedList] = useState([]);

  // Flatten the TOC for progress math to include both Chapters and Subtopics as tracking nodes
  const getFlatTrackingNodes = (bookId) => {
      const book = bookData.books[bookId];
      if (!book || !book.toc) return [];
      
      let nodes = [];
      book.toc.forEach(ch => {
          nodes.push(ch);
          if (ch.subtopics) {
             ch.subtopics.forEach(sub => nodes.push(sub));
          }
      });
      return nodes;
  };

  useEffect(() => {
    if (selectedBookId && bookData.books[selectedBookId]) {
      const allNodes = getFlatTrackingNodes(selectedBookId);
      const m = getProgressMetrics(selectedBookId, allNodes);
      const list = getCompletedChapters(selectedBookId);
      setMetrics(m);
      setCompletedList(list);
    }
  }, [selectedBookId]);

  const handleNavigateToStudy = () => {
    navigate('/app');
  };

  const activeNodes = getFlatTrackingNodes(selectedBookId);

  return (
    <div className="semester-container">
      
      <div className="semester-boundary glass-pane animate-fade-in">
        <h2 className="semester-badge">Semester View</h2>

        <div className="semester-content">
          
          {/* Left Pane: Subjects List */}
          <div className="subject-sidebar">
            <h3 className="subject-header">Subject</h3>
            <ul className="subject-ul">
              {bookData.subjects.map(subject => (
                <li key={subject.id}>
                  {subject.courses.map(course => (
                    course.books.map(book => (
                      <div 
                        key={book.id} 
                        className={`subject-item ${selectedBookId === book.id ? 'active' : ''}`}
                        onClick={() => setSelectedBookId(book.id)}
                      >
                       {book.title.substring(0,35)}
                      </div>
                    ))
                  ))}
                </li>
              ))}
            </ul>
          </div>

          {/* Right Pane: Progress & Actions */}
          <div className="content-pane">
            
            {/* Highly Aesthetic Progress Segment Track */}
            <div className="modern-progress-container">
              <div className="progress-header-metrics">
                 <span className="progress-label">Course Mastery</span>
                 <span className="progress-percent">{metrics.percent}%</span>
              </div>
              
              <div className="dashed-track-wrapper">
                  {/* We map continuous glowing lines rather than numbers */}
                  {activeNodes.map((node, index) => {
                     const isCompleted = completedList.includes(node.id);
                     return (
                        <div 
                           key={node.id}
                           className={`track-segment ${isCompleted ? 'segment-filled' : 'segment-empty'}`}
                           onClick={handleNavigateToStudy}
                           title={node.title}
                        ></div>
                     );
                  })}
              </div>
            </div>

            {/* Stage area */}
            <div className="dashboard-main-area">
               <div className="dashboard-stat-card">
                  <div className="stat-value">{metrics.completed} / {metrics.total}</div>
                  <div className="stat-label">Modules Completed</div>
               </div>
            </div>

            {/* Bottom Right Corner CTA */}
            <div className="dashboard-footer">
              <button 
                className="self-assess-btn"
                onClick={handleNavigateToStudy}
              >
                Self Assess
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default SemesterView;
