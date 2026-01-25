import * as jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env manually
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const secret = process.env.JWT_SECRET;
if (!secret) {
  console.error('No JWT_SECRET found');
  process.exit(1);
}

const payload = {
  sub: '550e8400-e29b-41d4-a716-446655440000',
  email: 'dev@cite.local',
  role: 'authenticated',
};

const token = jwt.sign(payload, secret, { expiresIn: '1h' });
console.log(token);
