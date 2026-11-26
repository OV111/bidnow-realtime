import { createBrowserRouter, redirect } from 'react-router-dom';

import AppLayout from '@/components/AppLayout';
import NotFound from '@/components/NotFound';
import CreateAuctionPage from '@/features/auctions/create/CreateAuctionPage';
import AuctionsListPage from '@/features/auctions/list/AuctionsListPage';
import LivePage from '@/features/auctions/live/LivePage';
import AuctionPage from '@/features/auctions/room/AuctionPage';

export const router = createBrowserRouter([
  { path: '/auctions/:id/live', element: <LivePage /> },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, loader: () => redirect('/auctions') },
      { path: 'auctions', element: <AuctionsListPage /> },
      { path: 'auctions/new', element: <CreateAuctionPage /> },
      { path: 'auctions/:id', element: <AuctionPage /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
