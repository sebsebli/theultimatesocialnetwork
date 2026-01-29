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

### 3. JWT and Database

- **JWT**: Signed with `JWT_SECRET`; payload uses `sub` (user ID) and `email`.
- **PostgreSQL**: Plain Postgres (`postgres:15-alpine` in Docker); no Supabase.

## Current Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Token Storage** | Redis | Store magic link tokens |
| **Email Service** | Brevo SMTP | Send magic link emails |
| **User Database** | PostgreSQL | Store user accounts |
| **JWT Library** | `@nestjs/jwt` | Generate authentication tokens |
| **Auth Service** | Custom NestJS service | Handle authentication logic |

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
