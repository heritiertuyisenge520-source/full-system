import express from 'express';
import { SubmissionModel, EntryModel, PillarModel } from '../models';

const router = express.Router();

// Clear all data (submissions and entries)
router.post('/clear-data', async (req, res) => {
    try {
        await SubmissionModel.deleteMany({});
        await EntryModel.deleteMany({});
        res.json({ message: 'All data cleared successfully' });
    } catch (error: any) {
        console.error('Error clearing data:', error);
        res.status(500).json({ message: 'Error clearing data', error: error.message });
    }
});

// Get metadata (pillars structure)
router.get('/metadata', async (req, res) => {
    try {
        const pillars = await PillarModel.find({}).lean();
        res.json(pillars);
    } catch (error: any) {
        console.error('Error fetching metadata:', error);
        res.status(500).json({ message: 'Error fetching metadata', error: error.message });
    }
});

// Get entries (similar to submissions but using EntryModel)
router.get('/entries', async (req, res) => {
    try {
        const entries = await EntryModel.find({ isDeleted: { $ne: true } })
            .sort({ timestamp: -1 })
            .lean();
        res.json(entries);
    } catch (error: any) {
        console.error('Error fetching entries:', error);
        res.status(500).json({ message: 'Error fetching entries', error: error.message });
    }
});

// Get entry by ID
router.get('/entries/:id', async (req, res) => {
    try {
        const entry = await EntryModel.findById(req.params.id);
        if (!entry) {
            return res.status(404).json({ message: 'Entry not found' });
        }
        res.json(entry);
    } catch (error: any) {
        res.status(500).json({ message: 'Error fetching entry', error: error.message });
    }
});

export default router;
