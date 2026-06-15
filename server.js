const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const cron = require('node-cron');
const FoodListing = require('./models/FoodListing');
const Notification = require('./models/Notification');

dotenv.config();
connectDB();

const app = express();
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://your-frontend-name.vercel.app"
    ],
    credentials: true
  })
);
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/food', require('./routes/foodRoutes'));
app.use('/api/pickup', require('./routes/pickupRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

app.use("/api/drivers",   require("./routes/driverRoutes"));
app.use("/api/donations", require("./routes/donationRoutes"));


// Cron job — check expiring food every hour
cron.schedule('0 * * * *', async () => {
  const soon = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const expiring = await FoodListing.find({
    status: 'available',
    expiryDate: { $lte: soon }
  }).populate('donor');

  for (const listing of expiring) {
    await Notification.create({
      user: listing.donor._id,
      message: `Your food listing "${listing.foodName}" is expiring soon!`,
      type: 'warning'
    });
  }
  console.log(`Expiry check done: ${expiring.length} listings flagged`);
});

app.get('/', (req, res) => res.send('FoodSave API is running...'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));