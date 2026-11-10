
import { signToken } from '../src/auth/jwt';
import { getUser, mockUsers } from '../src/auth/mockUsers';

const userId = process.argv[2];
const user = userId ? getUser(userId) : null;

if (!user) {
  console.log('Usage: npm run token -- <userId>');
  console.log(`Users: ${mockUsers.map((u) => u.id).join(', ')}`);
  process.exit(1);
}

console.log(signToken(user.id));