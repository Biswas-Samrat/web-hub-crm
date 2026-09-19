require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Client = require('../models/Client');
const { connectDB, disconnectDB } = require('../config/database');

const adminUser = {
  name: 'Web Hub Admin',
  email: 'admin@webhub.com',
  password: 'Admin123!',
  role: 'admin',
};

const now = new Date();
const daysAgo = (n) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000);
const daysFromNow = (n) => new Date(now.getTime() + n * 24 * 60 * 60 * 1000);

const getSeedClients = (userId) => [
  {
    userId,
    businessName: 'ABC Cleaning Services',
    contactName: 'Sarah Johnson',
    facebookUrl: 'https://facebook.com/abccleaningservices',
    country: 'United Kingdom',
    city: 'London',
    category: 'Cleaning',
    status: 'Positive Reply',
    responseType: 'Interested',
    tags: ['UK', 'Cleaning', 'High Potential'],
    notes: 'Very interested. Said they have been looking for a new website for months. Budget seems good.',
    proposalSentAt: daysAgo(5),
    firstContactAt: daysAgo(5),
    lastContactAt: daysAgo(1),
    followUpAt: daysFromNow(2),
    activityLog: [
      { type: 'Client Created', message: 'Client added to CRM.', createdAt: daysAgo(5) },
      { type: 'Proposal Sent', message: 'Website proposal sent via Messenger.', createdAt: daysAgo(5) },
      { type: 'Client Replied', message: 'Client replied positively. Very interested.', createdAt: daysAgo(1) },
      { type: 'Follow-Up Scheduled', message: `Follow-up scheduled for ${daysFromNow(2).toLocaleDateString()}.`, createdAt: daysAgo(1) },
    ],
  },
  {
    userId,
    businessName: 'The Italian Kitchen Restaurant',
    contactName: 'Marco Rossi',
    facebookUrl: 'https://facebook.com/theitalianktichen',
    email: 'marco@italiankitchen.co.uk',
    country: 'United Kingdom',
    city: 'Manchester',
    category: 'Restaurant',
    status: 'Demo Liked',
    responseType: 'Likes Demo',
    tags: ['UK', 'Restaurant', 'Demo'],
    notes: 'Demo sent. Client loves the design. Currently negotiating price — they want £300, I quoted £450.',
    proposalSentAt: daysAgo(18),
    firstContactAt: daysAgo(18),
    lastContactAt: daysAgo(2),
    followUpAt: daysFromNow(1),
    demo: {
      requested: true,
      url: 'https://italian-kitchen-demo.netlify.app',
      name: 'Italian Kitchen Demo',
      status: 'Liked',
      feedback: 'Love the design! Can we change the color to darker green?',
      createdAt: daysAgo(8),
      sentAt: daysAgo(5),
    },
    activityLog: [
      { type: 'Client Created', message: 'Client added to CRM.', createdAt: daysAgo(18) },
      { type: 'Proposal Sent', message: 'Proposal sent via Messenger.', createdAt: daysAgo(18) },
      { type: 'Client Replied', message: 'Client interested. Asked for a demo.', createdAt: daysAgo(12) },
      { type: 'Demo Created', message: 'Demo website created: Italian Kitchen Demo.', createdAt: daysAgo(8) },
      { type: 'Demo Sent', message: 'Demo website sent to client.', createdAt: daysAgo(5) },
      { type: 'Demo Feedback', message: 'Client loved the demo. Requesting minor color change.', createdAt: daysAgo(2) },
      { type: 'Follow-Up Scheduled', message: `Follow-up scheduled for tomorrow.`, createdAt: daysAgo(2) },
    ],
  },
  {
    userId,
    businessName: 'FastFix Plumbing',
    contactName: 'Dave Wilson',
    facebookUrl: 'https://facebook.com/fastfixplumbing',
    phone: '+44 7700 900123',
    country: 'United Kingdom',
    city: 'Birmingham',
    category: 'Plumbing',
    status: 'Vacation',
    responseType: 'Vacation',
    tags: ['UK', 'Plumbing', 'Follow Later'],
    notes: 'Dave said he is on holiday until 5th October. Told me to contact him after that.',
    proposalSentAt: daysAgo(7),
    firstContactAt: daysAgo(7),
    lastContactAt: daysAgo(7),
    followUpAt: daysFromNow(16),
    activityLog: [
      { type: 'Client Created', message: 'Client added to CRM.', createdAt: daysAgo(7) },
      { type: 'Proposal Sent', message: 'Proposal sent via Messenger.', createdAt: daysAgo(7) },
      { type: 'Client Replied', message: 'Client replied — on vacation. Will be back in 3 weeks.', createdAt: daysAgo(7) },
      { type: 'Follow-Up Scheduled', message: `Follow-up scheduled for when they return from vacation.`, createdAt: daysAgo(7) },
    ],
  },
  {
    userId,
    businessName: 'Green Thumb Landscaping',
    contactName: 'James Carter',
    facebookUrl: 'https://facebook.com/greenthumblandscaping',
    email: 'james@greenthumb.co.uk',
    website: 'https://greenthumblandscaping.co.uk',
    country: 'United Kingdom',
    city: 'Bristol',
    category: 'Landscaping',
    status: 'Ongoing Project',
    responseType: 'Ready to Start',
    tags: ['UK', 'Landscaping'],
    notes: 'Project started. Building a portfolio website with gallery and contact form.',
    proposalSentAt: daysAgo(30),
    firstContactAt: daysAgo(30),
    lastContactAt: daysAgo(3),
    project: {
      status: 'In Development',
      name: 'Green Thumb Landscaping Website',
      price: 550,
      currency: 'GBP',
      startDate: daysAgo(10),
      targetDate: daysFromNow(14),
      paymentStatus: 'Deposit Paid',
    },
    activityLog: [
      { type: 'Client Created', message: 'Client added to CRM.', createdAt: daysAgo(30) },
      { type: 'Proposal Sent', message: 'Proposal sent via Messenger.', createdAt: daysAgo(30) },
      { type: 'Client Replied', message: 'Client very interested. Ready to start.', createdAt: daysAgo(20) },
      { type: 'Price Discussed', message: 'Agreed on £550. Deposit paid.', createdAt: daysAgo(12) },
      { type: 'Project Started', message: 'Project started: Green Thumb Landscaping Website.', createdAt: daysAgo(10) },
      { type: 'Client Converted', message: 'Lead converted to active project.', createdAt: daysAgo(10) },
    ],
  },
  {
    userId,
    businessName: 'Happy Paws Dog Walking',
    contactName: 'Emma Thompson',
    facebookUrl: 'https://facebook.com/happypawsdogwalking',
    email: 'emma@happypaws.co.uk',
    website: 'https://happypawswalking.co.uk',
    country: 'United Kingdom',
    city: 'Leeds',
    category: 'Pet Services',
    status: 'Website Delivered',
    responseType: 'Ready to Start',
    tags: ['UK', 'Pet Services'],
    notes: 'Website delivered and live. Emma very happy with result.',
    proposalSentAt: daysAgo(60),
    firstContactAt: daysAgo(60),
    lastContactAt: daysAgo(5),
    project: {
      status: 'Delivered',
      name: 'Happy Paws Dog Walking Website',
      price: 400,
      currency: 'GBP',
      startDate: daysAgo(40),
      targetDate: daysAgo(10),
      deliveryDate: daysAgo(5),
      paymentStatus: 'Paid',
      liveUrl: 'https://happypawswalking.co.uk',
    },
    activityLog: [
      { type: 'Client Created', message: 'Client added to CRM.', createdAt: daysAgo(60) },
      { type: 'Proposal Sent', message: 'Proposal sent via Messenger.', createdAt: daysAgo(60) },
      { type: 'Project Started', message: 'Project started.', createdAt: daysAgo(40) },
      { type: 'Website Delivered', message: 'Website delivered and gone live.', createdAt: daysAgo(5) },
      { type: 'Payment Received', message: 'Full payment of £400 received.', createdAt: daysAgo(4) },
    ],
  },
  {
    userId,
    businessName: 'Glamour Hair Studio',
    contactName: 'Lisa Chen',
    facebookUrl: 'https://facebook.com/glamourhairstudio',
    country: 'United Kingdom',
    city: 'London',
    category: 'Hair & Beauty',
    status: 'Project Completed',
    responseType: 'Ready to Start',
    tags: ['UK', 'Beauty', 'Returning Client'],
    notes: 'First project completed. Lisa very happy. May want a 2nd website for a new location.',
    proposalSentAt: daysAgo(90),
    firstContactAt: daysAgo(90),
    lastContactAt: daysAgo(15),
    project: {
      status: 'Completed',
      name: 'Glamour Hair Studio Website',
      price: 480,
      currency: 'GBP',
      startDate: daysAgo(70),
      targetDate: daysAgo(30),
      deliveryDate: daysAgo(20),
      paymentStatus: 'Paid',
      liveUrl: 'https://glamourhairstudio.co.uk',
      clientFeedback: 'Absolutely love the website. Very professional!',
    },
    activityLog: [
      { type: 'Client Created', message: 'Client added to CRM.', createdAt: daysAgo(90) },
      { type: 'Project Started', message: 'Project started.', createdAt: daysAgo(70) },
      { type: 'Website Delivered', message: 'Website delivered.', createdAt: daysAgo(20) },
      { type: 'Payment Received', message: 'Full payment received.', createdAt: daysAgo(18) },
      { type: 'Status Changed', message: 'Project marked as completed.', createdAt: daysAgo(15) },
    ],
  },
  {
    userId,
    businessName: 'Top Notch Roofing',
    contactName: 'Mike Harris',
    facebookUrl: 'https://facebook.com/topnotchroofing',
    country: 'United Kingdom',
    city: 'Sheffield',
    category: 'Roofing',
    status: 'No Response',
    responseType: 'No Response',
    tags: ['UK', 'Roofing'],
    notes: 'Sent proposal 2 weeks ago. No reply yet. Will try one more follow-up.',
    proposalSentAt: daysAgo(14),
    firstContactAt: daysAgo(14),
    followUpAt: daysAgo(1), // Overdue!
    activityLog: [
      { type: 'Client Created', message: 'Client added to CRM.', createdAt: daysAgo(14) },
      { type: 'Proposal Sent', message: 'Proposal sent via Messenger.', createdAt: daysAgo(14) },
      { type: 'Follow-Up Scheduled', message: 'Follow-up scheduled after 2 weeks.', createdAt: daysAgo(14) },
    ],
  },
  {
    userId,
    businessName: 'Spotless Housekeeping',
    contactName: 'Anna Brown',
    facebookUrl: 'https://facebook.com/spotlesshousekeeping',
    country: 'United Kingdom',
    city: 'Edinburgh',
    category: 'Cleaning',
    status: 'Not Interested',
    responseType: 'Not Interested',
    tags: ['UK', 'Cleaning'],
    notes: 'Said they already have someone building their website.',
    proposalSentAt: daysAgo(10),
    firstContactAt: daysAgo(10),
    lastContactAt: daysAgo(10),
    activityLog: [
      { type: 'Client Created', message: 'Client added to CRM.', createdAt: daysAgo(10) },
      { type: 'Proposal Sent', message: 'Proposal sent via Messenger.', createdAt: daysAgo(10) },
      { type: 'Client Replied', message: 'Client not interested — already has a developer.', createdAt: daysAgo(10) },
      { type: 'Status Changed', message: 'Status set to Not Interested.', createdAt: daysAgo(10) },
    ],
  },
  {
    userId,
    businessName: 'Natural Beauty Spa',
    contactName: 'Priya Patel',
    facebookUrl: 'https://facebook.com/naturalbeautyspa',
    country: 'United Kingdom',
    city: 'Leicester',
    category: 'Beauty',
    status: 'Interested in a Few Months',
    responseType: 'Maybe Later',
    tags: ['UK', 'Beauty', 'Follow Later'],
    notes: 'Priya said they are interested but want to wait until after Christmas when business picks up.',
    proposalSentAt: daysAgo(3),
    firstContactAt: daysAgo(3),
    lastContactAt: daysAgo(3),
    followUpAt: daysFromNow(60),
    activityLog: [
      { type: 'Client Created', message: 'Client added to CRM.', createdAt: daysAgo(3) },
      { type: 'Proposal Sent', message: 'Proposal sent via Messenger.', createdAt: daysAgo(3) },
      { type: 'Client Replied', message: 'Interested but wants to wait 2 months.', createdAt: daysAgo(3) },
      { type: 'Follow-Up Scheduled', message: `Follow-up scheduled in 2 months.`, createdAt: daysAgo(3) },
    ],
  },
  {
    userId,
    businessName: 'Premier Electrical Services',
    contactName: 'Tom Davies',
    facebookUrl: 'https://facebook.com/premierelectricalservices',
    country: 'United Kingdom',
    city: 'Cardiff',
    category: 'Electrical',
    status: 'Awaiting Reply',
    responseType: 'No Response',
    tags: ['UK', 'Trades'],
    notes: 'Sent proposal yesterday. Waiting for reply.',
    proposalSentAt: daysAgo(1),
    firstContactAt: daysAgo(1),
    followUpAt: daysFromNow(5),
    activityLog: [
      { type: 'Client Created', message: 'Client added to CRM.', createdAt: daysAgo(1) },
      { type: 'Proposal Sent', message: 'Proposal sent via Messenger.', createdAt: daysAgo(1) },
      { type: 'Follow-Up Scheduled', message: 'Follow-up scheduled in 5 days if no reply.', createdAt: daysAgo(1) },
    ],
  },
];

const seed = async () => {
  try {
    console.log('🌱 Starting database seed...\n');

    await connectDB();

    // Check if admin exists
    let user = await User.findOne({ email: adminUser.email });

    if (!user) {
      console.log('Creating admin user...');
      user = await User.create(adminUser);
      console.log(`✅ Admin created: ${adminUser.email} / ${adminUser.password}\n`);
    } else {
      console.log(`ℹ️  Admin already exists: ${adminUser.email}\n`);
    }

    // Remove existing seed clients
    await Client.deleteMany({ userId: user._id });
    console.log('🗑️  Cleared existing clients.\n');

    // Insert seed clients
    const clients = getSeedClients(user._id);
    await Client.insertMany(clients);
    console.log(`✅ Seeded ${clients.length} demo clients.\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 Seed complete!');
    console.log('');
    console.log('  Login: admin@webhub.com');
    console.log('  Password: Admin123!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Seed failed:', error.message);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
};

seed();
