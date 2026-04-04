// LocalStorage helpers for tracking reading progress across components

const PROGRESS_KEY = 'snaprag_user_progress';

export const getCompletedChapters = (bookId) => {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return data[bookId] || [];
  } catch (err) {
    console.error("Failed to read progress", err);
    return [];
  }
};

export const markChapterCompleted = (bookId, chapterId) => {
  if (!bookId || !chapterId) return;
  
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    let data = raw ? JSON.parse(raw) : {};
    
    if (!data[bookId]) {
      data[bookId] = [];
    }
    
    // Push uniquely
    if (!data[bookId].includes(chapterId)) {
      data[bookId].push(chapterId);
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(data));
    }
  } catch (err) {
    console.error("Failed to save progress", err);
  }
};

export const getProgressMetrics = (bookId, bookTOC) => {
  if (!bookTOC || bookTOC.length === 0) return { completed: 0, total: 0, percent: 0 };
  
  const completedIds = getCompletedChapters(bookId);
  const total = bookTOC.length;
  // We strictly count those that exist in the active TOC length
  const validCompleted = completedIds.filter(id => bookTOC.some(ch => ch.id === id)).length;
  
  const percent = Math.round((validCompleted / total) * 100);
  
  return {
    completed: validCompleted,
    total,
    percent
  };
};
