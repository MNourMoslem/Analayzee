# 🚀 Deploying Analayzee to Render.com

This guide will walk you through deploying your Analayzee application to Render.com.

## Prerequisites

1. **GitHub Account**: Your code should be in a GitHub repository
2. **Render.com Account**: Sign up at [render.com](https://render.com)
3. **All changes committed**: Ensure all your changes are pushed to GitHub

## Step-by-Step Deployment

### 1. Prepare Your Repository

Make sure your repository contains:
- ✅ `build.sh` - Build script for Render
- ✅ `render.yaml` - Render configuration
- ✅ `requirements.txt` - Python dependencies
- ✅ Updated `settings.py` with Render configuration
- ✅ All your application files

### 2. Push to GitHub

```bash
git add .
git commit -m "Configure for Render.com deployment"
git push origin main
```

### 3. Deploy on Render.com

#### Option A: Using render.yaml (Recommended)

1. **Go to [Render Dashboard](https://dashboard.render.com)**
2. **Click "New +"** → **"Blueprint"**
3. **Connect your GitHub repository**
4. **Name your service**: `analayzee` (or your preferred name)
5. **Click "Apply"**

Render will automatically:
- Create a PostgreSQL database
- Set up environment variables
- Deploy your application

#### Option B: Manual Setup

1. **Create a Web Service:**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure the service:
     - **Name**: `analayzee`
     - **Environment**: `Python 3`
     - **Build Command**: `./build.sh`
     - **Start Command**: `gunicorn Analayzee.wsgi:application`

2. **Create a PostgreSQL Database:**
   - Click "New +" → "PostgreSQL"
   - **Name**: `analayzee-db`
   - **Database Name**: `analayzee`
   - **User**: `analayzee_user`

3. **Set Environment Variables:**
   In your web service settings, add these environment variables:
   ```
   SECRET_KEY=your-generated-secret-key-here
   DEBUG=False
   DATABASE_URL=your-postgres-connection-string
   RENDER=True
   ALLOWED_HOSTS=your-app-name.onrender.com
   ```

### 4. Configure Environment Variables

After deployment, you'll need to set these environment variables in Render:

#### Required Variables:
- `SECRET_KEY`: Generate a new secure key
- `DEBUG`: Set to `False`
- `DATABASE_URL`: Provided automatically by PostgreSQL service
- `RENDER`: Set to `True`

#### Optional Variables:
- `ALLOWED_HOSTS`: Your custom domain (if you have one)
- `EMAIL_HOST`: For email functionality
- `EMAIL_HOST_USER`: Email username
- `EMAIL_HOST_PASSWORD`: Email password

### 5. Update CORS Settings

After deployment, update your `settings.py` CORS settings:

```python
CORS_ALLOWED_ORIGINS = [
    "https://your-actual-app-name.onrender.com",
]
```

Push this change to trigger a redeploy.

### 6. Access Your Application

Your app will be available at:
`https://your-app-name.onrender.com`

## Post-Deployment Setup

### 1. Create Superuser

Access the Render shell to create an admin user:

1. Go to your service dashboard
2. Click on "Shell" tab
3. Run:
   ```bash
   python manage.py createsuperuser
   ```

### 2. Test Your Application

1. **Upload a CSV/Excel file**
2. **Test user registration**
3. **Check analysis features**
4. **Verify charts and statistics**

## Troubleshooting

### Common Issues:

**Build Fails:**
- Check `build.sh` has execute permissions
- Verify all dependencies in `requirements.txt`
- Check Python version compatibility

**Database Errors:**
- Ensure `DATABASE_URL` is correctly set
- Check PostgreSQL service is running
- Verify migrations ran successfully

**Static Files Not Loading:**
- Ensure WhiteNoise is properly configured
- Check `STATIC_ROOT` and `STATIC_URL` settings
- Verify `collectstatic` runs in build script

**CORS Errors:**
- Update `CORS_ALLOWED_ORIGINS` with your Render URL
- Check `ALLOWED_HOSTS` includes `.onrender.com`

### Debug Commands:

Access Render shell and run:
```bash
# Check environment variables
env | grep -E "(SECRET_KEY|DEBUG|DATABASE_URL)"

# Test database connection
python manage.py dbshell

# Check migrations
python manage.py showmigrations

# Collect static files manually
python manage.py collectstatic --noinput
```

## Custom Domain (Optional)

To use a custom domain:

1. **In Render Dashboard:**
   - Go to your service settings
   - Add your custom domain

2. **Update DNS:**
   - Add CNAME record pointing to your Render service

3. **Update Settings:**
   - Add your domain to `ALLOWED_HOSTS`
   - Update `CORS_ALLOWED_ORIGINS`

## Performance Tips

1. **Enable Redis Cache** (optional):
   ```python
   CACHES = {
       'default': {
           'BACKEND': 'django_redis.cache.RedisCache',
           'LOCATION': os.environ.get('REDIS_URL'),
           'OPTIONS': {
               'CLIENT_CLASS': 'django_redis.client.DefaultClient',
           }
       }
   }
   ```

2. **Monitor Performance:**
   - Use Render's built-in metrics
   - Set up log monitoring
   - Monitor database performance

## Security Checklist

- ✅ `DEBUG = False` in production
- ✅ Secure `SECRET_KEY` generated
- ✅ HTTPS enabled (automatic on Render)
- ✅ CORS properly configured
- ✅ Database secured
- ✅ Environment variables protected

## Support

- **Render Documentation**: [render.com/docs](https://render.com/docs)
- **Django Deployment**: [docs.djangoproject.com](https://docs.djangoproject.com/en/stable/howto/deployment/)
- **GitHub Issues**: Report problems in your repository

---

**🎉 Congratulations!** Your Analayzee application is now live on Render.com!
