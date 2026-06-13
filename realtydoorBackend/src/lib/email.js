const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM;

async function send({ to, subject, html }) {
  return resend.emails.send({ from: FROM, to, subject, html });
}

async function sendLeadAssigned(email, { buyerName, propertyTitle }) {
  return send({
    to: email,
    subject: `New Lead Assigned — ${propertyTitle}`,
    html: `<p>A new lead from <strong>${buyerName}</strong> has been assigned to you for <strong>${propertyTitle}</strong>. Log in to your Partner panel to view details.</p>`,
  });
}

async function sendPropertyApproved(email, propertyTitle) {
  return send({
    to: email,
    subject: `Your listing "${propertyTitle}" is live!`,
    html: `<p>Great news! Your property listing <strong>${propertyTitle}</strong> has been approved and is now visible to buyers.</p>`,
  });
}

async function sendPropertyRejected(email, propertyTitle, note) {
  return send({
    to: email,
    subject: `Action required: "${propertyTitle}" needs changes`,
    html: `<p>Your listing <strong>${propertyTitle}</strong> was not approved. Admin note: <em>${note}</em></p>`,
  });
}

async function sendKycVerified(email) {
  return send({
    to: email,
    subject: 'Account Verified — Welcome to RealtyDoor!',
    html: `<p>Your KYC has been verified. You can now list properties and receive leads.</p>`,
  });
}

async function sendServiceActivated(email, serviceName) {
  return send({
    to: email,
    subject: `Service Activated — ${serviceName}`,
    html: `<p>Your <strong>${serviceName}</strong> subscription is now active. Raise tickets from your dashboard anytime.</p>`,
  });
}

module.exports = {
  sendLeadAssigned,
  sendPropertyApproved,
  sendPropertyRejected,
  sendKycVerified,
  sendServiceActivated,
};
