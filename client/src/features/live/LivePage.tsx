import { useParams } from 'react-router-dom';
import { LiveScreen } from './LiveScreen';

export default function LivePage() {
  const { id } = useParams<{ id: string }>();
  return <LiveScreen auctionId={id!} />;
}
