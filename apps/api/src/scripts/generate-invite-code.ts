/**
 * One-off: generate a system invite code (no admin key).
 * Usage: npx ts-node src/scripts/generate-invite-code.ts [email]
 * If email is provided, creates the code and sends it to that address (and prints the code).
 * If no email, only generates and prints the code.
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { InvitesService } from '../invites/invites.service';

async function main() {
  const email = (process.argv[2] || '').trim();
  const app = await NestFactory.createApplicationContext(AppModule);
  const invites = app.get(InvitesService);

  if (email) {
    const { code, sent } = await invites.createCodeAndSendToEmail(email, 'en');
    await app.close();
    console.log('Invite code:', code);
    console.log('Email:', email);
    console.log('Email sent:', sent);
  } else {
    const code = await invites.generateCode(undefined);
    await app.close();
    console.log('Invite code:', code);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
