import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Main from './layout/Main';
import Manual from './pages/Manual';
import Calendar from './pages/Calendar';
import OcrUpload from './pages/OcrUpload';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/manual" element={<Manual />} />
        <Route path="/calendar" element={<Calendar/>} />
        <Route path="/ocr" element={<OcrUpload/>} />
      </Routes>
    </Router>
  );
}

export default App;