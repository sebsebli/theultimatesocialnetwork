/**
 * One-off: generate a system invite code (no admin key).
 * Usage: npx ts-node src/scripts/generate-invite-code.ts [email]
 * If email is provided, only prints the code (caller can send manually or use admin send-to-email with correct key).
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { InvitesService } from '../invites/invites.service';

async function main() {
  const email = process.argv[2] || '';
  const app = await NestFactory.createApplicationContext(AppModule);
  const invites = app.get(InvitesService);
  const code = await invites.generateCode(undefined);
  await app.close();
  console.log('Invite code:', code);
  if (email) console.log('For email:', email);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
