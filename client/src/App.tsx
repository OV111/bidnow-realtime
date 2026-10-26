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
          <Route index element={<Navigate t
          <Route path="auctions" element={<AuctionsListPage />} />
          <Route path="auctions/:id" elemen
          <Route path="auctions/:id/live" element={<LiveRoute />} />
          <Route path="*" element={<Navigat/>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;