# SMTP Email Configuration - Complete Setup

## ✅ Configuration Complete

SMTP email has been configured for magic link authentication and data exports.

## 📧 SMTP Settings

Your Brevo (formerly Sendinblue) SMTP configuration:

- **SMTP Server**: `smtp-relay.brevo.com`
- **Port**: `587`
- **Security**: `false` (STARTTLS)
- **Username**: `89c9be001@smtp-brevo.com`
- **Password/Key**: `your-smtp-password-here`

## 📝 Environment Variables

### Root `.env` File
```env
# SMTP Email Configuration (Brevo)
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=89c9be001@smtp-brevo.com
SMTP_PASS=your-smtp-password-here
SMTP_FROM="Cite System" <noreply@cite.com>
FRONTEND_URL=http://localhost:3001
```

### Docker `.env` File (`infra/docker/.env`)
Same configuration as above.

### Docker Compose
The `docker-compose.yml` now includes SMTP environment variables that are passed to the API container.

## 🔧 What Was Changed

1. **Created Email Service** (`apps/api/src/shared/email.service.ts`)
   - Handles SMTP connection
   - Sends magic link emails with HTML template
   - Falls back to console logging if SMTP not configured
   - Reusable for other email needs

2. **Updated Auth Service** (`apps/api/src/auth/auth.service.ts`)
   - Now sends actual emails via EmailService
   - Still logs to console in development if SMTP fails
   - Uses `FRONTEND_URL` for magic link generation

3. **Updated Modules**
   - Added `EmailService` to `SharedModule`
   - Added `SharedModule` to `AuthModule`

4. **Updated Environment Files**
   - Added SMTP configuration to root `.env`
   - Added SMTP configuration to `infra/docker/.env`
   - Added SMTP env vars to `docker-compose.yml`

## 🚀 How It Works

### Magic Link Flow

1. User enters email (and invite code if required)
2. `AuthService.sendMagicLink()` is called
3. Token is generated and stored in Redis (15 min expiry)
4. **Email is sent** via `EmailService.sendMagicLink()`
5. User clicks link in email
6. `AuthService.verifyMagicLink()` validates token
7. User is authenticated and receives JWT

### Email Template

The magic link email includes:
- Professional HTML design
- Clear call-to-action button
- Fallback text link
- Security notice
- 15-minute expiry notice

## 🧪 Testing

### Test Magic Link Email

1. **Start the API**:
   ```bash
   docker compose -f infra/docker/docker-compose.yml up -d api
   ```

2. **Send a magic link**:
   ```bash
   curl -X POST http://localhost:3000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"your-email@example.com"}'
   ```

3. **Check your email** for the magic link

4. **Verify the link**:
   ```bash
   curl -X POST http://localhost:3000/auth/verify \
     -H "Content-Type: application/json" \
     -d '{"email":"your-email@example.com","token":"TOKEN_FROM_EMAIL"}'
   ```

### Development Mode

If SMTP is not configured, the system will:
- Log a warning
- Still log the magic link to console (for development)
- Continue working (just without email)

## 🔒 Security Notes

1. **Never commit `.env` files** with real credentials
2. **Use environment variables** in production
3. **Rate limiting** is already in place (1 email per minute)
4. **Token expiry** is 15 minutes
5. **HTTPS** should be used in production for magic links

## 📋 Environment Variables Reference

| Variable | Description | Default |
|----------|-------------|---------|
| `SMTP_HOST` | SMTP server hostname | - |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_SECURE` | Use TLS/SSL (true for 465) | `false` |
| `SMTP_USER` | SMTP username | - |
| `SMTP_PASS` | SMTP password/key | - |
| `SMTP_FROM` | From email address | `"Cite System" <noreply@cite.com>` |
| `FRONTEND_URL` | Frontend URL for magic links | `http://localhost:3001` |

## 🎯 Next Steps

1. **Test the magic link flow** end-to-end
2. **Update `FRONTEND_URL`** for production
3. **Customize email template** if needed (in `email.service.ts`)
4. **Monitor email delivery** in Brevo dashboard

## ✅ Status

- ✅ Email service created
- ✅ Auth service updated
- ✅ Environment variables configured
- ✅ Docker compose updated
- ✅ Modules configured
- ✅ Ready to use!

**Magic link emails will now be sent automatically when users sign in!** 🎉
