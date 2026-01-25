# Authentication Architecture

## Current Implementation: Custom Magic Link (NOT Supabase)

The system uses a **custom magic link implementation**, not Supabase's built-in authentication.

## How It Works

### 1. Magic Link Flow

```
User enters email
    ↓
AuthService.sendMagicLink()
    ↓
- Generate UUID token
- Store in Redis (15 min expiry)
- Send email via Brevo SMTP (custom EmailService)
    ↓
User clicks link in email
    ↓
AuthService.verifyMagicLink()
    ↓
- Validate token from Redis
- Create/find user in PostgreSQL
- Generate JWT using @nestjs/jwt
    ↓
User authenticated
```

### 2. Components

- **Token Storage**: Redis (not Supabase)
- **Email Sending**: Brevo SMTP via custom `EmailService` (not Supabase)
- **User Storage**: PostgreSQL (not Supabase Auth)
- **JWT Generation**: `@nestjs/jwt` (not Supabase)
- **Token Validation**: Custom Redis lookup (not Supabase)

### 3. Why the Confusion?

The code has some Supabase-related references that might be confusing:

1. **`SUPABASE_JWT_SECRET` env var**: 
   - Just used as a fallback for `JWT_SECRET`
   - No actual Supabase integration
   - JWT format is compatible with Supabase's format (using `sub` for user ID)

2. **JWT Strategy comment**: 
   ```typescript
   // Supabase JWT payload: { sub: 'uuid', email: '...', ... }
   ```
   - This is just a comment explaining the JWT format
   - The format is compatible, but it's not using Supabase

3. **PostgreSQL database**:
   - Uses Supabase's PostgreSQL image (`supabase/postgres:15.1.1.2`)
   - But this is just the database, not Supabase Auth

## Current Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Token Storage** | Redis | Store magic link tokens |
| **Email Service** | Brevo SMTP | Send magic link emails |
| **User Database** | PostgreSQL | Store user accounts |
| **JWT Library** | `@nestjs/jwt` | Generate authentication tokens |
| **Auth Service** | Custom NestJS service | Handle authentication logic |

## If You Want to Use Supabase Auth

If you want to switch to Supabase's built-in authentication, you would need to:

1. **Install Supabase SDK**:
   ```bash
   pnpm add @supabase/supabase-js
   ```

2. **Replace AuthService**:
   - Use `supabase.auth.signInWithOtp()` instead of custom magic link
   - Use `supabase.auth.verifyOtp()` instead of custom token validation
   - Let Supabase handle email sending (or configure custom SMTP in Supabase dashboard)

3. **Update JWT Strategy**:
   - Use Supabase's JWT verification
   - Or use Supabase's session management

4. **Benefits of Supabase Auth**:
   - Built-in email sending (or use your SMTP)
   - Built-in rate limiting
   - Built-in security features
   - Less code to maintain
   - Built-in user management UI

5. **Trade-offs**:
   - Less control over the flow
   - Need to configure Supabase project
   - Custom invite code logic would need to be adapted

## Current Custom Implementation Benefits

- ✅ Full control over authentication flow
- ✅ Custom invite code system integrated
- ✅ No external auth service dependency
- ✅ Can customize email templates
- ✅ Works with your existing Brevo SMTP setup

## Summary

**You are NOT using Supabase authentication.** You're using:
- Custom magic link implementation
- Brevo SMTP for emails
- Redis for token storage
- PostgreSQL for user storage
- NestJS JWT for token generation

The Supabase references in the code are just:
- JWT format compatibility (using `sub` field)
- Environment variable naming
- Comments explaining the format

If you want to use Supabase Auth, it would require significant refactoring of the authentication system.
