import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SemesterView from './pages/SemesterView';
import MainApp from './pages/MainApp';
import ThemeToggle from './components/ThemeToggle';
import './index.css';

function App() {
  return (
    <Router>
      <ThemeToggle />
      <Routes>
        <Route path="/" element={<SemesterView />} />
        <Route path="/app" element={<MainApp />} />
      </Routes>
    </Router>
  );
}

export default App;
