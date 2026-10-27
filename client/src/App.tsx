import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import AuctionPage from './pages/AuctionPage';
import AuctionsListPage from './pages/AuctionsListPage';
import { LiveScreen } from './features/live/LiveScreen';

function LiveRoute() {
  const { id } = useParams<{ id: string }>();
  return <LiveScreen auctionId={id!} />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/auctions" replace />} />
          <Route path="auctions" element={<AuctionsListPage />} />
          <Route path="auctions/:id" element={<AuctionPage />} />
          <Route path="auctions/:id/live" element={<LiveRoute />} />
          <Route path="*" element={<Navigate to="/auctions" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
