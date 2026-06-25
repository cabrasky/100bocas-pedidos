import { Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import OrderApp from './OrderApp';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/app" element={<OrderApp />} />
      <Route path="/app/*" element={<OrderApp />} />
    </Routes>
  );
}

export default App;
