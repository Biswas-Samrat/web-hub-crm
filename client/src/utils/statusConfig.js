// ─── Status config: colors, labels, groups ────────────────────────────────────

export const STATUS_CONFIG = {
  'New Lead': { color: 'bg-slate-100 text-slate-700', dot: 'bg-slate-400', group: 'lead' },
  'Proposal Sent': { color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500', group: 'lead' },
  'Awaiting Reply': { color: 'bg-sky-100 text-sky-700', dot: 'bg-sky-500', group: 'lead' },
  'No Response': { color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400', group: 'lead' },
  'Positive Reply': { color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500', group: 'positive' },
  'Interested': { color: 'bg-green-100 text-green-700', dot: 'bg-green-500', group: 'positive' },
  'Follow Up Later': { color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500', group: 'followup' },
  'Vacation': { color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-400', group: 'followup' },
  'Busy': { color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500', group: 'followup' },
  'Contact Me Later': { color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500', group: 'followup' },
  'Interested in a Few Weeks': { color: 'bg-lime-100 text-lime-700', dot: 'bg-lime-500', group: 'followup' },
  'Interested in a Few Months': { color: 'bg-lime-100 text-lime-700', dot: 'bg-lime-600', group: 'followup' },
  'Interested Next Year': { color: 'bg-teal-100 text-teal-700', dot: 'bg-teal-500', group: 'followup' },
  'Demo Requested': { color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500', group: 'demo' },
  'Demo In Progress': { color: 'bg-violet-100 text-violet-700', dot: 'bg-violet-500', group: 'demo' },
  'Demo Sent': { color: 'bg-indigo-100 text-indigo-700', dot: 'bg-indigo-500', group: 'demo' },
  'Demo Liked': { color: 'bg-fuchsia-100 text-fuchsia-700', dot: 'bg-fuchsia-500', group: 'demo' },
  'Negotiating': { color: 'bg-pink-100 text-pink-700', dot: 'bg-pink-500', group: 'demo' },
  'Ready to Start': { color: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-600', group: 'project' },
  'Ongoing Project': { color: 'bg-brand-100 text-brand-700', dot: 'bg-brand-600', group: 'project' },
  'Website Delivered': { color: 'bg-cyan-100 text-cyan-700', dot: 'bg-cyan-600', group: 'project' },
  'Project Completed': { color: 'bg-emerald-200 text-emerald-800', dot: 'bg-emerald-700', group: 'completed' },
  'Not Interested': { color: 'bg-red-100 text-red-600', dot: 'bg-red-400', group: 'lost' },
  'Lost': { color: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400', group: 'lost' },
  'Do Not Contact': { color: 'bg-red-200 text-red-700', dot: 'bg-red-600', group: 'lost' },
};

export const RESPONSE_TYPE_CONFIG = {
  'Interested': { color: 'bg-emerald-100 text-emerald-700' },
  'Maybe Later': { color: 'bg-amber-100 text-amber-700' },
  'Busy': { color: 'bg-yellow-100 text-yellow-700' },
  'Vacation': { color: 'bg-orange-100 text-orange-700' },
  'Contact Later': { color: 'bg-blue-100 text-blue-700' },
  'Wants Demo': { color: 'bg-purple-100 text-purple-700' },
  'Likes Demo': { color: 'bg-fuchsia-100 text-fuchsia-700' },
  'Asked About Price': { color: 'bg-pink-100 text-pink-700' },
  'Asked About Features': { color: 'bg-indigo-100 text-indigo-700' },
  'Asked for More Information': { color: 'bg-sky-100 text-sky-700' },
  'Ready to Start': { color: 'bg-emerald-100 text-emerald-800' },
  'Not Interested': { color: 'bg-red-100 text-red-600' },
  'No Response': { color: 'bg-gray-100 text-gray-500' },
  'Other': { color: 'bg-surface-100 text-surface-600' },
};

export const PROJECT_STATUS_CONFIG = {
  'Not Started': { color: 'bg-gray-100 text-gray-600' },
  'Planning': { color: 'bg-blue-100 text-blue-700' },
  'In Development': { color: 'bg-brand-100 text-brand-700' },
  'Waiting for Client': { color: 'bg-amber-100 text-amber-700' },
  'Revision': { color: 'bg-orange-100 text-orange-700' },
  'Ready for Delivery': { color: 'bg-emerald-100 text-emerald-700' },
  'Delivered': { color: 'bg-cyan-100 text-cyan-700' },
  'Completed': { color: 'bg-emerald-200 text-emerald-800' },
  'Cancelled': { color: 'bg-red-100 text-red-600' },
};

export const PAYMENT_STATUS_CONFIG = {
  'Not Discussed': { color: 'bg-gray-100 text-gray-600' },
  'Pending': { color: 'bg-amber-100 text-amber-700' },
  'Deposit Paid': { color: 'bg-blue-100 text-blue-700' },
  'Partially Paid': { color: 'bg-indigo-100 text-indigo-700' },
  'Paid': { color: 'bg-emerald-100 text-emerald-700' },
  'Overdue': { color: 'bg-red-100 text-red-600' },
};

// ─── Enums for forms ───────────────────────────────────────────────────────────
export const CLIENT_STATUSES = [
  'New Lead', 'Proposal Sent', 'Awaiting Reply', 'No Response', 'Positive Reply',
  'Interested', 'Follow Up Later', 'Vacation', 'Busy', 'Contact Me Later',
  'Interested in a Few Weeks', 'Interested in a Few Months', 'Interested Next Year',
  'Demo Requested', 'Demo In Progress', 'Demo Sent', 'Demo Liked', 'Negotiating',
  'Ready to Start', 'Ongoing Project', 'Website Delivered', 'Project Completed',
  'Not Interested', 'Lost', 'Do Not Contact',
];

export const RESPONSE_TYPES = [
  'Interested', 'Maybe Later', 'Busy', 'Vacation', 'Contact Later',
  'Wants Demo', 'Likes Demo', 'Asked About Price', 'Asked About Features',
  'Asked for More Information', 'Ready to Start', 'Not Interested', 'No Response', 'Other',
];

export const DEMO_STATUSES = [
  'Not Requested', 'Requested', 'In Progress', 'Ready', 'Sent',
  'Viewed', 'Liked', 'Revision Requested', 'Rejected',
];

export const PROJECT_STATUSES = [
  'Not Started', 'Planning', 'In Development', 'Waiting for Client',
  'Revision', 'Ready for Delivery', 'Delivered', 'Completed', 'Cancelled',
];

export const PAYMENT_STATUSES = [
  'Not Discussed', 'Pending', 'Deposit Paid', 'Partially Paid', 'Paid', 'Overdue',
];

export const ACTIVITY_TYPES = [
  'Proposal Sent', 'Client Replied', 'Follow-Up Scheduled', 'Follow-Up Completed',
  'Demo Created', 'Demo Sent', 'Demo Feedback', 'Price Discussed', 'Negotiation',
  'Project Started', 'Website Delivered', 'Payment Received', 'Status Changed',
  'Note Added', 'Client Created', 'Client Converted', 'Other',
];

export const CATEGORIES = [
  'Cleaning', 'Restaurant', 'Plumbing', 'Roofing', 'Hair & Beauty', 'Landscaping',
  'Housekeeping', 'Pet Services', 'Beauty', 'Electrical', 'Painting', 'Carpentry',
  'HVAC', 'Pest Control', 'Security', 'Flooring', 'Windows & Doors', 'Fencing',
  'Decorating', 'Construction', 'Removals', 'Taxi & Transport', 'Fitness', 'Tutoring',
  'Photography', 'Catering', 'Events', 'Childcare', 'Accountancy', 'Legal',
  'Healthcare', 'Dental', 'Optician', 'Veterinary', 'Real Estate', 'Other',
];

export const CURRENCIES = ['GBP', 'USD', 'EUR', 'CAD', 'AUD', 'NZD', 'ZAR'];
