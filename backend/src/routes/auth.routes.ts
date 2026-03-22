import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { config } from '../config/env';
import { redis } from '../db/redis';
import { authGuard, AuthRequest } from '../middleware/authGuard';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate JWT tokens
function generateTokens(user: any) {
  const accessToken = jwt.sign(
    { id: user._id, role: user.role, name: user.name, mobile: user.mobile },
    config.jwtSecret,
    { expiresIn: config.jwtAccessExpiry as any }
  );
  const refreshToken = jwt.sign(
    { id: user._id },
    config.jwtRefreshSecret,
    { expiresIn: config.jwtRefreshExpiry as any }
  );
  return { accessToken, refreshToken };
}

// POST /auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { mobile, email, name, role, language } = req.body;

    if (!mobile || !name) {
      throw new AppError(400, 'Mobile and name are required');
    }
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      throw new AppError(400, 'Invalid mobile number format');
    }

    const existing = await User.findOne({ mobile });
    if (existing) {
      throw new AppError(409, 'User with this mobile already exists');
    }

    const otp = generateOTP();
    const user = await User.create({
      mobile,
      email,
      name,
      role: role || 'FARMER',
      language: language || 'en',
      otp: { code: otp, expiresAt: new Date(Date.now() + 10 * 60 * 1000), attempts: 0 },
    });

    // TODO: Send OTP via SMS (Twilio/Bhashini)
    console.log(`[auth]: OTP for ${mobile}: ${otp}`);

    res.status(201).json({
      userId: user._id,
      message: 'Registration successful. OTP sent.',
      otpSent: true,
    });
  } catch (error) {
    next(error);
  }
});

// POST /auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { mobile, loginMethod } = req.body;

    if (!mobile) {
      throw new AppError(400, 'Mobile number is required');
    }

    const user = await User.findOne({ mobile, deletedAt: { $exists: false } });
    if (!user) {
      throw new AppError(404, 'User not registered');
    }

    if (user.status !== 'ACTIVE') {
      throw new AppError(403, 'Account is suspended or inactive');
    }

    if (loginMethod === 'PASSWORD') {
      // Password-based login handled separately
      const { password } = req.body;
      if (!user.password || !password) {
        throw new AppError(400, 'Password required');
      }
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        throw new AppError(401, 'Invalid credentials');
      }

      const tokens = generateTokens(user);
      user.metadata.lastLoginAt = new Date();
      user.metadata.loginCount += 1;
      await user.save();

      return res.json({
        ...tokens,
        user: { id: user._id, name: user.name, role: user.role, mobile: user.mobile },
      });
    }

    // OTP-based login
    const otp = generateOTP();
    user.otp = { code: otp, expiresAt: new Date(Date.now() + 10 * 60 * 1000), attempts: 0 };
    await user.save();

    console.log(`[auth]: OTP for ${mobile}: ${otp}`);

    res.json({ message: 'OTP sent successfully', otpSent: true });
  } catch (error) {
    next(error);
  }
});

// POST /auth/direct-login (Dev mode — skip OTP)
router.post('/direct-login', async (req, res, next) => {
  try {
    const { mobile, name, role } = req.body;

    if (!mobile) {
      throw new AppError(400, 'Mobile number is required');
    }

    let user = await User.findOne({ mobile, deletedAt: { $exists: false } });

    if (!user) {
      // Auto-create the user if not found
      user = await User.create({
        mobile,
        name: name || `User ${mobile.slice(-4)}`,
        role: role || 'FARMER',
        language: 'en',
        status: 'ACTIVE',
        mobileVerified: true,
      });
      console.log(`[auth]: Auto-created user ${mobile} with role ${user.role}`);
    }

    // Update login metadata
    user.metadata.lastLoginAt = new Date();
    user.metadata.loginCount += 1;
    await user.save();

    const tokens = generateTokens(user);

    res.json({
      ...tokens,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        mobile: user.mobile,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /auth/verify-otp
router.post('/verify-otp', async (req, res, next) => {
  try {
    const { mobile, otp } = req.body;

    if (!mobile || !otp) {
      throw new AppError(400, 'Mobile and OTP are required');
    }

    const user = await User.findOne({ mobile });
    if (!user || !user.otp) {
      throw new AppError(400, 'No pending OTP for this number');
    }

    if (user.otp.attempts >= 5) {
      throw new AppError(429, 'Too many OTP attempts. Request a new one.');
    }

    if (new Date() > user.otp.expiresAt) {
      throw new AppError(400, 'OTP has expired');
    }

    if (user.otp.code !== otp) {
      user.otp.attempts += 1;
      await user.save();
      throw new AppError(401, 'Invalid OTP');
    }

    // OTP verified
    user.mobileVerified = true;
    user.otp = undefined as any;
    user.metadata.lastLoginAt = new Date();
    user.metadata.loginCount += 1;
    await user.save();

    const tokens = generateTokens(user);

    res.json({
      ...tokens,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        mobile: user.mobile,
        permissions: [],
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /auth/refresh
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw new AppError(400, 'Refresh token required');
    }

    const payload = jwt.verify(refreshToken, config.jwtRefreshSecret) as any;
    const user = await User.findById(payload.id);
    if (!user) {
      throw new AppError(401, 'User not found');
    }

    const tokens = generateTokens(user);
    res.json(tokens);
  } catch (error) {
    next(new AppError(401, 'Invalid refresh token'));
  }
});

// GET /auth/profile
router.get('/profile', authGuard, async (req: AuthRequest, res, next) => {
  try {
    const user = await User.findById(req.user!.id).select('-password -otp');
    if (!user) {
      throw new AppError(404, 'User not found');
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// PATCH /auth/profile
router.patch('/profile', authGuard, async (req: AuthRequest, res, next) => {
  try {
    const allowedFields = ['name', 'avatar', 'language', 'preferences'];
    const updates: any = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const user = await User.findByIdAndUpdate(req.user!.id, { $set: updates }, { new: true }).select('-password -otp');
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// POST /auth/logout
router.post('/logout', authGuard, async (req: AuthRequest, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      // Blacklist the token in Redis (expires when token would expire)
      try {
        await redis.setex(`blacklist:${token}`, 900, '1'); // 15 min
      } catch {
        // Redis may be down
      }
    }
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
