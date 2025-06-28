# Vercel API Structure Guide

A comprehensive guide for building and deploying Node.js APIs on Vercel using Express, Prisma, and modern best practices.

## 📁 Project Structure

```
api/
├── api/                    # API-specific files (if needed)
├── config/                 # Configuration files
│   ├── cloudinary.js      # Cloudinary configuration
│   └── db.js              # Database connection
├── controllers/           # Route controllers
│   ├── auth.controller.js
│   ├── crewlocation.controller.js
│   ├── notice.controller.js
│   ├── request.controller.js
│   ├── sos.controller.js
│   ├── staff.controller.js
│   ├── team.controller.js
│   └── upload.controller.js
├── middleware/            # Custom middleware
│   ├── auth.js           # Authentication middleware
│   └── error.js          # Error handling middleware
├── prisma/               # Database schema and migrations
│   ├── migrations/
│   ├── schema.prisma
│   └── seed.js
├── routes/               # API routes
│   ├── auth.routes.js
│   ├── location.routes.js
│   ├── notice.routes.js
│   ├── request.routes.js
│   ├── sos.routes.js
│   ├── staff.routes.js
│   ├── team.routes.js
│   └── upload.routes.js
├── services/             # Business logic layer
│   ├── auth.service.js
│   ├── notice.service.js
│   ├── request.service.js
│   ├── sos.service.js
│   ├── staff.service.js
│   └── team.service.js
├── utils/                # Utility functions
│   ├── helpers.js
│   ├── logger.js
│   └── validation.js
├── uploads/              # File uploads directory
├── index.js              # Main entry point for Vercel
├── server.js             # Local development server
├── vercel.json           # Vercel configuration
├── package.json          # Dependencies and scripts
└── .env                  # Environment variables
```

## 🚀 Quick Start

### 1. Initialize Project

```bash
# Create new project
mkdir my-vercel-api
cd my-vercel-api

# Initialize package.json
npm init -y

# Install core dependencies
npm install express cors helmet morgan dotenv
npm install @prisma/client prisma
npm install jsonwebtoken bcryptjs
npm install express-validator express-rate-limit
npm install multer cloudinary multer-storage-cloudinary
npm install serverless-http

# Install dev dependencies
npm install -D nodemon
```

### 2. Setup Prisma

```bash
# Initialize Prisma
npx prisma init

# Configure database (MySQL example)
# Edit prisma/schema.prisma
```

### 3. Create Entry Points

#### `index.js` (Vercel Entry Point)
```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const errorHandler = require('./middleware/error');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
  res.send('API is running');
});

app.use(errorHandler);

// Export for Vercel
module.exports = app;
```

#### `server.js` (Local Development)
```javascript
const app = require('./index');

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### 4. Configure Vercel

#### `vercel.json`
```json
{
  "version": 2,
  "builds": [
    {
      "src": "index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/uploads/(.*)",
      "dest": "/uploads/$1"
    },
    {
      "src": "/(.*)",
      "dest": "index.js"
    }
  ]
}
```

### 5. Package.json Scripts

```json
{
  "scripts": {
    "start": "node api/server.js",
    "dev": "nodemon api/server.js",
    "migrate": "npx prisma migrate dev",
    "generate": "npx prisma generate",
    "studio": "npx prisma studio",
    "vercel-build": "prisma generate"
  }
}
```

## 🗄️ Database Setup

### Prisma Schema Example

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String
  password  String
  role      String   @default("user")
  status    Int      @default(1)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("users")
}

model Token {
  id           Int      @id @default(autoincrement())
  userId       Int      @map("user_id")
  accessToken  String   @unique @map("access_token")
  refreshToken String   @unique @map("refresh_token")
  expiresAt    DateTime @map("expires_at")
  isValid      Boolean  @default(true) @map("is_valid")
  createdAt    DateTime @default(now()) @map("created_at")
  lastUsedAt   DateTime? @map("last_used_at")
  
  user         User     @relation(fields: [userId], references: [id])

  @@map("tokens")
}
```

### Database Connection

#### `config/db.js`
```javascript
const { PrismaClient } = require('@prisma/client');

const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV === 'development') {
  global.prisma = prisma;
}

module.exports = prisma;
```

## 🔐 Authentication System

### JWT Authentication Middleware

#### `middleware/auth.js`
```javascript
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check token in database
    const tokenRecord = await prisma.tokens.findFirst({
      where: {
        access_token: token,
        is_valid: true,
        expires_at: { gt: new Date() }
      },
      include: { user: true }
    });

    if (!tokenRecord) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    req.user = {
      userId: tokenRecord.user.id,
      role: tokenRecord.user.role,
      email: tokenRecord.user.email
    };

    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Insufficient permissions' 
      });
    }

    next();
  };
};

module.exports = { authenticate, authorizeRoles };
```

### Authentication Controller

#### `controllers/auth.controller.js`
```javascript
const prisma = require('../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');

const generateTokens = async (user) => {
  const accessToken = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  const refreshToken = jwt.sign(
    { userId: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  await prisma.tokens.create({
    data: {
      userId: user.id,
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000),
    },
  });

  return { accessToken, refreshToken };
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.status !== 1) {
      return res.status(403).json({ message: 'Account inactive' });
    }

    const { accessToken, refreshToken } = await generateTokens(user);

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { login };
```

