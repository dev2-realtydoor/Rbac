const { createClerkClient } = require('@clerk/clerk-sdk-node');

const clerkAdmin = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

async function setUserRole(clerkId, role) {
  return clerkAdmin.users.updateUserMetadata(clerkId, { publicMetadata: { role } });
}

async function getClerkUser(clerkId) {
  return clerkAdmin.users.getUser(clerkId);
}

module.exports = { clerkAdmin, setUserRole, getClerkUser };
