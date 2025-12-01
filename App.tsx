import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { LandingPage } from './pages/LandingPage';
import { RequestAidPage } from './pages/RequestAidPage';
import { UpdateStatusPage } from './pages/UpdateStatusPage';
import { DonorDashboardPage } from './pages/DonorDashboardPage';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/request" element={<RequestAidPage />} />
              <Route path="/status" element={<UpdateStatusPage />} />
              <Route path="/donate" element={<DonorDashboardPage />} />
            </Routes>
          </Layout>
        </Router>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;