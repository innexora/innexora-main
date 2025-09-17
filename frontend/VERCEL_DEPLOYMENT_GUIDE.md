# Vercel Deployment Guide for Hotel SaaS Frontend

## 🚀 Quick Overview

This guide will help you deploy your Next.js hotel SaaS frontend to Vercel with full subdomain support. The app uses a multi-tenant architecture where each hotel gets its own subdomain (e.g., `paradise.yourdomain.com`, `marvel.yourdomain.com`).

## ✅ Prerequisites

1. **Vercel Account**: Create account at [vercel.com](https://vercel.com)
2. **Custom Domain**: You'll need a domain for subdomain functionality
3. **Backend API**: Your backend should be deployed and accessible
4. **Git Repository**: Code should be in GitHub/GitLab/Bitbucket

## 📋 Pre-Deployment Checklist

### 1. Environment Variables
Create a `.env.local` file for local testing:

```bash
NEXT_PUBLIC_API_URL=https://your-backend-api.com/api
NEXT_TELEMETRY_DISABLED=1
```

### 2. Backend URL Configuration
Your API client in `src/lib/api.ts` is already configured to:
- Detect subdomains automatically
- Route API calls correctly for multi-tenant setup
- Fallback to environment variable for server-side rendering

## 🚀 Deployment Steps

### Step 1: Connect Repository to Vercel

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **"New Project"**
3. Import your Git repository
4. Select the **frontend** folder as root directory

### Step 2: Configure Build Settings

Vercel should auto-detect Next.js, but verify:
- **Framework Preset**: Next.js
- **Root Directory**: `frontend` (if in monorepo)
- **Build Command**: `npm run build`
- **Output Directory**: `.next`

### Step 3: Set Environment Variables

In Vercel dashboard → Project → Settings → Environment Variables:

```
NEXT_PUBLIC_API_URL = https://your-backend-domain.com/api
NEXT_TELEMETRY_DISABLED = 1
```

**Important**: Replace `your-backend-domain.com` with your actual backend URL.

### Step 4: Deploy

Click **"Deploy"** - first deployment will take 2-3 minutes.

Your app will be available at: `https://your-project-name.vercel.app`

## 🌐 Setting Up Custom Domain & Subdomains

### Step 1: Add Your Domain

1. Go to Project → Settings → Domains
2. Add your custom domain: `yourdomain.com`
3. Follow DNS configuration instructions

### Step 2: Configure Subdomain Support

Add these domains to your Vercel project:
- `yourdomain.com` (main domain)
- `*.yourdomain.com` (wildcard for all subdomains)
- `paradise.yourdomain.com` (specific hotel)
- `marvel.yourdomain.com` (specific hotel)
- `demo.yourdomain.com` (specific hotel)

### Step 3: DNS Configuration

In your domain provider's DNS settings:

```
Type: A
Name: @
Value: 76.76.19.61

Type: CNAME
Name: *
Value: cname.vercel-dns.com

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

## 🔧 Subdomain Functionality

### How It Works

1. **Automatic Detection**: Your `api.ts` detects subdomains from the URL
2. **Multi-tenant Routing**: Each subdomain connects to the right hotel database
3. **Shared Frontend**: Same React app serves all hotels with different data

### Example URLs

```
https://yourdomain.com → Main site/admin
https://paradise.yourdomain.com → Paradise Resort
https://marvel.yourdomain.com → Marvel Business Hotel
https://demo.yourdomain.com → Demo Luxury Hotel
```

### API Communication

Your frontend automatically constructs the correct API URLs:

```javascript
// paradise.yourdomain.com calls → https://paradise.your-backend.com/api
// marvel.yourdomain.com calls → https://marvel.your-backend.com/api
```

## 🔒 Security & Performance

### Automatic Features

✅ **HTTPS**: Automatic SSL certificates  
✅ **CDN**: Global edge network  
✅ **Compression**: Automatic Gzip/Brotli  
✅ **Security Headers**: XSS protection, content sniffing prevention  

### Performance Optimizations

- **Image Optimization**: Next.js automatic image optimization
- **Static Generation**: Pre-built pages for better performance
- **Edge Functions**: Fast API responses from edge locations

## 🧪 Testing Your Deployment

### 1. Test Main Domain
Visit `https://yourdomain.com` and verify:
- Site loads correctly
- Admin login works
- API calls are successful

### 2. Test Subdomains
Visit `https://paradise.yourdomain.com` and verify:
- Subdomain routing works
- Correct hotel data loads
- Booking system functions

### 3. Test Different Hotels
```bash
# Test all your hotel subdomains
https://paradise.yourdomain.com
https://marvel.yourdomain.com  
https://demo.yourdomain.com
```

## 🐛 Troubleshooting

### Common Issues

#### 1. **API Calls Failing**
```
✅ Check NEXT_PUBLIC_API_URL is set correctly
✅ Verify backend CORS allows your domain
✅ Ensure backend is deployed and accessible
```

#### 2. **Subdomain Not Working**
```
✅ Verify wildcard DNS record (*.yourdomain.com)
✅ Check domain is added in Vercel settings
✅ Wait for DNS propagation (up to 24 hours)
```

#### 3. **Build Failing**
```
✅ Check all dependencies are in package.json
✅ Verify TypeScript errors are resolved
✅ Check build logs in Vercel dashboard
```

### Debug Commands

```bash
# Test DNS resolution
nslookup paradise.yourdomain.com

# Test SSL certificate
curl -I https://paradise.yourdomain.com

# Check API connectivity
curl https://your-backend.com/api/health
```

## 📊 Monitoring & Analytics

### Vercel Analytics
- Go to Project → Analytics
- Monitor page views, performance, and user behavior
- Track subdomain usage patterns

### Performance Monitoring
- Check Core Web Vitals
- Monitor API response times
- Track error rates by subdomain

## 🔄 Continuous Deployment

### Automatic Deployments
- **Main Branch**: Auto-deploys to production
- **Feature Branches**: Creates preview deployments
- **Pull Requests**: Automatic preview links

### Deployment Commands
```bash
# Manual deployment via CLI
npm i -g vercel
vercel --prod

# Preview deployment
vercel
```

## 💰 Cost Considerations

### Vercel Pro Features (if needed)
- **Custom Domains**: Unlimited (Free: 1 domain)
- **Team Collaboration**: Multiple team members
- **Advanced Analytics**: Detailed performance metrics
- **More Build Time**: 400 build hours/month (Free: 100)

### Optimization Tips
- Use Static Generation where possible
- Optimize images and assets
- Implement proper caching strategies

## 🎯 Next Steps After Deployment

1. **Configure CORS**: Update backend to allow your Vercel domain
2. **Set up Monitoring**: Implement error tracking (Sentry, etc.)
3. **Performance Testing**: Test with real user scenarios
4. **SEO Setup**: Configure meta tags for each hotel
5. **SSL Verification**: Ensure all subdomains have valid certificates

## 🆘 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Review browser console for errors
3. Test API endpoints directly
4. Verify DNS propagation status

Your hotel SaaS frontend should now be fully deployed on Vercel with complete subdomain support! 🎉

## 📝 Quick Reference

```bash
# Key URLs after deployment
Main Site: https://yourdomain.com
Paradise: https://paradise.yourdomain.com
Marvel: https://marvel.yourdomain.com
Demo: https://demo.yourdomain.com

# Environment Variables
NEXT_PUBLIC_API_URL=https://your-backend.com/api
NEXT_TELEMETRY_DISABLED=1
```