## 🛣️ Route Structure

### Route Example

#### `routes/auth.routes.js`
```javascript
const express = require('express');
const { body } = require('express-validator');
const { login, register, logout } = require('../controllers/auth.controller');
const { validateRequest } = require('../middleware/validation');

const router = express.Router();

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  validateRequest
], login);

router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().isLength({ min: 2 }),
  validateRequest
], register);

router.post('/logout', logout);

module.exports = router;
```

## 🔧 Middleware

### Error Handling

#### `middleware/error.js`
```javascript
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation Error',
      errors: err.errors
    });
  }

  if (err.name === 'PrismaClientKnownRequestError') {
    return res.status(400).json({
      message: 'Database Error',
      error: err.message
    });
  }

  res.status(500).json({
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
};

module.exports = errorHandler;
```

### Validation Middleware

#### `middleware/validation.js`
```javascript
const { validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation Error',
      errors: errors.array()
    });
  }
  next();
};

module.exports = { validateRequest };
```

## 📤 File Upload with Cloudinary

### Upload Configuration

#### `config/cloudinary.js`
```javascript
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

module.exports = cloudinary;
```

### Upload Controller

#### `controllers/upload.controller.js`
```javascript
const cloudinary = require('../config/cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'uploads',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'pdf']
  }
});

const upload = multer({ storage: storage });

const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    res.json({
      success: true,
      url: req.file.path,
      filename: req.file.filename
    });
  } catch (error) {
    res.status(500).json({ message: 'Upload failed' });
  }
};

module.exports = { upload, uploadFile };
```

## 🌍 Environment Variables

### `.env` Template
```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/database"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-refresh-secret-key"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Server
PORT=5000
NODE_ENV=development

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🚀 Deployment

### 1. Vercel CLI Setup
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Set environment variables
vercel env add DATABASE_URL
vercel env add JWT_SECRET
vercel env add CLOUDINARY_CLOUD_NAME
vercel env add CLOUDINARY_API_KEY
vercel env add CLOUDINARY_API_SECRET
```

### 2. Database Migration
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy
```

### 3. Production Build
```bash
# Build command (add to package.json)
"vercel-build": "prisma generate"
```

## 📊 Performance Optimization

### Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/api/', limiter);
```

### Caching Strategy
```javascript
const cache = require('memory-cache');

const cacheMiddleware = (duration) => {
  return (req, res, next) => {
    const key = `__express__${req.originalUrl}`;
    const cachedBody = cache.get(key);
    
    if (cachedBody) {
      res.send(cachedBody);
      return;
    }
    
    res.sendResponse = res.send;
    res.send = (body) => {
      cache.put(key, body, duration * 1000);
      res.sendResponse(body);
    };
    next();
  };
};
```

## 🔒 Security Best Practices

### 1. Input Validation
```javascript
const { body, param, query } = require('express-validator');

const validateUser = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('name').trim().isLength({ min: 2, max: 50 }),
  validateRequest
];
```

### 2. SQL Injection Prevention
- Use Prisma ORM (already handles this)
- Never use raw SQL queries
- Always validate and sanitize inputs

### 3. CORS Configuration
```javascript
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
```

### 4. Helmet Security
```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
```

## 🧪 Testing

### API Testing with Jest
```javascript
// tests/auth.test.js
const request = require('supertest');
const app = require('../index');

describe('Auth Endpoints', () => {
  test('POST /api/auth/login - should login user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
  });
});
```

## 📝 API Documentation

### Swagger/OpenAPI Setup
```javascript
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Documentation',
      version: '1.0.0',
    },
  },
  apis: ['./routes/*.js'],
};

const specs = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
```

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 📈 Monitoring & Logging

### Winston Logger Setup
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

## 🎯 Best Practices Summary

1. **Structure**: Follow the established folder structure
2. **Security**: Always validate inputs and use authentication
3. **Database**: Use Prisma for type-safe database operations
4. **Error Handling**: Implement comprehensive error handling
5. **Logging**: Use structured logging for debugging
6. **Testing**: Write tests for critical functionality
7. **Documentation**: Document your API endpoints
8. **Performance**: Implement caching and rate limiting
9. **Monitoring**: Set up proper monitoring and alerting
10. **CI/CD**: Automate deployment processes

## 🚨 Common Issues & Solutions

### 1. CORS Errors
- Ensure CORS is properly configured
- Check allowed origins in production

### 2. Database Connection Issues
- Verify DATABASE_URL format
- Check database accessibility from Vercel

### 3. File Upload Failures
- Verify Cloudinary credentials
- Check file size limits

### 4. JWT Token Issues
- Ensure JWT_SECRET is set
- Check token expiration times

### 5. Prisma Migration Issues
- Run `prisma generate` before deployment
- Ensure migrations are up to date

This structure provides a solid foundation for building scalable, secure, and maintainable APIs on Vercel. 