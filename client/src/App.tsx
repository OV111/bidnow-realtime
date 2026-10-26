import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import AuctionPage from './pages/AuctionPage';
import AuctionsListPage from './pages/AuctionsListPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/auctions" replace />} />
          <Route path="auctions" element={<AuctionsListPage />} />
          <Route path="auctions/:id" element={<AuctionPage />} />
          <Route path="*" element={<Navigate to="/auctions" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
