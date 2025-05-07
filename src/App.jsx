import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Aqi from './pages/Aqi';
import Navigation from './pages/Navigation';
import DashboardLayout from './layouts/DashboardLayout';
import Heatmap from './pages/Heatmap';
import Comparison from './pages/Comparison';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="aqi" element={<Aqi />} />
          <Route path="navigation" element={<Navigation />} />
          <Route path="heatmap" element={<Heatmap />} />
          <Route path="compare" element={<Comparison />} />
        </Route>
        <Route path="/" element={
          <div>
            <Navbar />
            <Hero />
            <FAQ />
            <Footer />
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;
