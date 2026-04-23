import './App.css';
import { Toaster } from 'sonner';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import Demo from './components/Demo';
import Features from './components/Features';
import Pricing from './components/Pricing';
import CTASection from './components/CTASection';
import Footer from './components/Footer';
import Dashboard from './components/Dashboard';
import PaymentSuccess from './components/PaymentSuccess';

function LandingPage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <Demo />
      <Features />
      <Pricing />
      <CTASection />
      <Footer />
    </>
  );
}

function App() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <BrowserRouter>
        <AuthProvider>
          <Toaster position="bottom-right" richColors />
          <Header />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/payment/success" element={<PaymentSuccess />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
