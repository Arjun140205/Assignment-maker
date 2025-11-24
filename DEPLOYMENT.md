# Deployment Guide

This guide covers deploying the Handwritten Assignment Generator to production.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- AI Provider API key (OpenAI or Google Gemini)
- Git repository (for automated deployments)

## Environment Configuration

### 1. Set Up Environment Variables

Copy the `.env.example` file to `.env.local` for local development or configure environment variables in your hosting platform:

```bash
cp .env.example .env.local
```

### 2. Configure Required Variables

**AI Provider Configuration:**
- `NEXT_PUBLIC_AI_PROVIDER`: Set to `openai` or `gemini`
- `OPENAI_API_KEY`: Your OpenAI API key (if using OpenAI)
- `GEMINI_API_KEY`: Your Google Gemini API key (if using Gemini)

**File Upload Configuration:**
- `NEXT_PUBLIC_MAX_FILE_SIZE`: Maximum file size in bytes (default: 52428800 = 50MB)

**Optional Configuration:**
- `NEXT_PUBLIC_FONT_CDN_URL`: CDN URL for hosting fonts (improves performance)
- `NEXT_PUBLIC_APP_URL`: Your application URL (for production)

## Build and Test Locally

### 1. Install Dependencies

```bash
npm install
```

### 2. Build for Production

```bash
npm run build
```

### 3. Test Production Build Locally

```bash
npm run start
```

Visit `http://localhost:3000` to verify the production build works correctly.

## Deployment Options

### Option 1: Vercel (Recommended)

Vercel is the recommended platform for Next.js applications.

#### Deploy via Vercel CLI

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel
```

4. For production deployment:
```bash
vercel --prod
```

#### Deploy via GitHub Integration

1. Push your code to GitHub
2. Visit [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your GitHub repository
5. Configure environment variables in the Vercel dashboard
6. Deploy

**Environment Variables in Vercel:**
- Go to Project Settings → Environment Variables
- Add all variables from `.env.example`
- Set appropriate values for production

### Option 2: Netlify

1. Install Netlify CLI:
```bash
npm install -g netlify-cli
```

2. Login to Netlify:
```bash
netlify login
```

3. Initialize and deploy:
```bash
netlify init
netlify deploy --prod
```

**Build Settings:**
- Build command: `npm run build`
- Publish directory: `.next`
- Functions directory: `.netlify/functions`

### Option 3: AWS Amplify

1. Install AWS Amplify CLI:
```bash
npm install -g @aws-amplify/cli
```

2. Initialize Amplify:
```bash
amplify init
```

3. Add hosting:
```bash
amplify add hosting
```

4. Deploy:
```bash
amplify publish
```

### Option 4: Self-Hosted (Docker)

#### Create Dockerfile

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package*.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

#### Build and Run Docker Container

```bash
# Build image
docker build -t handwritten-assignment-generator .

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_AI_PROVIDER=openai \
  -e OPENAI_API_KEY=your_key_here \
  -e NEXT_PUBLIC_MAX_FILE_SIZE=52428800 \
  handwritten-assignment-generator
```

#### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_AI_PROVIDER=openai
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - NEXT_PUBLIC_MAX_FILE_SIZE=52428800
      - NEXT_PUBLIC_APP_URL=https://yourdomain.com
    restart: unless-stopped
```

Run with:
```bash
docker-compose up -d
```

## CDN Configuration for Fonts

For optimal performance, host fonts on a CDN:

### Using Vercel Edge Network

Fonts in `/public/fonts/` are automatically served via Vercel's Edge Network.

### Using External CDN (Cloudflare, AWS CloudFront)

1. Upload fonts from `/public/fonts/handwritten/` to your CDN
2. Set `NEXT_PUBLIC_FONT_CDN_URL` environment variable to your CDN URL
3. Ensure CORS headers are configured on your CDN:
   ```
   Access-Control-Allow-Origin: *
   Access-Control-Allow-Methods: GET
   ```

## Performance Optimization

### 1. Enable Compression

Compression is enabled by default in `next.config.ts`.

### 2. Configure Caching

Static assets are cached for 1 year (immutable). Fonts are cached indefinitely.

### 3. Image Optimization

Next.js Image component automatically optimizes images. Supported formats: AVIF, WebP.

### 4. Bundle Analysis

Analyze bundle size:

```bash
npm install -g @next/bundle-analyzer
```

Add to `next.config.ts`:
```typescript
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer(nextConfig)
```

Run analysis:
```bash
ANALYZE=true npm run build
```

## Security Checklist

- [ ] Environment variables are set correctly
- [ ] API keys are not exposed in client-side code
- [ ] Security headers are configured (automatic in `next.config.ts`)
- [ ] HTTPS is enabled (automatic on Vercel/Netlify)
- [ ] File upload size limits are enforced
- [ ] Content Security Policy is configured
- [ ] CORS is properly configured for API routes

## Monitoring and Logging

### Vercel Analytics

Enable Vercel Analytics in your dashboard for:
- Page views
- Performance metrics
- Error tracking

### Custom Logging

Add logging service integration (e.g., Sentry, LogRocket):

```bash
npm install @sentry/nextjs
```

Configure in `sentry.config.js`.

## Post-Deployment Verification

1. **Test File Upload**: Upload PDF, DOCX, image, and text files
2. **Test AI Generation**: Generate content with various prompts
3. **Test Font Selection**: Switch between different fonts
4. **Test Page Styles**: Change page styles (ruled, unruled, lined)
5. **Test Color Selection**: Change text colors
6. **Test Export**: Export to PDF and verify quality
7. **Test Performance**: Check page load times and rendering speed
8. **Test Mobile**: Verify responsive design on different screen sizes

## Troubleshooting

### Build Fails

- Check Node.js version (18+ required)
- Clear `.next` folder: `rm -rf .next`
- Clear node_modules: `rm -rf node_modules && npm install`

### API Errors

- Verify API keys are set correctly
- Check API rate limits
- Verify network connectivity to AI provider

### Font Loading Issues

- Check font files exist in `/public/fonts/handwritten/`
- Verify CDN URL is correct (if using CDN)
- Check browser console for CORS errors

### Performance Issues

- Enable CDN for fonts
- Optimize images
- Check bundle size with analyzer
- Monitor server resources

## Scaling Considerations

### High Traffic

- Use Vercel Pro for higher limits
- Implement rate limiting for API routes
- Consider caching AI responses
- Use Redis for session management

### Large Files

- Increase `NEXT_PUBLIC_MAX_FILE_SIZE` if needed
- Implement chunked file uploads
- Use background processing for large files

## Backup and Recovery

### Database Backup (if using user accounts)

Set up automated backups for user data.

### Configuration Backup

Keep environment variables documented and backed up securely.

## Support and Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Google Gemini API Documentation](https://ai.google.dev/docs)

## License

Ensure you comply with all third-party licenses for fonts and libraries used in the project.
