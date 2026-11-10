import { createBrowserRouter, redirect } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import AuctionPage from './features/auction/AuctionPage';
import AuctionsListPage from './features/auction/AuctionsListPage';
import CreateAuctionPage from './features/createAuction/CreateAuctionPage';
import LivePage from './features/live/LivePage';

const toAuctions = () => redirect('/auctions');

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, loader: toAuctions },
      { path: 'auctions', element: <AuctionsListPage /> },
      { path: 'auctions/new', element: <CreateAuctionPage /> },
      { path: 'auctions/:id', element: <AuctionPage /> },
      { path: 'auctions/:id/live', element: <LivePage /> },
      { path: '*', loader: toAuctions },
    ],
  },
]);
