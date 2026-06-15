const SafetyGuideline = require('../models/SafetyGuideline');

// 1. Create Guideline
const createGuideline = async (req, res) => {
  try {
    const { title, content, status } = req.body;
    const newGuideline = new SafetyGuideline({ title, content, status });
    await newGuideline.save();
    res.status(201).json(newGuideline);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. Get All Guidelines (For Admin - Includes active and deactive)
const getAllGuidelines = async (req, res) => {
  try {
    const guidelines = await SafetyGuideline.find().sort({ createdAt: -1 });
    res.json(guidelines);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. Get Active Guidelines (For the public/frontend landing home page)
const getActiveGuidelines = async (req, res) => {
  try {
    const activeGuidelines = await SafetyGuideline.find({ status: 'active' }).sort({ createdAt: -1 });
    res.json(activeGuidelines);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. Update Guideline (Edit Title, Content, or Status)
const updateGuideline = async (req, res) => {
  try {
    const { title, content, status } = req.body;
    const updated = await SafetyGuideline.findByIdAndUpdate(
      req.params.id,
      { title, content, status },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: 'Guideline not found' });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 5. Delete Guideline
const deleteGuideline = async (req, res) => {
  try {
    const deleted = await SafetyGuideline.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Guideline not found' });
    res.json({ message: 'Guideline deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createGuideline,
  getAllGuidelines,
  getActiveGuidelines,
  updateGuideline,
  deleteGuideline
};