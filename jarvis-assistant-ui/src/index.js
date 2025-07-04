import React from 'react';
import ReactDOM from 'react-dom/client'; // ✅ use correct import
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/c/:chat_id" element={<App />} />
      <Route path="*" element={<App />} /> {/* fallback to App */}
    </Routes>
  </BrowserRouter>
);
