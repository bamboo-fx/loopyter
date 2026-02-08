# Production Deployment Guide

This guide covers deploying this application to production environments outside of Vibecode.

## Environment Variables

### Backend (.env)

Required variables:
```bash
PORT=3000                    # Server port (default: 3000)
DATABASE_URL="file:/data/production.db"  # Absolute path recommended for production
OPENAI_API_KEY=sk-...       # Your OpenAI API key
RESEND_API_KEY=re_...       # Your Resend API key for email OTP
```

Optional variables:
```bash
BACKEND_URL=https://api.yourdomain.com  # Public backend URL (for CORS/auth)
ALLOWED_ORIGINS=https://yourdomain.com,https://*.yourdomain.com  # Comma-separated allowed origins
TRUSTED_ORIGINS=https://yourdomain.com,https://*.yourdomain.com  # Comma-separated trusted origins for Better Auth
HOSTNAME=0.0.0.0            # Server hostname (default: 0.0.0.0 for all interfaces)
NODE_ENV=production         # Set to production
```

### Webapp (.env)

Required variables:
```bash
VITE_BACKEND_URL=https://api.yourdomain.com  # Backend API URL
```

## CORS Configuration

The backend allows requests from:
- `localhost` and `127.0.0.1` (development)
- Vibecode domains (if running on Vibecode platform)
- Custom origins specified in `ALLOWED_ORIGINS` environment variable

To allow your production domain, set:
```bash
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

Wildcards are supported via regex patterns:
```bash
ALLOWED_ORIGINS=https://*.yourdomain.com
```

## Better Auth Configuration

Better Auth trusted origins can be configured via `TRUSTED_ORIGINS`:
```bash
TRUSTED_ORIGINS=https://yourdomain.com,https://*.yourdomain.com
```

## Database

The application uses SQLite. For production:

1. **Use an absolute path** for `DATABASE_URL`:
   ```bash
   DATABASE_URL="file:/data/production.db"
   ```

2. **Ensure the directory exists** and is writable:
   ```bash
   mkdir -p /data
   chmod 755 /data
   ```

3. **Backup regularly** - The start script automatically backs up the database in production mode.

## Deployment Steps

### 1. Install Dependencies

```bash
cd backend && bun install
cd ../webapp && bun install
```

### 2. Generate Prisma Client

```bash
cd backend
bunx prisma generate
```

### 3. Set Environment Variables

Create `.env` files in both `backend/` and `webapp/` directories with the required variables.

### 4. Initialize Database

```bash
cd backend
bunx prisma db push
```

### 5. Build Webapp

```bash
cd webapp
bun run build
```

The built files will be in `webapp/dist/`.

### 6. Start Backend Server

```bash
cd backend
ENVIRONMENT=production ./scripts/start
```

Or using bun directly:
```bash
cd backend
NODE_ENV=production bun src/index.ts
```

### 7. Serve Webapp

Serve the `webapp/dist/` directory using a static file server like:
- Nginx
- Apache
- Vercel
- Netlify
- Cloudflare Pages

## Docker Deployment (Optional)

Example Dockerfile for backend:

```dockerfile
FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
COPY backend/package.json backend/bun.lock ./
RUN bun install --frozen-lockfile

# Copy source code
COPY backend/ ./

# Generate Prisma client
RUN bunx prisma generate

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Start server
CMD ["bun", "src/index.ts"]
```

## Platform-Specific Notes

### Vibecode Platform
- Automatically handles environment variables
- Database viewer is enabled automatically
- Proxy is available for external API calls

### Other Platforms
- Set all environment variables manually
- Vibecode proxy is not available (application continues without it)
- Database viewer API calls fail gracefully

## Troubleshooting

### CORS Errors
- Ensure `ALLOWED_ORIGINS` includes your frontend domain
- Check that `VITE_BACKEND_URL` matches your backend URL
- Verify credentials are included in requests (`credentials: "include"`)

### Database Errors
- Ensure `DATABASE_URL` uses an absolute path in production
- Check file permissions on the database directory
- Verify Prisma client is generated: `bunx prisma generate`

### Authentication Errors
- Ensure `TRUSTED_ORIGINS` includes your frontend domain
- Verify `BACKEND_URL` is set correctly
- Check that cookies can be set (HTTPS recommended)

### Port Binding Issues
- Set `HOSTNAME=0.0.0.0` to bind to all interfaces
- Ensure the port is not already in use
- Check firewall rules

## Security Checklist

- [ ] All API keys are in environment variables (never commit to git)
- [ ] Database uses absolute path with proper permissions
- [ ] CORS is configured to only allow your domains
- [ ] HTTPS is enabled in production
- [ ] Environment variables are secured (use secrets management)
- [ ] Database backups are configured
- [ ] Rate limiting is considered (not implemented by default)
