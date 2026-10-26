import { AuctionPage } from './features/auction/AuctionPage';
import { LiveScreen } from './features/live/LiveScreen';

function App() {
  const live = window.location.pathname.match(/^\/auctions\/([^/]+)\/live\/?$/);
  if (live) return <LiveScreen auctionId={live[1]} />;
  return <AuctionPage />;
}

export default App;
