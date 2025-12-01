import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import Home from '@/pages/Home';
import TransactionsPage from '@/pages/Transactions';
import Stats from '@/pages/Stats';
import Settings from '@/pages/Settings';
import { Toaster } from 'sonner';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/incomes" element={<TransactionsPage type="income" />} />
          <Route path="/expenses" element={<TransactionsPage type="expense" />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
      <Toaster position="top-center" />
    </Router>
  );
}

export default App;
