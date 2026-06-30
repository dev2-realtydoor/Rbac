/**
 * RealtyDoor — Comprehensive Seed Script
 *
 * Run: node prisma/seed.js
 *
 * Creates enough data to exercise every GET endpoint in the API.
 *
 * IMPORTANT: Replace the CLERK_ID constants with real Clerk user IDs from your
 * Clerk dashboard before testing authenticated endpoints.
 *
 * Seed is fully idempotent — safe to run multiple times.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ─── Clerk IDs — replace with real IDs from your Clerk dashboard ─────────────
const ADMIN_CLERK_ID    = 'user_seed_admin_001';
const PARTNER_CLERK_ID  = 'user_seed_partner_001';  // KYC: VERIFIED
const PARTNER2_CLERK_ID = 'user_seed_partner_002';  // KYC: PENDING_REVIEW
const USER_CLERK_ID     = 'user_seed_user_001';
const USER2_CLERK_ID    = 'user_seed_user_002';
// ─────────────────────────────────────────────────────────────────────────────

const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

async function main() {
  console.log('🌱  Starting seed...\n');

  // ── 1. Users ──────────────────────────────────────────────────────────────

  const admin = await prisma.user.upsert({
    where:  { email: 'admin@realtydoor.com' },
    update: { clerkId: ADMIN_CLERK_ID, role: 'ADMIN' },
    create: {
      clerkId: ADMIN_CLERK_ID, name: 'Admin User',
      email: 'admin@realtydoor.com', phone: '+919000000001',
      phoneVerified: true, role: 'ADMIN',
    },
  });
  console.log(`✅  Admin    : ${admin.email}  (id: ${admin.id})`);

  // Partner 1 — KYC verified, active listings
  const partner = await prisma.user.upsert({
    where:  { email: 'partner@realtydoor.com' },
    update: { clerkId: PARTNER_CLERK_ID },
    create: {
      clerkId: PARTNER_CLERK_ID, name: 'Rajdeep Kumar',
      email: 'partner@realtydoor.com', phone: '+919000000002',
      phoneVerified: true, role: 'PARTNER', partnerSubType: 'AGENT',
      companyName: 'RealtyPro Solutions',
      bio: '10 years of experience in Pune real estate market.',
      websiteUrl: 'https://realtypro.in',
      kycStatus: 'VERIFIED', kycVerifiedAt: new Date('2024-01-05'),
      kycDocumentUrls: ['https://example.com/kyc/pan.pdf', 'https://example.com/kyc/aadhar.pdf'],
    },
  });
  console.log(`✅  Partner1 : ${partner.email}  (id: ${partner.id})`);

  // Partner 2 — KYC pending (admin /kyc queue)
  const partner2 = await prisma.user.upsert({
    where:  { email: 'partner2@realtydoor.com' },
    update: { clerkId: PARTNER2_CLERK_ID },
    create: {
      clerkId: PARTNER2_CLERK_ID, name: 'Priya Sharma',
      email: 'partner2@realtydoor.com', phone: '+919000000004',
      phoneVerified: true, role: 'PARTNER', partnerSubType: 'BUILDER',
      companyName: 'Sharma Constructions',
      bio: 'RERA-registered builder with 50+ projects in Maharashtra.',
      kycStatus: 'PENDING_REVIEW',
      kycDocumentUrls: ['https://example.com/kyc/rera.pdf', 'https://example.com/kyc/gst.pdf'],
    },
  });
  console.log(`✅  Partner2 : ${partner2.email}  (id: ${partner2.id})`);

  // Buyer 1
  const user = await prisma.user.upsert({
    where:  { email: 'user@realtydoor.com' },
    update: { clerkId: USER_CLERK_ID },
    create: {
      clerkId: USER_CLERK_ID, name: 'Suresh Mehta',
      email: 'user@realtydoor.com', phone: '+919000000003',
      phoneVerified: true, role: 'USER',
    },
  });
  console.log(`✅  User1    : ${user.email}  (id: ${user.id})`);

  // Buyer 2
  const user2 = await prisma.user.upsert({
    where:  { email: 'user2@realtydoor.com' },
    update: { clerkId: USER2_CLERK_ID },
    create: {
      clerkId: USER2_CLERK_ID, name: 'Anita Joshi',
      email: 'user2@realtydoor.com', phone: '+919000000005',
      phoneVerified: true, role: 'USER',
    },
  });
  console.log(`✅  User2    : ${user2.email}  (id: ${user2.id})`);

  // ── 2. Services ───────────────────────────────────────────────────────────

  const serviceList = [
    {
      name: 'Maintenance Premium', shortDesc: 'Annual home maintenance package',
      description: 'Comprehensive AMC covering plumbing, electrical, carpentry, painting, and pest control. Includes 4 scheduled visits per year plus on-demand support.',
      price: 4999, category: 'MAINTENANCE', sortOrder: 1,
      features: ['4 Scheduled Visits/Year', 'Plumbing & Electrical', 'Carpentry & Painting', 'Pest Control', '24x7 Emergency Helpline'],
      imageUrl: 'https://cdn.realtydoor.in/services/maintenance.jpg',
    },
    {
      name: 'Legal Assistance', shortDesc: 'Property documentation and legal support',
      description: 'End-to-end legal support including agreement drafting, title verification, registration assistance, and due diligence.',
      price: 9999, category: 'LEGAL', sortOrder: 2,
      features: ['Agreement Drafting', 'Title Verification', 'Registration Assistance', 'Due Diligence Report', 'Dedicated Legal Expert'],
      imageUrl: 'https://cdn.realtydoor.in/services/legal.jpg',
    },
    {
      name: 'Home Loan Assistance', shortDesc: 'Dedicated loan processing support',
      description: 'Dedicated support from loan experts to compare offers from 10+ banks, prepare documents, and track your application.',
      price: 2999, category: 'LOAN', sortOrder: 3,
      features: ['10+ Bank Comparisons', 'Document Preparation', 'Application Tracking', 'Dedicated Loan Manager', 'Best Rate Guarantee'],
      imageUrl: 'https://cdn.realtydoor.in/services/loan.jpg',
    },
    {
      name: 'Interior Design Consultation', shortDesc: '1-on-1 interior design session',
      description: 'A 2-hour virtual consultation with an experienced interior designer. Get layout plans, material suggestions, and a budget estimate.',
      price: 1499, category: 'CONSTRUCTION', sortOrder: 4,
      features: ['2-Hour Virtual Session', 'Layout Plan', 'Material Suggestions', 'Budget Estimate', 'Follow-up Report'],
      imageUrl: 'https://cdn.realtydoor.in/services/interior.jpg',
    },
    {
      name: 'Property Valuation Report', shortDesc: 'Certified market valuation',
      description: 'Certified property valuation report by a RICS-accredited valuer. Includes comparable sales analysis, condition report, and official stamp.',
      price: 3499, category: 'VALUATION', sortOrder: 5,
      features: ['RICS-Accredited Valuer', 'Comparable Sales Analysis', 'Condition Report', 'Official Stamp', '5-Business-Day Delivery'],
      imageUrl: 'https://cdn.realtydoor.in/services/valuation.jpg',
    },
  ];

  const services = [];
  for (const svc of serviceList) {
    let s = await prisma.service.findFirst({ where: { name: svc.name } });
    if (!s) { s = await prisma.service.create({ data: svc }); console.log(`✅  Service  : ${svc.name}`); }
    else { console.log(`⏭   Service  : ${svc.name}`); }
    services.push(s);
  }

  // ── 3. Properties ─────────────────────────────────────────────────────────

  const propertyDefs = [
    // APPROVED — Baner 3BHK (primary test property)
    {
      slug: 'skyline-heights-3bhk-baner-seed',
      title: '3 BHK Flat in Baner',
      description: 'Spacious 3 BHK apartment in the heart of Baner with premium amenities, ample parking, and excellent connectivity to Hinjewadi IT Park. Ready to move in.',
      propertyType: 'FLAT', listingType: 'SALE', propertyStatus: 'READY_TO_MOVE', publishStatus: 'APPROVED',
      price: 8500000, priceNegotiable: true, bhk: 3, bathrooms: 2,
      carpetArea: 1200, builtUpArea: 1450, floorNumber: 4, totalFloors: 12,
      ageOfProperty: 2, furnishing: 'Semi-Furnished', facing: 'East',
      address: 'Skyline Heights, Plot 12, Baner Road',
      locality: 'Baner', city: 'Pune', state: 'Maharashtra', pincode: '411045',
      latitude: 18.5596, longitude: 73.7769,
      reraNumber: 'P52100012345', bankApprovals: ['SBI', 'HDFC', 'ICICI'],
      nearbyLandmarks: ['D-Mart Baner', 'Orchid School', 'Baner Metro Station'],
      images: [
        'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800',
        'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
        'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=800',
      ],
      amenities: ['Gymnasium', 'Swimming Pool', '24x7 Security', 'CCTV', 'Power Backup'],
      societyFeatures: ['Club House', "Children's Play Area", 'Jogging Track', 'Visitor Parking'],
      isFeatured: true, isVerified: true, partnerId: partner.id,
    },
    // APPROVED — Kothrud 2BHK rent
    {
      slug: 'green-valley-2bhk-kothrud-rent-seed',
      title: '2 BHK Flat for Rent in Kothrud',
      description: 'Well-maintained 2 BHK in a prime Kothrud location, close to major schools. Ideal for families or working professionals.',
      propertyType: 'FLAT', listingType: 'RENT', propertyStatus: 'READY_TO_MOVE', publishStatus: 'APPROVED',
      monthlyRent: 25000, bhk: 2, bathrooms: 2,
      carpetArea: 850, builtUpArea: 1050, floorNumber: 2, totalFloors: 6,
      ageOfProperty: 5, furnishing: 'Furnished', facing: 'West',
      address: 'Green Valley Apartments, Karve Road',
      locality: 'Kothrud', city: 'Pune', state: 'Maharashtra', pincode: '411038',
      nearbyLandmarks: ['Kothrud Bus Depot', 'Symbiosis College', 'D-Mart Kothrud'],
      images: [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      ],
      amenities: ['Lift', '24x7 Security', 'Power Backup'],
      societyFeatures: ['Terrace Garden', 'Visitor Parking'],
      isVerified: true, partnerId: partner.id,
    },
    // APPROVED — Hinjewadi commercial
    {
      slug: 'hinjewadi-office-phase1-lease-seed',
      title: 'Commercial Office Space in Hinjewadi',
      description: 'Ready-to-use commercial office in Rajiv Gandhi IT Park Phase 1. High-speed fibre, modular workstations included.',
      propertyType: 'COMMERCIAL_OFFICE', listingType: 'LEASE', propertyStatus: 'READY_TO_MOVE', publishStatus: 'APPROVED',
      monthlyRent: 85000, carpetArea: 1500, builtUpArea: 1800,
      floorNumber: 7, totalFloors: 10, furnishing: 'Fully Furnished',
      address: 'Rajiv Gandhi IT Park, Phase 1',
      locality: 'Hinjewadi', city: 'Pune', state: 'Maharashtra', pincode: '411057',
      latitude: 18.5931, longitude: 73.7382,
      nearbyLandmarks: ['Infosys Campus', 'Wipro Gate', 'Hinjewadi Bridge'],
      images: [
        'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
        'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800',
      ],
      amenities: ['High-Speed Internet', 'Conference Room', 'Cafeteria', '24x7 Security', 'Power Backup', 'Parking'],
      isFeatured: true, partnerId: partner.id,
    },
    // APPROVED — Aundh 4BHK house
    {
      slug: 'independent-house-4bhk-aundh-seed',
      title: '4 BHK Independent House in Aundh',
      description: "Stunning 4 BHK bungalow in Aundh. Private garden, rooftop terrace, and 2-car garage.",
      propertyType: 'INDEPENDENT_HOUSE', listingType: 'SALE', propertyStatus: 'READY_TO_MOVE', publishStatus: 'APPROVED',
      price: 28000000, priceNegotiable: false, bhk: 4, bathrooms: 4,
      carpetArea: 3200, builtUpArea: 3800, plotArea: 5000,
      floorNumber: 0, totalFloors: 2, ageOfProperty: 3, furnishing: 'Semi-Furnished', facing: 'North',
      address: '15, Pashan-Sus Road, Aundh',
      locality: 'Aundh', city: 'Pune', state: 'Maharashtra', pincode: '411067',
      latitude: 18.5581, longitude: 73.8099,
      reraNumber: 'P52100054321', bankApprovals: ['HDFC', 'ICICI', 'Axis Bank'],
      nearbyLandmarks: ['Aundh Chest Hospital', 'DP Road', 'D-Mart Aundh'],
      images: [
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
      ],
      amenities: ['Private Garden', 'Rooftop Terrace', '2-Car Garage', 'Solar Panels', 'Rainwater Harvesting'],
      societyFeatures: ['Gated Community', '24x7 Security'],
      isFeatured: true, isVerified: true, partnerId: partner.id,
    },
    // PENDING_APPROVAL — appears in GET /admin/properties queue
    {
      slug: 'wakad-2bhk-pending-seed',
      title: '2 BHK Flat in Wakad (Pending Approval)',
      description: 'New listing in Wakad, awaiting admin approval. Close to Wakad bridge and IT hubs.',
      propertyType: 'FLAT', listingType: 'SALE', propertyStatus: 'READY_TO_MOVE', publishStatus: 'PENDING_APPROVAL',
      price: 6500000, bhk: 2, bathrooms: 2,
      carpetArea: 900, builtUpArea: 1100, floorNumber: 3, totalFloors: 8,
      furnishing: 'Unfurnished', facing: 'South',
      address: 'Sunflower Heights, Wakad',
      locality: 'Wakad', city: 'Pune', state: 'Maharashtra', pincode: '411057',
      nearbyLandmarks: ['Wakad Bridge', 'D-Mart Wakad'],
      images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'],
      amenities: ['Lift', 'Parking'],
      partnerId: partner2.id,
    },
    // UNDER_CONSTRUCTION — for ConstructionUpdate timeline
    {
      slug: 'sunrise-towers-3bhk-underconstruction-seed',
      title: '3 BHK Flat in Sunrise Towers (Under Construction)',
      description: 'Premium under-construction project by Sharma Constructions in Wakad. RERA registered. Possession Q2 2026.',
      propertyType: 'FLAT', listingType: 'SALE', propertyStatus: 'UNDER_CONSTRUCTION', publishStatus: 'APPROVED',
      price: 7800000, priceNegotiable: false, bhk: 3, bathrooms: 2,
      carpetArea: 1100, builtUpArea: 1350, floorNumber: 8, totalFloors: 20,
      furnishing: 'Unfurnished', facing: 'East',
      address: 'Sunrise Towers, Wakad-Bhosari Road',
      locality: 'Wakad', city: 'Pune', state: 'Maharashtra', pincode: '411057',
      reraNumber: 'P52100099999', bankApprovals: ['SBI', 'HDFC'],
      possessionDate: new Date('2026-06-30'),
      nearbyLandmarks: ['Wakad Bridge', 'D-Mart Wakad', 'Hinjewadi Phase 2'],
      images: [
        'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800',
        'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800',
      ],
      amenities: ['Swimming Pool', 'Gymnasium', 'Club House', '24x7 Security'],
      societyFeatures: ["Children's Play Area", 'Jogging Track'],
      isFeatured: false, isVerified: true, partnerId: partner2.id,
    },
    // REJECTED — admin visibility of rejections
    {
      slug: 'viman-nagar-plot-rejected-seed',
      title: 'Plot in Viman Nagar (Rejected)',
      description: 'Freehold residential plot near Viman Nagar. Listing was rejected due to missing RERA number.',
      propertyType: 'PLOT', listingType: 'SALE', propertyStatus: 'READY_TO_MOVE', publishStatus: 'REJECTED',
      price: 12000000, carpetArea: 2000,
      address: 'Viman Nagar Road, Near Airport',
      locality: 'Viman Nagar', city: 'Pune', state: 'Maharashtra', pincode: '411014',
      rejectionNote: 'RERA number missing. Please provide valid RERA registration before re-submitting.',
      nearbyLandmarks: ['Pune Airport', 'Phoenix Mall'],
      images: [], amenities: [],
      partnerId: partner.id,
    },
  ];

  const properties = [];
  for (const prop of propertyDefs) {
    const p = await prisma.property.upsert({
      where:  { slug: prop.slug },
      update: {},
      create: prop,
    });
    console.log(`✅  Property : [${p.publishStatus}] ${p.title}`);
    properties.push(p);
  }

  const [propBaner, propKothrud, propOffice, propAundh, propPending, propUnderConstruction, propRejected] = properties;

  // ── 4. Leads ──────────────────────────────────────────────────────────────

  const leadDefs = [
    // CLOSED — buyer confirmed, escrow released
    {
      buyerName: 'Suresh Mehta', buyerEmail: 'user@realtydoor.com', buyerPhone: '+919000000003',
      buyerId: user.id, propertyId: propBaner.id,
      status: 'CLOSED', assignedPartnerId: partner.id, assignedAt: daysAgo(10),
      isOtpVerified: true, otpVerifiedAt: daysAgo(8),
      buyerFeedbackStatus: 'VERIFIED_CLOSED', feedbackReceivedAt: daysAgo(6),
      whatsappSentAt: daysAgo(7),
      visitNotes: 'Site visit completed. Buyer very interested and ready to proceed.',
      platformCommissionPct: 2.0, commissionAmountPaise: 170000, commissionStatus: 'INVOICED',
    },
    // SITE_VISIT_DONE — escrow held, buyer still deciding
    {
      buyerName: 'Anita Joshi', buyerEmail: 'user2@realtydoor.com', buyerPhone: '+919000000005',
      buyerId: user2.id, propertyId: propBaner.id,
      status: 'SITE_VISIT_DONE', assignedPartnerId: partner.id, assignedAt: daysAgo(5),
      isOtpVerified: true, otpVerifiedAt: daysAgo(4),
      buyerFeedbackStatus: 'STILL_DECIDING', feedbackReceivedAt: daysAgo(3),
      whatsappSentAt: daysAgo(4),
    },
    // ASSIGNED — partner has phone, visit pending
    {
      buyerName: 'Vikram Singh', buyerEmail: 'vikram.singh@test.com', buyerPhone: '+919111222333',
      propertyId: propKothrud.id,
      status: 'ASSIGNED', assignedPartnerId: partner.id, assignedAt: daysAgo(2),
      buyerFeedbackStatus: 'PENDING',
    },
    // UNASSIGNED — fresh inquiry
    {
      buyerName: 'Meena Patel', buyerEmail: 'meena.patel@test.com', buyerPhone: '+919222333444',
      propertyId: propBaner.id,
      status: 'UNASSIGNED',
    },
    // DROPPED — two-tier drop completed
    {
      buyerName: 'Ravi Kapoor', buyerEmail: 'ravi.kapoor@test.com', buyerPhone: '+919333444555',
      propertyId: propKothrud.id,
      status: 'DROPPED', assignedPartnerId: partner.id, assignedAt: daysAgo(20),
      isOtpVerified: true, otpVerifiedAt: daysAgo(18),
      buyerFeedbackStatus: 'VERIFIED_DROPPED', feedbackReceivedAt: daysAgo(15),
      whatsappSentAt: daysAgo(16),
      dropRequestedByPartner: true, dropRequestNote: 'Buyer stopped responding after site visit.',
      dropRequestedAt: daysAgo(14), droppedAt: daysAgo(13), droppedByAdminId: admin.id,
      droppedReason: 'Buyer confirmed not interested via WhatsApp.',
    },
  ];

  const leads = [];
  for (const lData of leadDefs) {
    let lead = await prisma.lead.findFirst({
      where: { buyerEmail: lData.buyerEmail, propertyId: lData.propertyId },
    });
    if (!lead) {
      lead = await prisma.lead.create({ data: lData });
      console.log(`✅  Lead     : ${lData.buyerName} → [${lData.status}]`);
    } else {
      console.log(`⏭   Lead     : ${lData.buyerName} → [${lData.status}]`);
    }
    leads.push(lead);
  }

  const [leadClosed, leadSiteVisit] = leads;

  // ── 5. Escrow Transactions ────────────────────────────────────────────────

  // RELEASED — closed deal
  let escrow1 = await prisma.escrowTransaction.findFirst({
    where: { razorpayOrderId: 'order_seed_escrow_001' },
  });
  if (!escrow1) {
    escrow1 = await prisma.escrowTransaction.create({
      data: {
        leadId: leadClosed.id, buyerId: user.id,
        razorpayOrderId: 'order_seed_escrow_001',
        razorpayPaymentId: 'pay_seed_escrw_001',
        razorpayTransferId: 'trf_seed_001',
        amount: 85000, currency: 'INR',
        status: 'RELEASED',
        heldAt: daysAgo(9), releasedAt: daysAgo(6),
        releasedByAdminId: admin.id,
        adminNote: 'Deal confirmed by both parties. Token released to seller.',
      },
    });
    console.log(`✅  Escrow   : RELEASED ₹85,000`);
  } else {
    console.log(`⏭   Escrow   : RELEASED (already exists)`);
  }

  // HELD — site visit done, decision pending
  let escrow2 = await prisma.escrowTransaction.findFirst({
    where: { razorpayOrderId: 'order_seed_escrow_002' },
  });
  if (!escrow2) {
    escrow2 = await prisma.escrowTransaction.create({
      data: {
        leadId: leadSiteVisit.id, buyerId: user2.id,
        razorpayOrderId: 'order_seed_escrow_002',
        razorpayPaymentId: 'pay_seed_escrw_002',
        amount: 50000, currency: 'INR',
        status: 'HELD',
        heldAt: daysAgo(4),
      },
    });
    console.log(`✅  Escrow   : HELD ₹50,000`);
  } else {
    console.log(`⏭   Escrow   : HELD (already exists)`);
  }

  // ── 6. UserSubscription + ServiceTickets ──────────────────────────────────

  const maintenanceSvc = services[0];
  let sub = await prisma.userSubscription.findFirst({
    where: { razorpayOrderId: 'order_seed_sub_001' },
  });
  if (!sub) {
    sub = await prisma.userSubscription.create({
      data: {
        userId: user.id, serviceId: maintenanceSvc.id,
        razorpayOrderId: 'order_seed_sub_001',
        razorpayPaymentId: 'pay_seed_sub_001',
        paymentStatus: 'SUCCESS',
        amountPaid: 4999, currency: 'INR',
        startDate: daysAgo(30),
        endDate: new Date(Date.now() + 335 * 24 * 60 * 60 * 1000),
      },
    });
    console.log(`✅  Sub      : Maintenance Premium for ${user.name}`);
  } else {
    console.log(`⏭   Sub      : (already exists)`);
  }

  const ticketDefs = [
    {
      userId: user.id, subscriptionId: sub.id,
      subject: 'Leaking kitchen tap',
      description: 'Kitchen tap has been dripping for 2 days. Need urgent plumbing visit.',
      category: 'PLUMBING', status: 'RESOLVED', priority: 'HIGH',
      adminNotes: 'Vendor dispatched on 2024-01-15.',
      vendorName: 'Quick Fix Plumbers', vendorPhone: '+919800100200',
      resolvedAt: daysAgo(20),
    },
    {
      userId: user.id, subscriptionId: sub.id,
      subject: 'Electrical switchboard sparking',
      description: 'Living room switchboard making sparking noise. Urgent safety concern.',
      category: 'ELECTRICAL', status: 'IN_PROGRESS', priority: 'URGENT',
      adminNotes: 'Electrician scheduled for tomorrow.',
      vendorName: 'Safe Electric Co.', vendorPhone: '+919800200300',
    },
    {
      userId: user.id, subscriptionId: sub.id,
      subject: 'Annual painting service request',
      description: 'Requesting the annual interior painting service as per AMC.',
      category: 'PAINTING', status: 'OPEN', priority: 'NORMAL',
    },
  ];

  for (const tData of ticketDefs) {
    const existing = await prisma.serviceTicket.findFirst({
      where: { userId: tData.userId, subject: tData.subject },
    });
    if (!existing) {
      await prisma.serviceTicket.create({ data: tData });
      console.log(`✅  Ticket   : "${tData.subject}" [${tData.status}]`);
    } else {
      console.log(`⏭   Ticket   : "${tData.subject}"`);
    }
  }

  // ── 7. Loan Applications ──────────────────────────────────────────────────

  const loanDefs = [
    {
      userId: user.id, propertyId: propBaner.id,
      preferredBank: 'HDFC Bank',
      loanAmountRequestedPaise: 680000000, // ₹68 lakh (paise)
      status: 'AWAITING_SANCTION',
      adminNote: 'Documents verified. Sent to HDFC on 2024-01-20.',
      statusHistory: ['DOCUMENTS_PENDING', 'DOCUMENTS_SUBMITTED', 'DOCUMENTS_VERIFIED', 'SENT_TO_BANK', 'AWAITING_SANCTION'],
    },
    {
      userId: user2.id, propertyId: propKothrud.id,
      preferredBank: 'SBI',
      loanAmountRequestedPaise: 220000000, // ₹22 lakh (paise)
      status: 'DOCUMENTS_PENDING',
      statusHistory: ['DOCUMENTS_PENDING'],
    },
  ];

  for (const lData of loanDefs) {
    const existing = await prisma.loanApplication.findFirst({
      where: { userId: lData.userId, propertyId: lData.propertyId },
    });
    if (!existing) {
      await prisma.loanApplication.create({ data: lData });
      console.log(`✅  Loan     : [${lData.status}] ${lData.preferredBank}`);
    } else {
      console.log(`⏭   Loan     : (already exists)`);
    }
  }

  // ── 8. User Documents ─────────────────────────────────────────────────────

  const docDefs = [
    {
      userId: user.id, documentType: 'PAN_CARD',
      fileUrl: 'https://example.com/docs/suresh_pan.pdf', fileName: 'suresh_pan.pdf',
      status: 'APPROVED', isVerified: true,
      verifiedAt: daysAgo(5), verifiedByAdminId: admin.id,
    },
    {
      userId: user.id, documentType: 'SALARY_SLIP',
      fileUrl: 'https://example.com/docs/suresh_salary_jan.pdf', fileName: 'suresh_salary_jan.pdf',
      status: 'PENDING_REVIEW', isVerified: false,
    },
    {
      userId: user2.id, documentType: 'AADHAR',
      fileUrl: 'https://example.com/docs/anita_aadhar.pdf', fileName: 'anita_aadhar.pdf',
      status: 'PENDING_REVIEW', isVerified: false,
    },
    {
      userId: user2.id, documentType: 'BANK_STATEMENT',
      fileUrl: 'https://example.com/docs/anita_bank_3months.pdf', fileName: 'anita_bank_3months.pdf',
      status: 'PENDING_REVIEW', isVerified: false,
    },
  ];

  for (const dData of docDefs) {
    const existing = await prisma.userDocument.findFirst({
      where: { userId: dData.userId, documentType: dData.documentType },
    });
    if (!existing) {
      await prisma.userDocument.create({ data: dData });
      console.log(`✅  Document : ${dData.documentType} [${dData.status}]`);
    } else {
      console.log(`⏭   Document : ${dData.documentType}`);
    }
  }

  // ── 9. Contact Messages ───────────────────────────────────────────────────

  const contactDefs = [
    {
      name: 'Ranjit Verma', email: 'ranjit.verma@test.com', phone: '+919444555666',
      subject: 'Partnership Inquiry',
      message: 'I am a RERA-registered agent in Pune with 5 years experience. How do I become a RealtyDoor partner?',
      isRead: false,
    },
    {
      name: 'Sunita Rao', email: 'sunita.rao@test.com', phone: '+919555666777',
      subject: 'Property listing stuck in pending',
      message: 'I submitted my property listing 3 days ago but it is still pending approval. Please help.',
      userId: user.id, role: 'USER', isRead: true,
    },
    {
      name: 'Dev Enterprises', email: 'dev@testbiz.com', phone: '+912027001234',
      subject: 'NRI Investment Query',
      message: 'We represent a group of NRI investors looking for commercial properties in Pune IT corridor. Who is the right person to contact?',
      isRead: false,
    },
  ];

  for (const cData of contactDefs) {
    const existing = await prisma.contactMessage.findFirst({
      where: { email: cData.email, subject: cData.subject },
    });
    if (!existing) {
      await prisma.contactMessage.create({ data: cData });
      console.log(`✅  Contact  : "${cData.subject}" from ${cData.name}`);
    } else {
      console.log(`⏭   Contact  : "${cData.subject}"`);
    }
  }

  // ── 10. Team Members ──────────────────────────────────────────────────────

  const teamDefs = [
    {
      name: 'Vikram Nair', title: 'Founder & CEO', email: 'vikram@realtydoor.com',
      avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400',
      sortOrder: 1, isActive: true,
    },
    {
      name: 'Shreya Gupta', title: 'Head of Partnerships', email: 'shreya@realtydoor.com',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400',
      sortOrder: 2, isActive: true,
    },
    {
      name: 'Arun Menon', title: 'Lead Engineer', email: 'arun@realtydoor.com',
      avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400',
      sortOrder: 3, isActive: true,
    },
  ];

  for (const tData of teamDefs) {
    const existing = await prisma.teamMember.findFirst({ where: { email: tData.email } });
    if (!existing) {
      await prisma.teamMember.create({ data: tData });
      console.log(`✅  Team     : ${tData.name} — ${tData.title}`);
    } else {
      console.log(`⏭   Team     : ${tData.name}`);
    }
  }

  // ── 11. Locality Insights ─────────────────────────────────────────────────

  const localityDefs = [
    {
      city: 'Pune', locality: 'Baner', citySlug: 'pune', localitySlug: 'baner',
      avgPricePerSqftPaise: 850000, minPricePerSqftPaise: 700000, maxPricePerSqftPaise: 1050000,
      avgRentPerMonthPaise: 2800000, priceChangeLastMonthPct: 2.3,
      nearbyInfra: ['D-Mart', 'Orchid School', 'Baner Metro Station', 'Aditya Birla Hospital'],
      dataAsOfDate: new Date('2024-01-01'), updatedByAdminId: admin.id,
    },
    {
      city: 'Pune', locality: 'Kothrud', citySlug: 'pune', localitySlug: 'kothrud',
      avgPricePerSqftPaise: 720000, minPricePerSqftPaise: 600000, maxPricePerSqftPaise: 900000,
      avgRentPerMonthPaise: 2200000, priceChangeLastMonthPct: 1.8,
      nearbyInfra: ['Kothrud Bus Depot', 'Symbiosis College', 'Chandni Chowk'],
      dataAsOfDate: new Date('2024-01-01'), updatedByAdminId: admin.id,
    },
    {
      city: 'Pune', locality: 'Hinjewadi', citySlug: 'pune', localitySlug: 'hinjewadi',
      avgPricePerSqftPaise: 650000, minPricePerSqftPaise: 520000, maxPricePerSqftPaise: 820000,
      avgRentPerMonthPaise: 2000000, priceChangeLastMonthPct: 3.1,
      nearbyInfra: ['Rajiv Gandhi IT Park', 'Infosys BPO', 'Hinjewadi Bus Stop'],
      dataAsOfDate: new Date('2024-01-01'), updatedByAdminId: admin.id,
    },
    {
      city: 'Pune', locality: 'Aundh', citySlug: 'pune', localitySlug: 'aundh',
      avgPricePerSqftPaise: 920000, minPricePerSqftPaise: 750000, maxPricePerSqftPaise: 1200000,
      avgRentPerMonthPaise: 3200000, priceChangeLastMonthPct: 1.5,
      nearbyInfra: ['Aundh Chest Hospital', 'DP Road Market', 'Westend Mall'],
      dataAsOfDate: new Date('2024-01-01'), updatedByAdminId: admin.id,
    },
  ];

  for (const loc of localityDefs) {
    await prisma.localityInsight.upsert({
      where:  { city_locality: { city: loc.city, locality: loc.locality } },
      update: loc,
      create: loc,
    });
    console.log(`✅  Locality : ${loc.city} / ${loc.locality}`);
  }

  // ── 12. CMS Content Blocks ────────────────────────────────────────────────

  const contentDefs = [
    {
      type: 'BLOG', title: 'Top 5 Neighbourhoods to Buy Property in Pune (2024)',
      slug: 'top-5-pune-neighbourhoods-2024',
      content: "<h2>1. Baner</h2><p>Baner has emerged as one of Pune's most sought-after hubs owing to its proximity to Hinjewadi IT Park...</p><h2>2. Kothrud</h2><p>Well-established locality with excellent connectivity...</p><h2>3. Aundh</h2><p>Premium residential area with wide roads...</p><h2>4. Hinjewadi</h2><p>Fastest-growing micro-market driven by the IT sector...</p><h2>5. Wakad</h2><p>Emerging hub with affordable pricing...</p>",
      excerpt: 'Thinking about buying a home in Pune? Here are the top 5 neighbourhoods offering the best combination of price appreciation and quality of life.',
      imageUrl: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=1200',
      author: 'RealtyDoor Research',
      tags: ['Pune', 'Investment', 'Residential', '2024', 'Neighbourhood Guide'],
      isPublished: true, publishedAt: new Date('2024-01-10'),
      seoTitle: 'Top 5 Pune Neighbourhoods to Buy Property in 2024 | RealtyDoor',
      seoDesc: 'Discover the best areas to invest in Pune real estate — Baner, Kothrud, Aundh, Hinjewadi & Wakad compared.',
    },
    {
      type: 'BLOG', title: 'RERA Explained: What Every Pune Homebuyer Must Know',
      slug: 'rera-guide-pune-homebuyer',
      content: '<h2>What is RERA?</h2><p>The Real Estate (Regulation and Development) Act, 2016 protects homebuyers and boosts investments in the sector...</p><h2>How to Verify</h2><p>Visit maharera.mahaonline.gov.in to verify any registered project...</p><h2>Key Protections</h2><p>Developers must deposit 70% of collected funds in a separate bank account...</p>',
      excerpt: 'RERA has transformed Indian real estate. Here is everything a Pune homebuyer needs to know before signing.',
      imageUrl: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1200',
      author: 'RealtyDoor Legal Team',
      tags: ['RERA', 'Legal', 'Homebuyer Guide', 'MahaRERA', 'Pune'],
      isPublished: true, publishedAt: new Date('2024-01-20'),
      seoTitle: 'RERA Guide for Pune Homebuyers 2024 | RealtyDoor',
      seoDesc: 'Everything you need to know about RERA, MahaRERA, and how to verify a real estate project in Pune.',
    },
    {
      type: 'FAQ', title: 'Frequently Asked Questions', slug: 'faq',
      content: JSON.stringify([
        { q: 'How does RealtyDoor ensure I get genuine leads?', a: 'Multi-step OTP verification. The buyer verifies their phone, and the partner must verify a site-visit OTP before buyer contact is revealed.' },
        { q: 'What is the escrow / token advance system?', a: 'Before closing a deal the buyer deposits a token advance via Razorpay into our escrow. Released to the seller once confirmed, or refunded if it falls through.' },
        { q: 'How long does KYC verification take?', a: 'Our team typically reviews KYC documents within 24 working hours. You will receive a notification once complete.' },
        { q: 'What documents do I need for KYC?', a: 'Government-issued ID (Aadhaar or PAN), address proof, and relevant professional certifications (RERA registration for agents/builders).' },
        { q: 'Can I list my property for free?', a: 'Yes, listing is free. We earn a platform commission only on successful deal closures.' },
      ]),
      excerpt: 'Common questions about RealtyDoor, property listings, KYC, escrow, and the buying process.',
      tags: ['FAQ', 'Help', 'KYC', 'Escrow', 'Listings'],
      isPublished: true, publishedAt: new Date('2024-01-01'),
    },
    {
      type: 'ANNOUNCEMENT', title: 'Welcome to RealtyDoor Beta!', slug: 'welcome-realtydoor-beta',
      content: "<p>We are excited to launch RealtyDoor — India's most transparent real estate platform. Our mission is to eliminate property fraud through technology, escrow-backed deals, and KYC-verified partners.</p><p>During beta, all services are available at introductory pricing. We'd love your feedback!</p>",
      excerpt: 'RealtyDoor is officially live! Explore verified properties and enjoy secure escrow-backed deals.',
      imageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200',
      author: 'RealtyDoor Team',
      tags: ['Announcement', 'Launch', 'Beta'],
      isPublished: true, publishedAt: new Date('2024-01-01'),
    },
  ];

  for (const block of contentDefs) {
    const existing = block.slug
      ? await prisma.contentBlock.findFirst({ where: { slug: block.slug } })
      : null;
    if (!existing) {
      await prisma.contentBlock.create({ data: block });
      console.log(`✅  Content  : [${block.type}] ${block.title}`);
    } else {
      console.log(`⏭   Content  : [${block.type}] ${block.title}`);
    }
  }

  // ── 13. Notifications ─────────────────────────────────────────────────────

  const notifDefs = [
    { userId: partner.id, title: 'New Lead Assigned', type: 'LEAD_ASSIGNED', isRead: false, message: 'A new lead has been assigned to you for "3 BHK Flat in Baner".', linkUrl: '/partner/leads' },
    { userId: partner.id, title: 'Property Approved', type: 'PROPERTY_APPROVED', isRead: true, message: 'Your listing "3 BHK Flat in Baner" has been approved and is now live.', linkUrl: '/partner/listings' },
    { userId: user.id, title: 'Service Activated', type: 'SERVICE_ACTIVATED', isRead: false, message: 'Your Maintenance Premium plan is now active. Book your first visit anytime!', linkUrl: '/dashboard/services' },
    { userId: user.id, title: 'Escrow Payment Confirmed', type: 'ESCROW_HELD', isRead: true, message: 'Your token advance of ₹85,000 for "3 BHK Flat in Baner" is now held in escrow.', linkUrl: '/dashboard/finance' },
    { userId: user.id, title: 'Escrow Released to Seller', type: 'ESCROW_RELEASED', isRead: false, message: 'Your token advance for "3 BHK Flat in Baner" has been released to the seller. Deal confirmed!', linkUrl: '/dashboard/finance' },
    { userId: admin.id, title: 'New KYC Submission', type: 'KYC_PENDING', isRead: false, message: 'Priya Sharma (Partner) has submitted KYC documents for review.', linkUrl: '/admin/kyc' },
  ];

  for (const nData of notifDefs) {
    const existing = await prisma.notification.findFirst({
      where: { userId: nData.userId, title: nData.title },
    });
    if (!existing) {
      await prisma.notification.create({ data: nData });
      console.log(`✅  Notif    : [${nData.type}] ${nData.title}`);
    } else {
      console.log(`⏭   Notif    : ${nData.title}`);
    }
  }

  // ── 14. Favorites ─────────────────────────────────────────────────────────

  const favDefs = [
    { userId: user.id,  propertyId: propBaner.id },
    { userId: user.id,  propertyId: propOffice.id },
    { userId: user2.id, propertyId: propBaner.id },
    { userId: user2.id, propertyId: propAundh.id },
  ];

  for (const fData of favDefs) {
    const existing = await prisma.favorite.findFirst({
      where: { userId: fData.userId, propertyId: fData.propertyId },
    });
    if (!existing) {
      await prisma.favorite.create({ data: fData });
      console.log(`✅  Favorite : saved`);
    } else {
      console.log(`⏭   Favorite : (already exists)`);
    }
  }

  // ── 15. Property Edit Logs ────────────────────────────────────────────────

  const editLogDefs = [
    {
      propertyId: propBaner.id, editedBy: admin.id, editedByName: 'Admin User',
      fieldChanged: 'price', oldValue: '9000000', newValue: '8500000',
      editNote: 'Adjusted price to match comparable listings in Baner.',
    },
    {
      propertyId: propBaner.id, editedBy: admin.id, editedByName: 'Admin User',
      fieldChanged: 'reraNumber', oldValue: null, newValue: 'P52100012345',
      editNote: 'Added RERA number after partner provided document.',
    },
    {
      propertyId: propAundh.id, editedBy: admin.id, editedByName: 'Admin User',
      fieldChanged: 'isFeatured', oldValue: 'false', newValue: 'true',
      editNote: 'Promoting premium listing to featured section.',
    },
  ];

  for (const elData of editLogDefs) {
    const existing = await prisma.propertyEditLog.findFirst({
      where: { propertyId: elData.propertyId, fieldChanged: elData.fieldChanged },
    });
    if (!existing) {
      await prisma.propertyEditLog.create({ data: elData });
      console.log(`✅  EditLog  : "${elData.fieldChanged}" on property ${elData.propertyId}`);
    } else {
      console.log(`⏭   EditLog  : "${elData.fieldChanged}" (already exists)`);
    }
  }

  // ── 16. Audit Logs ────────────────────────────────────────────────────────

  const auditDefs = [
    {
      adminId: admin.id, action: 'LEAD_ASSIGNED', targetType: 'Lead', targetId: leadClosed.id,
      after: JSON.stringify({ assignedPartnerId: partner.id, status: 'ASSIGNED' }),
      ipAddress: '127.0.0.1', actorRole: 'ADMIN',
    },
    {
      adminId: admin.id, action: 'PROPERTY_APPROVED', targetType: 'Property', targetId: propBaner.id,
      before: JSON.stringify({ publishStatus: 'PENDING_APPROVAL' }),
      after: JSON.stringify({ publishStatus: 'APPROVED' }),
      ipAddress: '127.0.0.1', actorRole: 'ADMIN',
    },
    {
      adminId: admin.id, action: 'KYC_APPROVE', targetType: 'User', targetId: partner.id,
      before: JSON.stringify({ kycStatus: 'PENDING_REVIEW' }),
      after: JSON.stringify({ kycStatus: 'VERIFIED' }),
      ipAddress: '127.0.0.1', actorRole: 'ADMIN',
    },
    {
      adminId: admin.id, action: 'ESCROW_RELEASED', targetType: 'EscrowTransaction', targetId: escrow1.id,
      before: JSON.stringify({ status: 'HELD' }),
      after: JSON.stringify({ status: 'RELEASED' }),
      ipAddress: '127.0.0.1', actorRole: 'ADMIN',
    },
    {
      adminId: admin.id, action: 'PROPERTY_REJECTED', targetType: 'Property', targetId: propRejected.id,
      before: JSON.stringify({ publishStatus: 'PENDING_APPROVAL' }),
      after: JSON.stringify({ publishStatus: 'REJECTED', rejectionNote: 'RERA number missing.' }),
      ipAddress: '127.0.0.1', actorRole: 'ADMIN',
    },
  ];

  for (const aData of auditDefs) {
    const existing = await prisma.auditLog.findFirst({
      where: { adminId: aData.adminId, action: aData.action, targetId: aData.targetId },
    });
    if (!existing) {
      await prisma.auditLog.create({ data: aData });
      console.log(`✅  Audit    : ${aData.action} on ${aData.targetType}`);
    } else {
      console.log(`⏭   Audit    : ${aData.action} (already exists)`);
    }
  }

  // ── 17. Construction Updates ──────────────────────────────────────────────

  const constructionUpdateDefs = [
    {
      propertyId: propUnderConstruction.id,
      milestoneTitle: 'Foundation Work Completed',
      description: 'Excavation and foundation work for all 4 towers has been completed ahead of schedule. Structural safety audit passed with Grade A certification.',
      mediaUrls: [
        'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800',
        'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=800',
      ],
      completionPct: 15,
      postedAt: daysAgo(60),
    },
    {
      propertyId: propUnderConstruction.id,
      milestoneTitle: 'Floors 1–5 Slab Casting Done',
      description: 'Slab casting for floors 1 through 5 completed across Tower A and B. Electrical and plumbing rough-in work underway.',
      mediaUrls: [
        'https://images.unsplash.com/photo-1590725140246-20acddc1ec6d?w=800',
      ],
      completionPct: 30,
      postedAt: daysAgo(30),
    },
    {
      propertyId: propUnderConstruction.id,
      milestoneTitle: 'Floors 6–10 Structural Work In Progress',
      description: 'Currently working on floors 6–10. Brickwork on lower floors progressing well. Window installation scheduled for next month.',
      mediaUrls: [
        'https://images.unsplash.com/photo-1582561424760-0321d75e81fa?w=800',
      ],
      completionPct: 45,
      postedAt: daysAgo(5),
    },
  ];

  for (const cuData of constructionUpdateDefs) {
    const existing = await prisma.constructionUpdate.findFirst({
      where: { propertyId: cuData.propertyId, milestoneTitle: cuData.milestoneTitle },
    });
    if (!existing) {
      await prisma.constructionUpdate.create({ data: cuData });
      console.log(`✅  ConstrUp : ${cuData.milestoneTitle} (${cuData.completionPct}%)`);
    } else {
      console.log(`⏭   ConstrUp : ${cuData.milestoneTitle}`);
    }
  }

  // ── 18. Video Tour Requests ────────────────────────────────────────────────

  // Mark user1 as NRI so the request makes sense
  await prisma.user.update({ where: { id: user.id }, data: { isNRI: true } });

  const videoTourDefs = [
    // PENDING — just submitted
    {
      userId: user.id, propertyId: propBaner.id,
      status: 'PENDING',
      userNote: 'I am based in Dubai and cannot visit in person. Please arrange a live walkthrough of the 3 BHK.',
    },
    // ASSIGNED — admin assigned to partner
    {
      userId: user2.id, propertyId: propUnderConstruction.id,
      status: 'ASSIGNED',
      assignedTo: partner2.id,
      scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      userNote: 'Interested in the under-construction project. Want to see current progress on site.',
      adminNote: 'Assigned to Priya Sharma (builder). Scheduled virtual walk for 3 days out.',
    },
    // COMPLETED — video delivered
    {
      userId: user.id, propertyId: propAundh.id,
      status: 'COMPLETED',
      assignedTo: partner.id,
      videoUrl: 'https://example.com/tours/aundh-4bhk-walkaround.mp4',
      scheduledAt: daysAgo(10),
      completedAt: daysAgo(9),
      userNote: 'NRI buyer from UK. Please cover the garden and rooftop terrace in detail.',
      adminNote: 'Tour completed. Video uploaded and shared with buyer.',
    },
  ];

  for (const vtData of videoTourDefs) {
    const existing = await prisma.videoTourRequest.findFirst({
      where: { userId: vtData.userId, propertyId: vtData.propertyId },
    });
    if (!existing) {
      await prisma.videoTourRequest.create({ data: vtData });
      console.log(`✅  VideoTour: [${vtData.status}] userId=${vtData.userId}`);
    } else {
      console.log(`⏭   VideoTour: (already exists)`);
    }
  }

  // ── 19. B2B Connection ────────────────────────────────────────────────────

  let b2b = await prisma.b2BConnection.findFirst({
    where: { buyerPartnerId: partner2.id, propertyId: propBaner.id },
  });
  if (!b2b) {
    b2b = await prisma.b2BConnection.create({
      data: {
        listingPartnerId: partner.id,
        buyerPartnerId: partner2.id,
        propertyId: propBaner.id,
        status: 'INTERESTED',
        message: 'I have a client looking for a 3 BHK in Baner. Would like to discuss co-brokerage terms.',
      },
    });
    console.log(`✅  B2B      : partner2 INTERESTED in Baner property`);
  } else {
    console.log(`⏭   B2B      : (already exists)`);
  }

  // ── 20. Vendors ───────────────────────────────────────────────────────────

  const vendorDefs = [
    { name: 'Quick Fix Plumbers',   phone: '+919800100200', email: 'quickfix@example.com',  category: 'PLUMBING',   city: 'Pune', notes: 'Available 7 days. Specialises in burst pipes and tap fittings.', isActive: true },
    { name: 'Safe Electric Co.',    phone: '+919800200300', email: 'safeelec@example.com',  category: 'ELECTRICAL', city: 'Pune', notes: 'ESCI-certified. 24hr emergency callout.', isActive: true },
    { name: 'ColorCraft Painters',  phone: '+919800300400', email: null,                     category: 'PAINTING',   city: 'Pune', notes: 'Interior and exterior painting. 3-year warranty.', isActive: true },
    { name: 'BuildRight Carpentry', phone: '+919800400500', email: 'buildright@example.com', category: 'CARPENTRY',  city: 'Pune', notes: 'Modular kitchen and wardrobe specialists.', isActive: true },
    { name: 'All-Round Services',   phone: '+919800500600', email: null,                     category: 'GENERAL',    city: 'Pune', notes: 'General handyman — minor repairs and maintenance.', isActive: false },
  ];

  const vendors = [];
  for (const vData of vendorDefs) {
    const existing = await prisma.vendor.findFirst({ where: { phone: vData.phone } });
    if (!existing) {
      const v = await prisma.vendor.create({ data: vData });
      console.log(`✅  Vendor   : ${vData.name} [${vData.category}]`);
      vendors.push(v);
    } else {
      console.log(`⏭   Vendor   : ${vData.name}`);
      vendors.push(existing);
    }
  }
  const [vendor1] = vendors;

  // ── 21. Property Reviews ───────────────────────────────────────────────────

  const reviewDefs = [
    // Approved — visible publicly
    {
      userId: user.id, propertyId: propBaner.id,
      rating: 5, title: 'Excellent flat — highly recommend',
      body: 'The 3 BHK in Baner exceeded our expectations. Great construction quality, excellent ventilation, and the society amenities are top-notch. RealtyDoor made the entire process seamless.',
      isApproved: true, moderatedAt: daysAgo(3), moderatedByAdminId: admin.id,
    },
    // Pending moderation — not yet public
    {
      userId: user2.id, propertyId: propBaner.id,
      rating: 3, title: 'Good property, maintenance could improve',
      body: 'The flat itself is well-designed but the society maintenance team is slow to respond. Lift was down for 2 days last month.',
      isApproved: false,
    },
    // Approved on a different property
    {
      userId: user2.id, propertyId: propAundh.id,
      rating: 4, title: 'Premium locality, worth the price',
      body: 'The bungalow in Aundh is spacious and the private garden is a great bonus. Slightly over budget but quality justifies it.',
      isApproved: true, moderatedAt: daysAgo(5), moderatedByAdminId: admin.id,
    },
  ];

  const reviews = [];
  for (const rData of reviewDefs) {
    const existing = await prisma.propertyReview.findFirst({
      where: { userId: rData.userId, propertyId: rData.propertyId },
    });
    if (!existing) {
      const r = await prisma.propertyReview.create({ data: rData });
      console.log(`✅  Review   : ${rData.rating}★ [${rData.isApproved ? 'APPROVED' : 'PENDING'}] by userId=${rData.userId}`);
      reviews.push(r);
    } else {
      console.log(`⏭   Review   : (already exists)`);
      reviews.push(existing);
    }
  }
  const [review1] = reviews;

  // ── 22. Disputes ──────────────────────────────────────────────────────────

  const disputeDefs = [
    // OPEN — just raised by user1 on the HELD escrow
    {
      userId: user2.id, type: 'ESCROW', referenceId: escrow2.id,
      reason: 'Escrow held but deal fallen through',
      description: 'The seller has withdrawn from the deal after the token was deposited. The escrow is still HELD and I need it refunded urgently. Please investigate and initiate the refund process.',
      status: 'OPEN',
    },
    // UNDER_REVIEW — admin has acknowledged
    {
      userId: user.id, type: 'SERVICE', referenceId: sub.id,
      reason: 'Vendor did not show up for scheduled visit',
      description: 'The plumbing vendor was scheduled for 10 Jan but did not arrive. No advance notice was given. This has disrupted our schedule and the leaking tap is now causing water damage.',
      status: 'UNDER_REVIEW',
      adminNote: 'We have contacted Quick Fix Plumbers. A replacement visit has been rescheduled for tomorrow.',
    },
  ];

  const disputes = [];
  for (const dData of disputeDefs) {
    const existing = await prisma.dispute.findFirst({
      where: { userId: dData.userId, referenceId: dData.referenceId },
    });
    if (!existing) {
      const d = await prisma.dispute.create({ data: dData });
      console.log(`✅  Dispute  : [${dData.status}] ${dData.type} by userId=${dData.userId}`);
      disputes.push(d);
    } else {
      console.log(`⏭   Dispute  : (already exists)`);
      disputes.push(existing);
    }
  }
  const [dispute1] = disputes;

  // ── 23. Platform Config ───────────────────────────────────────────────────

  const configDefs = [
    { key: 'platform_name',          value: 'RealtyDoor',                                                      description: 'Platform display name',                         isPublic: true,  updatedByAdminId: admin.id },
    { key: 'support_phone',          value: '+919000000001',                                                    description: 'Customer support WhatsApp number',               isPublic: true,  updatedByAdminId: admin.id },
    { key: 'support_email',          value: 'support@realtydoor.in',                                            description: 'Customer support email address',                 isPublic: true,  updatedByAdminId: admin.id },
    { key: 'rera_disclaimer',        value: 'RERA registrations vary by state. Verify at maharera.mahaonline.gov.in before investing.', description: 'RERA disclaimer shown on listings', isPublic: true, updatedByAdminId: admin.id },
    { key: 'platform_commission_pct', value: '2',                                                               description: 'Platform commission % on closed deals',          isPublic: false, updatedByAdminId: admin.id },
    { key: 'escrow_token_min_paise', value: '5000000',                                                          description: 'Minimum token advance in paise (₹50,000)',       isPublic: false, updatedByAdminId: admin.id },
    { key: 'razorpay_webhook_secret', value: 'whsec_seed_placeholder',                                          description: 'Razorpay webhook HMAC signing secret',           isPublic: false, updatedByAdminId: admin.id },
  ];

  for (const cData of configDefs) {
    await prisma.platformConfig.upsert({
      where:  { key: cData.key },
      update: cData,
      create: cData,
    });
    console.log(`✅  Config   : ${cData.key} [${cData.isPublic ? 'public' : 'private'}]`);
  }

  // ── Summary ───────────────────────────────────────────────────────────────

  console.log('\n──────────────────────────────────────────────────────────────');
  console.log('🌱  Seed complete!\n');
  console.log('  Copy these IDs into Postman / Thunder Client as variables:\n');
  console.log(`  adminId        = ${admin.id}`);
  console.log(`  partnerId      = ${partner.id}   ← KYC VERIFIED`);
  console.log(`  partner2Id     = ${partner2.id}   ← KYC PENDING_REVIEW`);
  console.log(`  userId         = ${user.id}   ← buyer 1`);
  console.log(`  user2Id        = ${user2.id}   ← buyer 2`);
  console.log(`  propertyId       = ${propBaner.id}   ← 3BHK Baner (APPROVED)`);
  console.log(`  ucPropertyId     = ${propUnderConstruction.id}   ← Wakad (UNDER_CONSTRUCTION)`);
  console.log(`  pendingPropId    = ${propPending.id}   ← Wakad (PENDING_APPROVAL)`);
  console.log(`  rejectedPropId   = ${propRejected.id}   ← Viman Nagar (REJECTED)`);
  console.log(`  leadId         = ${leadClosed.id}   ← CLOSED lead`);
  console.log(`  escrowId       = ${escrow1.id}   ← RELEASED`);
  console.log(`  escrowHeldId   = ${escrow2.id}   ← HELD`);
  console.log(`  subscriptionId = ${sub.id}`);
  console.log(`  vendorId       = ${vendor1?.id ?? 'see above'}`);
  console.log(`  reviewId       = ${review1?.id ?? 'see above'}`);
  console.log(`  disputeId      = ${dispute1?.id ?? 'see above'}`);
  console.log(`  configKey      = support_phone  (use any key from platform config)`);
  console.log('\n  Clerk IDs set (replace before live auth testing):');
  console.log(`    ADMIN_CLERK_ID    = ${ADMIN_CLERK_ID}`);
  console.log(`    PARTNER_CLERK_ID  = ${PARTNER_CLERK_ID}`);
  console.log(`    PARTNER2_CLERK_ID = ${PARTNER2_CLERK_ID}`);
  console.log(`    USER_CLERK_ID     = ${USER_CLERK_ID}`);
  console.log(`    USER2_CLERK_ID    = ${USER2_CLERK_ID}`);
  console.log('──────────────────────────────────────────────────────────────\n');
}

main()
  .catch((e) => { console.error('❌  Seed failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
