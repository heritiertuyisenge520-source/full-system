
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './db';
import { PillarModel, EntryModel, SubmissionModel, UserModel } from './models';
import authRoutes from './routes/authRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import logger from './utils/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`);
    next();
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// Connect to Database
connectDB();

// --- ROUTES ---

// Auth Routes
app.use('/api/auth', authRoutes);

// Analytics Routes
app.use('/api/analytics', analyticsRoutes);

// 1. Get Metadata (Pillars Structure)
app.get('/api/metadata', async (req, res) => {
    try {
        const pillars = await PillarModel.find({});
        res.json(pillars);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching metadata' });
    }
});

// 2. Get Entries (With Filters)
app.get('/api/entries', async (req, res) => {
    try {
        const { pillarId, quarterId, month } = req.query;
        const query: any = {};

        if (pillarId) query.pillarId = pillarId;
        if (quarterId) query.quarterId = quarterId;
        if (month) query.month = month;

        const entries = await EntryModel.find(query).sort({ timestamp: -1 });
        res.json(entries);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching entries' });
    }
});

// 3. Add Entry
app.post('/api/entries', async (req, res) => {
    try {
        const newEntry = new EntryModel(req.body);
        const savedEntry = await newEntry.save();
        res.status(201).json(savedEntry);
    } catch (error) {
        res.status(400).json({ message: 'Error saving entry' });
    }
});

// 4. Update Entry
app.patch('/api/entries/:id', async (req, res) => {
    try {
        const updatedEntry = await EntryModel.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.json(updatedEntry);
    } catch (error) {
        res.status(400).json({ message: 'Error updating entry' });
    }
});

// 5. Delete Entry (Optional cleanup)
app.delete('/api/entries/:id', async (req, res) => {
    try {
        await EntryModel.findByIdAndDelete(req.params.id);
        res.json({ message: 'Entry deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting entry' });
    }
});

// 6. Submit Data (Submission Collection)
app.get('/api/submissions', async (req, res) => {
    try {
        const { pillarId, quarterId, indicatorId, month } = req.query;
        const query: any = {};

        if (pillarId) query.pillarId = pillarId;
        if (quarterId) query.quarterId = quarterId;
        if (indicatorId) query.indicatorId = indicatorId;
        if (month) query.month = month;

        const submissions = await SubmissionModel.find(query).sort({ timestamp: -1 });
        res.json(submissions);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching submissions' });
    }
});

// 6b. Get Submissions grouped by Quarter
app.get('/api/submissions/by-quarter', async (req, res) => {
    try {
        const { pillarId, indicatorId } = req.query;
        const matchStage: any = {};

        if (pillarId) matchStage.pillarId = pillarId;
        if (indicatorId) matchStage.indicatorId = indicatorId;

        const submissions = await SubmissionModel.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: {
                        quarterId: '$quarterId',
                        indicatorId: '$indicatorId',
                        pillarId: '$pillarId'
                    },
                    indicatorName: { $first: '$indicatorName' },
                    pillarName: { $first: '$pillarName' },
                    totalValue: { $sum: '$value' },
                    submissions: {
                        $push: {
                            _id: '$_id',
                            month: '$month',
                            value: '$value',
                            subValues: '$subValues',
                            comments: '$comments',
                            submittedBy: '$submittedBy',
                            timestamp: '$timestamp'
                        }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    quarterId: '$_id.quarterId',
                    indicatorId: '$_id.indicatorId',
                    pillarId: '$_id.pillarId',
                    indicatorName: 1,
                    pillarName: 1,
                    totalValue: 1,
                    submissions: 1,
                    count: 1
                }
            },
            { $sort: { quarterId: 1, indicatorId: 1 } }
        ]);

        // Group by quarter for easier frontend consumption
        const groupedByQuarter = submissions.reduce((acc: any, item: any) => {
            const qId = item.quarterId;
            if (!acc[qId]) {
                acc[qId] = {
                    quarterId: qId,
                    quarterName: qId === 'q1' ? 'Quarter 1' : qId === 'q2' ? 'Quarter 2' : qId === 'q3' ? 'Quarter 3' : 'Quarter 4',
                    indicators: []
                };
            }
            acc[qId].indicators.push({
                indicatorId: item.indicatorId,
                indicatorName: item.indicatorName,
                pillarId: item.pillarId,
                pillarName: item.pillarName,
                totalValue: item.totalValue,
                submissions: item.submissions,
                count: item.count
            });
            return acc;
        }, {});

        res.json({
            quarters: Object.values(groupedByQuarter),
            summary: {
                totalSubmissions: submissions.reduce((a: number, b: any) => a + b.count, 0),
                totalIndicators: submissions.length,
                quartersWithData: Object.keys(groupedByQuarter).length
            }
        });
    } catch (error) {
        console.error('Error fetching submissions by quarter:', error);
        res.status(500).json({ message: 'Error fetching submissions by quarter' });
    }
});

app.get('/api/submissions/:id', async (req, res) => {
    try {
        const submission = await SubmissionModel.findById(req.params.id);
        res.json(submission);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching submission' });
    }
});

app.post('/api/submissions', async (req, res) => {
    try {
        const newSubmission = new SubmissionModel(req.body);
        const savedSubmission = await newSubmission.save();
        res.status(201).json(savedSubmission);
    } catch (error) {
        console.error("Error saving submission:", error);
        res.status(400).json({ message: 'Error saving submission' });
    }
});

app.patch('/api/submissions/:id', async (req, res) => {
    try {
        const updatedSubmission = await SubmissionModel.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.json(updatedSubmission);
    } catch (error) {
        res.status(400).json({ message: 'Error updating submission' });
    }
});

app.delete('/api/submissions/:id', async (req, res) => {
    try {
        await SubmissionModel.findByIdAndDelete(req.params.id);
        res.json({ message: 'Submission deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting submission' });
    }
});

app.post('/api/register', async (req, res) => {
    try {
        const { email, name, firstName, lastName, role, password } = req.body;

        // Check if user already exists
        let user = await UserModel.findOne({ email });
        if (user) {
            return res.status(409).json({ message: 'User with this email already exists. Please login instead.' });
        }

        // Hash the password
        const bcrypt = require('bcrypt');
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create new user
        user = new UserModel({
            email,
            name,
            firstName,
            lastName,
            role,
            password: hashedPassword,
            lastLogin: new Date()
        });
        await user.save();

        // Return user without password
        const userResponse = {
            _id: user._id,
            email: user.email,
            name: user.name,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            lastLogin: user.lastLogin
        };

        res.status(201).json(userResponse);
    } catch (error) {
        console.error("Error registering user:", error);
        res.status(400).json({ message: 'Error registering user' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await UserModel.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found. Please register first.' });
        }

        // Verify password
        const bcrypt = require('bcrypt');
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid password. Please try again.' });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Return user without password
        const userResponse = {
            _id: user._id,
            email: user.email,
            name: user.name,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            lastLogin: user.lastLogin
        };

        res.status(200).json(userResponse);
    } catch (error) {
        console.error("Error logging in:", error);
        res.status(400).json({ message: 'Error logging in' });
    }
});

// Verify User Exists (for password reset)
app.post('/api/verify-user', async (req, res) => {
    try {
        const { email, role } = req.body;

        // Validate input
        if (!email || !role) {
            return res.status(400).json({ message: 'Email and role are required' });
        }

        // Find user by email and role
        const user = await UserModel.findOne({ email, role });

        if (!user) {
            return res.status(404).json({
                message: 'No user found with this email and role. Please check your details or register first.',
                verified: false
            });
        }

        // User found - return success (don't send sensitive data)
        res.status(200).json({
            message: 'User verified successfully',
            verified: true,
            userName: user.name // Return name for confirmation
        });
    } catch (error) {
        console.error("Error verifying user:", error);
        res.status(500).json({ message: 'Error verifying user. Please try again.' });
    }
});

// Password Reset
app.post('/api/reset-password', async (req, res) => {
    try {
        const { email, role, newPassword } = req.body;

        // Validate input
        if (!email || !role || !newPassword) {
            return res.status(400).json({ message: 'Email, role, and new password are required' });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters long' });
        }

        // Find user by email and role
        const user = await UserModel.findOne({ email, role });

        if (!user) {
            return res.status(404).json({
                message: 'No user found with this email and role combination. Please verify your details first.'
            });
        }

        // Hash the new password
        const bcrypt = require('bcrypt');
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update user's password
        user.password = hashedPassword;
        user.updatedAt = new Date();
        await user.save();

        res.status(200).json({
            message: 'Password reset successful! You can now login with your new password.',
            success: true
        });
    } catch (error) {
        console.error("Error resetting password:", error);
        res.status(500).json({ message: 'Error resetting password. Please try again.' });
    }
});

// 7. Clear All Data (Dev only - for "removing dummy data" request)
app.post('/api/clear-data', async (req, res) => {
    try {
        await EntryModel.deleteMany({});
        await SubmissionModel.deleteMany({});
        logger.info('Database cleared by user request');
        res.json({ message: 'All entries and submissions cleared.' });
    } catch (error) {
        logger.error('Error clearing data', error);
        res.status(500).json({ message: 'Error clearing data' });
    }
});

// 8. Migration: Fix mismatched subValues keys in database
app.post('/api/migrate-subvalues', async (req, res) => {
    try {
        // Key mappings: old key -> new key
        const keyMappings: Record<string, string> = {
            'poultry': 'chicken',      // Indicator 31
            'maize_kg': 'maize',       // Indicator 8
            'soya_kg': 'soya',         // Indicator 8
            'bq': 'lsd',               // Indicator 24
            'dap': 'urea',             // Indicator 10
            'cows': '',                // Remove cows (not in subIndicatorIds)
        };

        const submissions = await SubmissionModel.find({ subValues: { $exists: true, $ne: null } });
        let updatedCount = 0;

        for (const submission of submissions) {
            const subValues = submission.subValues as Record<string, number> | undefined;
            if (!subValues) continue;

            let modified = false;
            const newSubValues: Record<string, number> = {};

            for (const [key, value] of Object.entries(subValues)) {
                if (keyMappings[key] !== undefined) {
                    if (keyMappings[key] !== '') {
                        // Rename key
                        newSubValues[keyMappings[key]] = value;
                    }
                    // If mapped to '', we skip it (remove the key)
                    modified = true;
                } else {
                    // Keep original key
                    newSubValues[key] = value;
                }
            }

            if (modified) {
                await SubmissionModel.findByIdAndUpdate(submission._id, { subValues: newSubValues });
                updatedCount++;
            }
        }

        logger.info(`Migration completed: Updated ${updatedCount} submissions`);
        res.json({
            message: `Migration completed successfully`,
            updatedSubmissions: updatedCount,
            totalChecked: submissions.length
        });
    } catch (error) {
        console.error('Migration error:', error);
        res.status(500).json({ message: 'Error during migration' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

