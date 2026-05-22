import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { FamilyFundProvider } from './context/FamilyFundContext';
import Layout from './components/Layout';

// Pages
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Transfers from './pages/Transfers';
import Allowances from './pages/Allowances';
import Tasks from './pages/Tasks';

function App() {
  return (
    <FamilyFundProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="members" element={<Members />} />
            <Route path="transfers" element={<Transfers />} />
            <Route path="allowances" element={<Allowances />} />
            <Route path="tasks" element={<Tasks />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </FamilyFundProvider>
  );
}

export default App;
