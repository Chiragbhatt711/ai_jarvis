import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import App from './App';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/c/:chat_id" element={<App />} />
      </Routes>
    </Router>
  );
}
