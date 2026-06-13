const axios = require('axios');

const client = axios.create({
  baseURL: process.env.WATI_API_ENDPOINT,
  headers: {
    Authorization: `Bearer ${process.env.WATI_ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

async function sendTemplateMessage(phone, templateName, parameters = []) {
  const e164 = phone.replace(/\D/g, '');
  try {
    const res = await client.post(`/api/v1/sendTemplateMessage?whatsappNumber=${e164}`, {
      template_name: templateName,
      broadcast_name: templateName,
      parameters,
    });
    return res;
  } catch (err) {
    const status = err.response?.status;
    const data   = JSON.stringify(err.response?.data);
    console.error(`[WATI] ${templateName} → ${phone} failed: HTTP ${status} — ${data}`);
    throw err;
  }
}

async function sendSiteVisitOtp(phone, otp) {
  return sendTemplateMessage(phone, 'site_visit_otp', [
    { name: '1', value: String(otp) },
  ]);
}

async function sendLeadAssignedNotice(phone, partnerName) {
  return sendTemplateMessage(phone, 'lead_assigned_notice', [
    { name: 'partner_name', value: partnerName },
  ]);
}

async function sendBuyerFeedbackRequest(phone, partnerName) {
  return sendTemplateMessage(phone, 'buyer_feedback_request', [
    { name: 'partner_name', value: partnerName },
  ]);
}

async function sendPhoneVerificationOtp(phone, otp) {
  return sendTemplateMessage(phone, 'phone_verification_otp', [
    { name: '1', value: String(otp) },
  ]);
}

module.exports = {
  sendSiteVisitOtp,
  sendLeadAssignedNotice,
  sendBuyerFeedbackRequest,
  sendPhoneVerificationOtp,
};
