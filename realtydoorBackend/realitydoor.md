**Version:** 1.0  
**Status:** MVP Release  
**Last Updated:** May 2026  
**Owner:** Product — John (PM)

---

> **How to Use This Document**  
> This is the single source of truth for the RealtyDoor platform. It consolidates all prior PRD fragments (Parts 1–5) and the Enterprise PRD v4.0 into one authoritative reference. Developers, designers, and QA should read this before touching any code or design. Every engineering decision must protect the platform's revenue flow.

---

## TABLE OF CONTENTS

1. [Business Model & Core Concept](#1-business-model--core-concept)
2. [Role Definitions & Permissions](#2-role-definitions--permissions)
3. [Personas & User Journeys](#3-personas--user-journeys)
4. [Key Interaction Patterns](#4-key-interaction-patterns)
5. [Anti-Leakage Engine](#5-anti-leakage-engine)
6. [Database Schema (Prisma / MongoDB)](#6-database-schema-prisma--mongodb)
7. [API Routes Reference](#7-api-routes-reference)
8. [Public Portal Architecture](#8-public-portal-architecture)
9. [Admin Panel Specifications](#9-admin-panel-specifications)
10. [Partner Panel Specifications](#10-partner-panel-specifications)
11. [User Dashboard Specifications](#11-user-dashboard-specifications)
12. [Edge Cases & Developer Gotchas](#12-edge-cases--developer-gotchas)
13. [Communication Layer (Email, WhatsApp)](#13-communication-layer-email-whatsapp)
14. [UX, Legal & Compliance](#14-ux-legal--compliance)
15. [Complete Site Route Map](#15-complete-site-route-map)
16. [Non-Functional Requirements](#16-non-functional-requirements)

---

## 1\. BUSINESS MODEL & CORE CONCEPT

### 1.1 Platform Summary

RealtyDoor is a **lead-generation and property-services platform** for the Indian real estate market. The platform captures buyer intent (inquiries), routes those leads through an Admin, dispatches them to field Partners (agents/builders), and facilitates deal closures via mandatory escrow. It also sells post-purchase services (maintenance, construction, legal) to users. **Every design and engineering decision must protect this revenue flow.**

### 1.2 The 3-Tier Principal Hierarchy

```
TIER 1: ADMIN (Platform Owner)
↓ Dispatches leads, monitors all activity, controls escrow releases

TIER 2: PARTNER (External Field People — Agents / Builders / Advisors)
↓ Lists properties, takes leads to site, documents visits, closes deals

TIER 3: USER (Buyers / Tenants / NRIs)
Submits inquiries, buys services, tracks their journey
```

**The Golden Rule:** It does not matter who lists the property or who closes the deal. **The Admin (platform) has complete visibility over every lead and deal.** The Partner does the ground work. Revenue in MVP comes from service sales and escrow float.

### 1.3 Revenue Streams

|     |     |     |     |
| --- | --- | --- | --- |
| #   | Stream | Phase | Mechanism |
| 1   | **Service Revenue** | **MVP** | Maintenance, Construction, Loan Processing, Legal Registration sold to Users |
| 2   | **Escrow Float** | **MVP** | **Mandatory** token advances held via **Razorpay Route** before release to sellers. Every deal closure requires escrow payment. |

> **MVP Scope:** Only **Service Revenue** and **Escrow Float** are active revenue streams at launch. Platform Commission, SaaS Subscriptions, and Listing Boost Fees are deferred to Phase 2.

---

## 2\. ROLE DEFINITIONS & PERMISSIONS

### 2.1 Role Summary

|     |     |     |
| --- | --- | --- |
| Role | Who | Goal on Platform |
| `ADMIN` | Platform owner | Control everything. Manage escrow, service revenue, and all platform operations. |
| `PARTNER` | External agents, builders, advisors, owners | List properties. Close deals. Earn their cut. |
| `USER` | Buyers, tenants, NRI investors | Find a property. Buy related services. |

> **Dev Note:** `PartnerSubType` (AGENT, BUILDER, ADVISOR, OWNER) is an **informational label only** — it does NOT control permissions. All Partners get the same `/partner` dashboard. A "Builder" is just a Partner who uses the Microsite CMS.

### 2.2 ADMIN Capabilities

- Approves/rejects every property before it goes live
- Receives ALL buyer inquiries first; dispatches them to Partners
- Monitors all Partner activity (visits, documentation, closures)
- Controls escrow release/refund for every closed deal
- Manages Global CMS (blogs, banners, service pricing)
- Has Revenue Dashboard showing all money in and out
- Can edit or delete ANY listing regardless of who listed it
- Can change user roles, suspend accounts

### 2.3 PARTNER Capabilities

**CAN do:**

- List properties (single wizard / bulk CSV / microsite builder)
- Edit/update their own listings
- Receive leads dispatched by Admin
- Schedule and document site visits (with OTP verification)
- Upload visit notes, photos, closure documents
- Mark lead as "Closed" (triggers Admin closure notification + escrow release review)
- Access B2B hidden inventory (open to all verified Partners in MVP)

**CANNOT do:**

- See leads they were NOT assigned
- Approve/reject their own or others' listings (`publishStatus` is Admin-only)
- See other Partners' private data
- Reopen a closed lead (Admin-only action)

### 2.4 USER Capabilities

- Browse and search all approved listings (no phone required)
- Submit inquiries (routed to Admin, never directly to Partner)
- Buy post-purchase services (maintenance, construction, loans)
- Track loan application status via Document Vault
- Monitor under-construction project progress
- Receive OTP for site visit verification (anti-leakage)
- Compare up to 3 properties side-by-side
- Request video tours (NRI feature)

### 2.5 Phone Verification Flow (Lazy Verification)

**Authentication:** User logs in via Google (Clerk) — no phone required at signup

**Phone Verification Trigger:** Required only when user takes action that needs phone contact

**Branching Flow:**

```
USER LOGS IN (Google via Clerk)
    ↓
User browses properties (no phone needed)
    ↓
User tries action?
    ↓
    ├─ VIEW ONLY (no phone needed)
    │   ├─ Browse
    │   ├─ Search
    │   ├─ Filter
    │   └─ View property details
    │
    └─ ACTION REQUIRES PHONE
        ├─ Submit property inquiry
        ├─ Save property to favorites
        ├─ Start chat with Partner
        ├─ Book site visit
        └─ Purchase service
            ↓
        Phone Verified?
            ↓
        ├─ YES → Action proceeds
        │
        └─ NO → Enter phone (+91 XXXXX XXXXX)
                ↓
            WhatsApp OTP (WATI)
                ↓
            User enters OTP
                ↓
            Phone verified
                ↓
            Action proceeds
```

**Actions Requiring Phone:**

- Submit property inquiry
- Save property to favorites
- Start chat with Partner
- Book site visit
- Purchase service

**Actions NOT Requiring Phone:**

- Browse listings
- Search/filter
- View property details
- Read blog posts

**Implementation:**

```typescript
// Middleware guard
function requirePhoneVerification(user: User) {
  if (!user.phoneVerified) {
    return redirect('/verify-phone');
  }
}
```

---

## 3\. PERSONAS & USER JOURNEYS

### 3.1 ADMIN Persona — Vikram (Platform Owner)

**Device:** Desktop (80%), Mobile (20%)  
**Core Fear:** An agent will bypass him and cut a deal with a builder without him knowing.

**Vikram's Daily Workflow:**

1. Opens `/admin` → Revenue Dashboard snapshot (leads closed this week, escrow held, services sold)
2. Clicks "Property Queue" → approves 3 listings, rejects 1 with note: _"Cover photo blurry, reupload."_
3. Clicks "Lead Dispatch" → sees 5 unassigned inquiries → assigns each to Partners
4. Checks "Lead Monitor" → sees Partner Ravi has had a lead 4 days with no activity → sends internal note
5. Reviews KYC queue → verifies a new builder's RERA certificate

**Vikram's User Stories:**

- _"As Admin, I want to see ALL leads in one place so I can assign them immediately."_
- _"As Admin, I want to be notified the moment a Partner marks a deal Closed so I can review escrow release."_
- _"As Admin, I want to see a Partner's full activity log so I know they're not cutting me out."_
- _"As Admin, I want to publish blog articles and update service prices without touching code."_

**Admin's Critical Screens:**

|     |     |     |
| --- | --- | --- |
| Screen | Route | Purpose |
| Revenue Dashboard | `/admin` | MTD revenue, escrow held/released, services sold, leads funnel |
| Lead Dispatch Center | `/admin/leads` | Assign unassigned leads to Partners |
| Lead Monitor | `/admin/leads/monitor` | Watch ALL Partner activity in real time |
| Property Queue | `/admin/properties` | Approve/Reject pending listings |
| KYC Queue | `/admin/kyc` | Verify Partner identity documents |
| Global CMS | `/admin/cms` | Blogs, banners, service catalog |
| Audit Logs | `/admin/logs` | Every admin action, timestamped |
| User Management | `/admin/users` | All users and partners |
| Partner Analytics | `/admin/partners` | Performance metrics per Partner |

---

### 3.2 PARTNER Persona — Ravi (Real Estate Agent, Bangalore)

**Device:** Mobile-first (70% mobile, 30% desktop)  
**Context:** 8 years experience, 40+ listings in Whitefield/Sarjapur. Joined for high-quality leads. Must document every visit (photos, notes) to prove work and maintain platform standing.

**Day 1 — Onboarding:**

1. Registers at `/register` → selects "I am an Agent/Builder/Advisor"
2. Lands on Partner Panel with banner: _"Your account is under review. Upload your verification documents to unlock full access."_
3. Uploads RERA certificate + Aadhar + Business PAN → `kycStatus: PENDING_REVIEW`
4. Admin verifies → Ravi gets email + in-app: "Account verified! You can now list properties and receive leads."

**Day 2 — Listing a Property:**

1. Clicks "Add New Listing" → chooses Single Listing Wizard / Bulk Upload / Microsite Builder
2. Fills details, submits → status: "Pending Admin Approval"
3. Next day: notification → "Your listing 'Whitefield 3BHK' has been **Approved**!"

**Day 3 — Receiving and Working a Lead:**

1. Notification: "New lead assigned! Ananya Kumar is interested in your Sarjapur 2BHK."
2. Opens CRM → sees lead with buyer phone masked: `+91 98765 XXXXX`
3. Clicks "Schedule Site Visit" → date/time picker → OTP sent to buyer via WhatsApp
4. At site, buyer verbally shares OTP → Ravi enters it → full phone number revealed
5. After visit: uploads 3 photos, adds notes, changes status to "Site Visit Done"
6. Deal closes → uploads signed token receipt PDF → "Mark as Closed"
7. Notification: "Deal closed! Escrow release pending Admin review."

**Ravi's User Stories:**

- _"As a Partner, I want to see only MY assigned leads, not every lead."_
- _"As a Partner, I want to upload visit photos from my mobile phone on-site."_
- _"As a Partner, I need a simple step-by-step wizard to add a listing."_
- _"As a Partner, I want to access the B2B tab to find properties when my inventory doesn't match."_
- _"As a Partner, I want to track my deal closures and escrow status."_

**Partner's Key Screens:**

|     |     |     |
| --- | --- | --- |
| Screen | Route | Purpose |
| Dashboard Home | `/partner` | My listings, active leads, notifications summary |
| Add Listing (Wizard) | `/partner/listings/new` | Step-by-step single listing form |
| Bulk Upload | `/partner/listings/bulk` | CSV + image upload for many properties |
| Microsite Builder | `/partner/projects/new` | Step-by-step wizard for large projects (single template, CMS fields) |
| My Listings | `/partner/listings` | All submitted listings + publish status |
| My Leads (CRM) | `/partner/leads` | Only leads assigned to this Partner |
| Lead Detail | `/partner/leads/[id]` | Buyer info, visit scheduling, notes, closure docs |
| B2B Network | `/partner/b2b` | Hidden inventory (open to all verified Partners) |
| Deal & Escrow Tracker | `/partner/finance` | Deal closures, escrow status |
| Profile & KYC | `/partner/profile` | Personal info + document uploads |

---

### 3.3 USER Persona — Priya (IT Professional, Hyderabad, First-Time Buyer)

**Device:** Mobile (90%)  
**Context:** Earns ₹1.4L/month, wants 2BHK flat under ₹60L in Gachibowli. Burned by fake listings before. Wants: verified properties, upfront pricing, clear paper trail.

**Discovery:**

1. Lands on homepage → types "2BHK flat Gachibowli under 60L"
2. Filters: Property Type=Flat, Listing Type=Buy, Budget=₹40L–₹60L, BHK=2
3. Sees 18 results. Trusts "RealtyDoor Verified" badge listings first
4. Clicks listing → sees photos, carpet area, RERA number, "Approved by HDFC" badge
5. Checks "Locality Insights": Gachibowli avg ₹5,200/sqft; this property ₹4,900/sqft — "Good deal"
6. Uses EMI calculator: ₹55L at 8.5% for 20 years = ₹47,788/month

**Inquiry → Site Visit:**

1. Clicks "Contact / Book Visit" → prompted to register if not logged in
2. Sees confirmation: "Your inquiry has been received! Our team will contact you within 24 hours."
3. Admin assigns to Partner Ravi
4. Priya gets WhatsApp: _"Hi Priya! Ravi from RealtyDoor will be your point of contact..."_
5. Gets WhatsApp: "Your OTP for the RealtyDoor site visit is: 7342. Share this with your agent."
6. At property, shares OTP → visit logged → status: "Site Visit Done"

**Post-Visit:**

1. WhatsApp bot: "How was your visit? Did you decide to move forward? (Yes / No / Still Deciding)"
2. Priya: "Still Deciding" → status updated → Admin sees this
3. Two weeks later, decides to buy → uses Document Vault to upload PAN and salary slips
4. Tracks loan status: "Documents Verified → Sent to HDFC → Awaiting Sanction"
5. Pays ₹1L token via RealtyDoor Escrow (**mandatory** for all deal closures — includes refund protection)

**Post-Purchase (NRI scenario):**

1. Priya moves to US, rents flat → buys "Annual Maintenance" plan (₹5,999/year)
2. Tenant reports bathroom tap broken → Priya raises service ticket from dashboard
3. Admin dispatches plumber, uploads before/after photos
4. Priya reviews from US → clicks "Verify Fix" → ticket closed

**Priya's User Stories:**

- _"As a buyer, I want to filter by BHK, budget, and locality to find relevant properties fast."_
- _"As a buyer, I want to see verified listings with RERA numbers."_
- _"As a buyer, I want to track my inquiry status live."_
- _"As a buyer, I want an OTP before the site visit so it's formally recorded."_
- _"As an NRI, I want to raise a maintenance ticket from abroad and see photo proof it was resolved."_
- _"As a buyer, I want to upload KYC documents and track my home loan in one place."_

**User's Key Screens:**

|     |     |     |
| --- | --- | --- |
| Screen | Route | Purpose |
| Homepage | `/` | Search, featured properties, services overview |
| Properties Listing | `/properties` | Filtered search results |
| Property Detail | `/properties/[slug]` | Full listing with EMI calc, locality insights |
| User Dashboard | `/dashboard` | Favorites, inquiries, loan status |
| My Inquiries | `/dashboard/inquiries` | Status tracker for all submitted inquiries |
| Document Vault | `/dashboard/vault` | Upload KYC/loan docs |
| Loan Tracker | `/dashboard/loan` | Bank processing status |
| My Services | `/dashboard/services` | Purchased plans + tickets |
| Service Tickets | `/dashboard/services/[id]` | Ticket detail, resolution photos |

---

## 4\. KEY INTERACTION PATTERNS

### Pattern 1: Inquiry Submission

```
User clicks "Contact"
→ If not logged in: show auth modal
→ After login: show inquiry form (name, phone pre-filled, message)
→ POST /api/leads
→ Save Lead { status: UNASSIGNED }
→ Show success toast: "We'll reach out within 24 hours"
→ Create Notification for Admin: "New unassigned lead"
→ Update /dashboard/inquiries: new entry visible
```

**Edge Cases:**

- **Security:** Unauthorized inquiry submission, XSS in message field, data exposure in notifications
- **Performance:** Form submission timeout, notification delay, inquiry queue backlog
- **Data Integrity:** Duplicate inquiry submissions, orphaned leads, concurrent status updates
- **Third-Party:** Email notification failure, auth service downtime, database connection failure
- **UX:** User submits without logging in, duplicate contact clicks, phone number validation fails

### Pattern 2: Lead Assignment (Admin Side)

```
Admin opens /admin/leads
→ Sees inquiry cards: buyer name, property, message, timestamp
→ Clicks "Assign to Partner" dropdown
→ Selects Partner from list
→ PATCH /api/leads/[id] { assignedPartnerId, status: ASSIGNED }
→ Create Notification for Partner: "New lead assigned"
→ Create AuditLog: { action: LEAD_ASSIGNED, adminId, leadId }
→ Lead moves from UNASSIGNED queue to ASSIGNED queue
```

**Edge Cases:**

- **Security:** Unauthorized lead assignment, partner impersonation, audit log tampering
- **Performance:** Lead loading delay, assignment queue backlog, notification delay
- **Data Integrity:** Duplicate assignment, orphaned leads, concurrent assignment attempts
- **Third-Party:** Email notification failure, database connection failure, audit log service failure
- **UX:** Partner unavailable for assignment, lead already assigned, wrong partner selected

```
### Pattern 3: OTP Verification (Anti-Leakage Core Flow)
```

Partner clicks "Schedule Site Visit" on lead  
→ Date/time picker appears  
→ On confirm: POST /api/leads/\[id\]/schedule-visit  
→ Generate random 4-digit OTP, save to lead.siteVisitOTP  
→ Send OTP to buyer via WhatsApp (WATI API)  
→ Partner sees: "OTP sent to buyer on WhatsApp. Enter OTP at the site to verify visit."  
→ \[At Site\] Partner enters OTP  
→ POST /api/leads/\[id\]/verify-otp { otp: "7342" }  
→ If OTP matches: isOtpVerified: true, phone number revealed  
→ If OTP mismatch: show error, allow retry (max 3 attempts)  
→ After 3 failed attempts: lock OTP verification, require Admin override

```
**Edge Cases:**
- **Security:** OTP brute force attacks, unauthorized OTP generation, OTP exposure in logs
- **Performance:** WATI API timeout, OTP verification delay, concurrent OTP attempts
- **Data Integrity:** OTP expired before verification, duplicate OTP generation, concurrent verification attempts
- **Third-Party:** WATI service down, WhatsApp delivery failure, phone service unavailable
- **UX:** OTP not received, OTP expired, maximum retry attempts exceeded

### Pattern 4: Property Listing Submission
```

Partner fills listing form  
→ POST /api/properties  
→ Save with publishStatus: PENDING_APPROVAL  
→ Show partner: "Submitted for review. Usually approved within 24 hours."  
→ Create Notification for Admin: "New property pending review"  
→ Admin reviews → clicks Approve or Reject (with note)  
→ PATCH /api/properties/\[id\] { publishStatus: APPROVED/REJECTED }  
→ Notification sent to Partner  
→ If APPROVED: property appears in public search

```
**Edge Cases:**
- **Security:** Unauthorized listing submission, malicious image uploads, data exposure in notifications
- **Performance:** Form submission timeout, image upload delay, approval queue backlog
- **Data Integrity:** Duplicate listing submissions, orphaned properties, concurrent approval attempts
- **Third-Party:** File storage service failures, email notification failures, database connection failure
- **UX:** Image upload fails, validation errors, approval delay

### Pattern 5: Phone Verification (Lazy Verification) [MVP]
```

User logs in via Google (Clerk)  
→ No phone required at signup  
→ User browses properties (no phone needed)  
→ User tries action requiring phone (inquiry, save property, chat, book visit, purchase service)  
→ If phoneVerified: false → redirect to /verify-phone  
→ User enters phone (+91 XXXXX XXXXX)  
→ WhatsApp OTP sent via WATI API  
→ User enters OTP  
→ phoneVerified: true  
→ Action proceeds

```
**Edge Cases:**
- **Security:** SMS spoofing attempts, rate limit on OTP requests, unauthorized OTP generation
- **Performance:** WATI API timeout, slow OTP delivery, concurrent OTP requests
- **Data Integrity:** Phone number already in use, duplicate verification attempts
- **Third-Party:** WATI service down, WhatsApp delivery failures, API quota exceeded
- **UX:** User abandons verification, OTP expired before entry, invalid OTP multiple attempts

### Pattern 6: Partner Onboarding/KYC Flow [MVP]
```

Partner registers via platform  
→ Fill registration form (name, email, phone, company details)  
→ Upload KYC documents (RERA certificate, ID proof, address proof)  
→ POST /api/partner/register  
→ Save Partner { status: PENDING_KYC, kycDocuments }  
→ Show partner: "KYC under review. Usually verified within 24 hours."  
→ Create Notification for Admin: "New partner KYC pending review"  
→ Admin reviews KYC documents  
→ Admin clicks "Verify" or "Reject" (with note)  
→ PATCH /api/partner/\[id\] { status: VERIFIED/REJECTED }  
→ If VERIFIED: Partner gains full panel access  
→ If REJECTED: Partner can resubmit KYC

```
**Edge Cases:**
- **Security:** Malicious file uploads, KYC document forgery attempts, XSS in company details
- **Performance:** Large file upload timeouts, slow file processing, concurrent registration attempts
- **Data Integrity:** Duplicate registration attempts, orphaned KYC documents, file corruption
- **Third-Party:** File storage service failures, email notification failures
- **UX:** Partner abandons registration, admin rejects KYC multiple times, confusing upload interface

### Pattern 7: Property Approval Flow [MVP]
```

Partner submits property listing (Pattern 4)  
→ Listing status: PENDING_APPROVAL  
→ Admin opens /admin/properties  
→ Sees pending approval queue  
→ Clicks property to review  
→ Reviews listing details, photos, compliance  
→ Admin clicks "Approve" or "Reject" (with note)  
→ PATCH /api/properties/\[id\] { publishStatus: APPROVED/REJECTED }  
→ Notification sent to Partner  
→ If APPROVED: property goes live in public search  
→ If REJECTED: Partner can edit and resubmit

```
**Edge Cases:**
- **Security:** Unauthorized approval attempts, CSRF on approval action, data exposure in queue
- **Performance:** Property approval queue backlog, slow photo loading, concurrent approval attempts
- **Data Integrity:** Property data corruption, concurrent approval conflicts, orphaned photos
- **Third-Party:** Email notification failures, image processing service failures
- **UX:** Admin rejects property multiple times, Partner doesn't resubmit, confusing rejection notes

### Pattern 8: Staff Coordination (Visit Scheduling) [MVP]
```

Partner requests visit via platform (Pattern 3)  
→ Date/time picker appears  
→ On confirm: POST /api/leads/\[id\]/schedule-visit  
→ Generate random 4-digit OTP, save to lead.siteVisitOTP  
→ Automated WhatsApp (WATI) sends OTP to Buyer: "Visit OTP: {otp}. Share with your agent."  
→ Admin staff sees visit request in dashboard  
→ Admin staff calls Buyer to confirm visit details and answer questions  
→ Admin staff calls Partner to coordinate timing and provide context  
→ Partner never sees Buyer's phone number at any point  
→ \[At Site\] Buyer verbally shares OTP to Partner  
→ Partner enters OTP → isOtpVerified: true → phone number revealed → direct communication allowed

```
**Edge Cases:**
- **Security:** Duplicate visit scheduling, staff availability conflicts, unauthorized OTP access
- **Performance:** WATI API timeout, slow dashboard loading, concurrent visit requests
- **Data Integrity:** OTP expired before visit, duplicate OTP generation, visit data inconsistency
- **Third-Party:** WATI service down, WhatsApp delivery failures, phone service unavailable
- **UX:** Buyer doesn't answer phone, Buyer requests reschedule, Visit cancelled by Buyer

### Pattern 9: Deal Closure [MVP]
```

Partner uploads visit documentation (photos, notes)  
→ POST /api/leads/\[id\]/upload-docs  
→ Save documentation to lead.visitDocs  
→ Partner marks lead as "Closed"  
→ PATCH /api/leads/\[id\] { status: CLOSED }  
→ Create Notification for Admin: "Deal closed! Escrow release pending review."  
→ Admin receives closure notification  
→ Admin reviews closure documentation  
→ Inngest job enqueued: fires T+24h to send WhatsApp feedback message to Buyer via WATI  
→ WhatsApp message to Buyer: "Did you finalize with \[Partner Name\]? (Yes / No / Still Deciding)"  
→ Buyer response updates buyerFeedbackStatus  
→ If buyer says "Yes" but Partner marked "Dropped": Admin flagged with discrepancy alert  
→ Deal closure confirmed

```
**Edge Cases:**
- **Security:** Concurrent closure attempts, unauthorized closure, data exposure in notifications
- **Performance:** Slow document upload, closure queue backlog, Inngest job failure
- **Data Integrity:** Deal data inconsistency, orphaned closure docs, concurrent status updates
- **Third-Party:** WATI API failure, WhatsApp delivery failure, email notification failure
- **UX:** Partner marks closed without documentation, Buyer feedback timeout, Discrepancy between Partner and Buyer feedback

### Pattern 10: Escrow Flow (Razorpay Route) [MVP]
```

Buyer clicks "Pay Token" on property  
→ POST /api/escrow/create-order  
→ razorpay.orders.create({ amount, currency: "INR", transfers: \[{ account: platformAccountId, amount: platformFee, on_hold: true }\] })  
→ Razorpay checkout opens  
→ Buyer completes payment  
→ Razorpay webhook: payment.captured  
→ Create EscrowTransaction { status: HELD, razorpayPaymentId, razorpayOrderId }  
→ Admin reviews allocation letter uploaded by Partner  
→ Admin clicks "Release Escrow"  
→ PATCH /api/admin/escrow/\[id\]/release  
→ razorpay.payments.transfer(paymentId, { transfers: \[{ account: sellerAccountId, amount: releaseAmount }\] })  
→ EscrowTransaction { status: RELEASED }  
→ If deal falls through → Admin clicks "Refund"  
→ POST /api/admin/escrow/\[id\]/refund  
→ razorpay.payments.refund(paymentId, { amount })  
→ EscrowTransaction { status: REFUNDED }

```
**Edge Cases:**
- **Security:** Double-spending prevention, unauthorized refund attempts, transaction tampering
- **Performance:** Razorpay API timeout, slow webhook processing, refund processing timeout
- **Data Integrity:** Transaction rollback failures, platform fee calculation error, duplicate escrow records
- **Third-Party:** Razorpay Route API down, seller account not linked to Razorpay, webhook failures
- **UX:** Escrow release fails, refund processing delay, confusing escrow status

### Pattern 11: Service Purchase Flow [MVP]
```

User clicks "Buy Service" on service listing  
→ POST /api/services/create-order  
→ razorpay.orders.create({ amount, currency: "INR" })  
→ Client-side Razorpay checkout opens  
→ User pays  
→ Razorpay webhook: payment.captured  
→ Update UserSubscription { paymentStatus: SUCCESS, razorpayPaymentId }  
→ Trigger email B.9 (Service Activated)  
→ Create Ticket for service delivery  
→ Admin dispatches vendor  
→ Vendor uploads photos/notes of work  
→ User verifies work completion  
→ User marks ticket VERIFIED_BY_USER

```
**Edge Cases:**
- **Security:** Duplicate subscription attempts, unauthorized service access, subscription billing errors
- **Performance:** Razorpay checkout timeout, slow subscription creation, vendor dispatch delay
- **Data Integrity:** Duplicate ticket creation, ticket status inconsistency, subscription data corruption
- **Third-Party:** Razorpay payment fails, vendor not available, email notification failures
- **UX:** Service out of stock, User cancels subscription, service delivery timeout

### Pattern 12: Document Vault Flow [MVP]
```

User uploads documents for loan processing  
→ POST /api/documents/upload  
→ Save Document { userId, type, status: PENDING, fileUrl }  
→ Admin reviews documents  
→ Admin clicks "Approve" or "Reject"  
→ PATCH /api/documents/\[id\] { status: APPROVED/REJECTED }  
→ Partner (lender/builder) accesses vault via /partner/document-vault  
→ Partner views approved documents  
→ Document status tracked (PENDING, APPROVED, REJECTED)  
→ User tracks loan application status via /user/document-vault  
→ Note: Under-construction progress tracking is Phase 2

```
**Edge Cases:**
- **Security:** Unauthorized document access, document version conflicts, data exposure
- **Performance:** File upload timeout, slow document processing, vault access delay
- **Data Integrity:** Document corrupted, orphaned documents, document approval timeout
- **Third-Party:** File storage service failures, email notification failures
- **UX:** Document validation fails, Partner rejects document, confusing vault interface

### Pattern 13: B2B Collaboration Flow [Phase 2]
```

Partner (with premium subscription) clicks B2B tab  
→ Views hidden inventory (gated behind premium subscription)  
→ Partner expresses interest in property  
→ POST /api/b2b/express-interest  
→ Create B2BConnection { listingPartnerId, buyerPartnerId, propertyId, status: PENDING }  
→ Notification sent to listing Partner  
→ Notification sent to Admin: "Partner \[buyerPartner\] interested in \[listingPartner\]'s B2B listing"  
→ Admin monitors all B2B connections from /admin/b2b-connections  
→ Partners connect offline for deal  
→ Admin can track B2B activity and potential offline closures  
→ Subscription-based access control (₹4,999/month)

```
**Edge Cases:**
- **Security:** Unauthorized B2B access attempts, subscription payment failures, data exposure
- **Performance:** B2B inventory loading delay, connection creation timeout, subscription check delay
- **Data Integrity:** Duplicate connection requests, orphaned connections, B2B property already sold
- **Third-Party:** Razorpay subscription payment fails, email notification failures
- **UX:** Premium subscription expired, Partner unsubscribes mid-connection, connection request rejected

### Pattern 14: Under-Construction Progress Updates [Phase 2]
```

Builder uploads progress photos/updates for under-construction project  
→ POST /api/projects/\[id\]/progress-update  
→ Save ProjectProgress { projectId, photos, description, milestone, date }  
→ Users subscribed to project receive notification  
→ POST /api/notifications/send-project-update  
→ WhatsApp/email sent to subscribed users: "Progress update for \[Project Name\]: \[milestone\]"  
→ Progress timeline tracked in platform  
→ Users view progress timeline via /user/projects/\[id\]/progress  
→ Users monitor construction milestones (foundation, structure, finishing, handover)  
→ NRI feature: Video tours and live updates for remote buyers

```
**Edge Cases:**
- **Security:** Unauthorized progress updates, notification spam prevention, data exposure
- **Performance:** Large photo uploads, progress notification delay, timeline loading delay
- **Data Integrity:** Milestone data invalid, orphaned progress records, project completion delayed
- **Third-Party:** Email notification failures, WhatsApp delivery failures, file storage failures
- **UX:** Photo upload fails, User unsubscribes from updates, confusing timeline interface

### Pattern 15: Ticket Resolution Flow [MVP]
```

User purchases service (Pattern 11)  
→ Ticket created automatically: { status: PENDING, serviceId, userId }  
→ Admin sees ticket in /admin/tickets  
→ Admin reviews ticket details  
→ Admin selects vendor from vendor list  
→ Admin clicks "Dispatch Vendor"  
→ PATCH /api/tickets/\[id\]/dispatch { vendorId }  
→ Notification sent to vendor: "New ticket assigned"  
→ Vendor receives ticket details  
→ Vendor performs work  
→ Vendor uploads photos/notes of work completion  
→ POST /api/tickets/\[id\]/upload-evidence  
→ Save evidence to ticket.evidence  
→ User receives notification: "Work completed, please verify"  
→ User reviews photos/notes  
→ User clicks "Verify" or "Reject"  
→ PATCH /api/tickets/\[id\] { status: VERIFIED_BY_USER / REJECTED }  
→ If VERIFIED: Ticket closed, service marked complete  
→ If REJECTED: Vendor must redo work

```
**Edge Cases:**
- **Security:** Unauthorized ticket access, duplicate ticket creation, ticket status inconsistency
- **Performance:** Ticket queue backlog, vendor dispatch delay, evidence upload timeout
- **Data Integrity:** Ticket abandoned, vendor doesn't respond, ticket data corruption
- **Third-Party:** Vendor not available, email notification failures, file storage failures
- **UX:** User rejects work multiple times, Vendor uploads invalid evidence, Service unavailable

### Pattern 16: Microsite Builder Flow [MVP]
```

Partner clicks "Add New Listing"  
→ Chooses "Microsite Builder" option  
→ Redirect to /partner/projects/new  
→ Step 1: Project details (name, location, total units, amenities)  
→ Step 2: Upload project photos (hero, amenities, floor plans)  
→ Step 3: CMS fields (project description, pricing, specifications)  
→ Step 4: Unit configurations (type, size, price per sqft)  
→ POST /api/projects/create  
→ Save Project { status: PENDING_APPROVAL, isMicrosite: true }  
→ Show partner: "Microsite submitted for review. Usually approved within 24 hours."  
→ Admin reviews microsite  
→ Admin clicks "Approve" or "Reject" (with note)  
→ PATCH /api/projects/\[id\] { status: APPROVED/REJECTED }  
→ If APPROVED: microsite goes live at /properties/\[project-slug\]  
→ If REJECTED: Partner can edit and resubmit  
→ Note: Single fixed-layout template for MVP (template variants Phase 2)

````
**Edge Cases:**
- **Security:** Concurrent editing conflicts, CMS data corruption, unauthorized CMS access
- **Performance:** Photo upload quota exceeded, CMS field validation timeout, template rendering error
- **Data Integrity:** Unit configuration invalid, CMS field validation fails, microsite approval timeout
- **Third-Party:** File storage failures, email notification failures, image processing failures
- **UX:** Confusing CMS interface, Partner abandons builder, template rendering errors

---

## 5. ANTI-LEAKAGE ENGINE

The Indian real estate market will attempt to bypass the platform at every opportunity. These are the system-level traps:

### Leakage 1: Partner Lying About Deal Outcome
- **Scenario:** Partner closes deal offline and marks lead "Dropped" to bypass platform escrow
- **Trap:** After OTP verification, Partner CANNOT mark lead "Dropped" without buyer WhatsApp confirmation
- **Mechanism:** 24h after `isOtpVerified = true`, automated WhatsApp bot messages buyer: *"Did you finalize with [Partner Name]? (Yes / No / Still Deciding)"* — Buyer response updates `buyerFeedbackStatus`. If buyer says "Yes" but Partner marked "Dropped", Admin is immediately flagged with a discrepancy alert

### Leakage 2: Partner Sharing Buyer Contact Before OTP
- **Scenario:** Partner gets buyer's number from system and contacts them offline before visit is logged
- **Trap:** Partner CANNOT see buyer's full phone number until site visit OTP is verified
- **Mechanism:** Buyer phone stored as `buyerPhone` but API response to PARTNER shows `buyerMaskedPhone` = `+91 98765 XXXXX`. Full number only reveals after `isOtpVerified: true`
- **Visit Scheduling Flow:**
  1. Partner requests visit via platform (picks date/time)
  2. Automated WhatsApp (WATI) sends OTP to Buyer: "Visit OTP: {otp}. Share with your agent."
  3. Admin staff (existing employee) calls Buyer to confirm visit details and answer questions
  4. Admin staff calls Partner to coordinate timing and provide context
  5. Partner never sees Buyer's phone number at any point
  6. At site visit, Buyer verbally shares OTP to Partner
  7. Partner enters OTP → phone number revealed → direct communication allowed

### Leakage 3: Builder Claiming Walk-In (No Platform Credit)
- **Scenario:** Buyer visits a project, builder claims the buyer came directly (no platform involvement)
- **Trap:** Token advance payment through RealtyDoor Escrow is **mandatory** for every deal closure. Buyer benefits: 100% Refund Protection + Free Title Verification.
- **Mechanism:** No deal can be marked as CLOSED without a corresponding Razorpay Route escrow payment. This creates an irrefutable digital record (with Razorpay payment ID) that the buyer came through RealtyDoor. Builder cannot deny when invoiced.

### Leakage 4: Partners Sharing Vendor Contacts (Services)
- **Scenario:** Admin dispatches vendor, user contacts vendor directly for future work
- **Trap:** Service resolution is documented on platform (photos, notes). Users are told: "If booked outside RealtyDoor, damage insurance is void."
- **Mechanism:** User marks ticket `VERIFIED_BY_USER` to close. This creates a quality trail and discourages bypassing to vendor directly.

### Anti-Leakage Code Enforcement Rules
```typescript
// Rule 1: Buyer phone MUST be masked in all API responses to PARTNER
// until lead.isOtpVerified === true
function formatPhone(phone: string, isVerified: boolean) {
if (!isVerified) return phone.slice(0, 6) + "XXXXX";
return phone;
}

// Rule 2: Partner can ONLY see leads where assignedPartnerId === session.user.id
where: { assignedPartnerId: session.user.id }

// Rule 3: Property cannot be set to publishStatus: APPROVED by Partner
// Only ADMIN can change publishStatus
const forbiddenFields = ['publishStatus', 'isVerified', 'partnerId'];

// Rule 4: ALL OTPs and transactional messages go via WhatsApp (WATI API) — NO SMS
// Rule 5: WhatsApp feedback bot MUST fire 24h after isOtpVerified = true
// Vercel cron: check leads where isOtpVerified=true AND otpVerifiedAt < now-24h AND whatsappSentAt=null

// Rule 6: Escrow payment is MANDATORY before a deal can be marked CLOSED
// Lead cannot transition to CLOSED unless an EscrowTransaction with status HELD exists
const escrow = await db.escrowTransaction.findFirst({ where: { leadId: lead.id, status: 'HELD' } });
if (!escrow) throw new Error('Escrow payment required before closing deal');

// Rule 7: "Mark as Closed" is irreversible by Partner
if (lead.status === 'CLOSED') throw new Error('Cannot reopen closed lead');
if (session.user.role !== 'ADMIN' && lead.status === 'CLOSED') throw new Error('Unauthorized');
````

---

## 6\. DATABASE SCHEMA (Prisma / MongoDB)

```prisma
datasource db {
provider = "mongodb"
url = env("DATABASE_URL")
}

generator client {
provider = "prisma-client-js"
}

// --- ENUMS ------------------------------------------------
enum Role { USER PARTNER ADMIN }
enum PartnerSubType { AGENT BUILDER ADVISOR OWNER }
enum PropertyType { FLAT INDEPENDENT_HOUSE VILLA PLOT COMMERCIAL_OFFICE RETAIL_SHOP }
enum ListingType { SALE RENT LEASE }
enum PublishStatus { PENDING_APPROVAL APPROVED REJECTED ARCHIVED }
enum PropertyStatus { READY_TO_MOVE UNDER_CONSTRUCTION SOLD RENTED }
enum LeadStatus { UNASSIGNED ASSIGNED SITE_VISIT_SCHEDULED SITE_VISIT_DONE CLOSED DROPPED }
// Phase 2: enum CommissionStatus { PENDING INVOICED COLLECTED DISPUTED }
enum KycStatus { NOT_SUBMITTED PENDING_REVIEW VERIFIED REJECTED }
enum TicketStatus { OPEN IN_PROGRESS RESOLVED VERIFIED_BY_USER }
enum EscrowStatus  { HELD RELEASED REFUNDED }

// --- USER (covers all 3 roles) ---------------------------
model User {
id String @id @default(auto()) @map("_id") @db.ObjectId
name String
email String @unique
phone String @unique
hashedPassword String?
role Role @default(USER)
isNRI Boolean @default(false)
// Partner-specific
partnerSubType PartnerSubType?
companyName String?
bio String?
profileImageUrl String?
websiteUrl String?
// KYC
kycStatus KycStatus @default(NOT_SUBMITTED)
kycDocumentUrls String[]
kycRejectionNote String?
kycVerifiedAt DateTime?
// Phase 2 — Premium B2B (not active in MVP):
// isPremiumPartner Boolean @default(false)
// premiumValidUntil DateTime?
// premiumOrderId String?
// Timestamps
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
// Relations
properties Property[]
assignedLeads Lead[] @relation("PartnerLeads")
userDocuments UserDocument[]
subscriptions UserSubscription[]
tickets ServiceTicket[]
notifications Notification[]
b2bListings B2BConnection[] @relation("ListingPartner")
b2bCollabs B2BConnection[] @relation("BuyerPartner")
videoTourRequests VideoTourRequest[]
}

// --- PROPERTY --------------------------------------------
model Property {
id String @id @default(auto()) @map("_id") @db.ObjectId
title String
slug String @unique
description String
price Float?
monthlyRent Float?
priceNegotiable Boolean @default(false)
propertyType PropertyType
listingType ListingType @default(SALE)
propertyStatus PropertyStatus @default(READY_TO_MOVE)
publishStatus PublishStatus @default(PENDING_APPROVAL)
rejectionNote String?
adminEditNote String?
isFeatured Boolean @default(false)
isFeaturedProject Boolean @default(false)
// Physical Details
bhk Int?
bathrooms Int?
carpetArea Float?
builtUpArea Float?
plotArea Float?
floorNumber Int?
totalFloors Int?
ageOfProperty Int?
furnishing String?
facing String?
possessionDate DateTime?
// Location
address String
locality String
city String
state String
pincode String
latitude Float?
longitude Float?
nearbyLandmarks String[]
// Trust & Verification
isVerified Boolean @default(false)
verifiedAt DateTime?
reraNumber String?
bankApprovals String[]
// B2B Settings
// isB2BOnly Boolean @default(false) // Phase 2
// commissionSplitOffer String? // Phase 2 — not active in MVP
// Media
images String[]
coverImageIndex Int @default(0)
floorPlanUrl String?
// virtualTourUrl String? // Phase 2
// videoUrl String? // Phase 2
// Amenities
amenities String[]
societyFeatures String[]
// SEO
metaTitle String?
metaDescription String?
// Ownership
partnerId String @db.ObjectId
partner User @relation(fields: [partnerId], references: [id])
constructionUpdates ConstructionUpdate[]
leads Lead[]
favorites Favorite[]
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
}

// --- FAVORITES -------------------------------------------
model Favorite {
id String @id @default(auto()) @map("_id") @db.ObjectId
userId String @db.ObjectId
propertyId String @db.ObjectId
property Property @relation(fields: [propertyId], references: [id])
savedAt DateTime @default(now())
}

// --- LEAD ------------------------------------------------
model Lead {
id String @id @default(auto()) @map("_id") @db.ObjectId
buyerName String
buyerEmail String
buyerPhone String
// NOTE: buyerMaskedPhone is NOT stored. Masking is computed at the API layer.
// formatPhone(phone, lead.isOtpVerified) → returns masked string for PARTNER role
buyerId String? @db.ObjectId
buyerMessage String?
propertyId String @db.ObjectId
property Property @relation(fields: [propertyId], references: [id])
status LeadStatus @default(UNASSIGNED)
assignedPartnerId String? @db.ObjectId
assignedPartner User? @relation("PartnerLeads", fields: [assignedPartnerId], references: [id])
assignedAt DateTime?
adminNotes String?
// OTP Anti-Leakage
siteVisitScheduledAt DateTime?
siteVisitOTP String?
otpGeneratedAt DateTime?
otpExpiresAt DateTime? // Set to otpGeneratedAt + 2h on OTP creation
otpAttempts Int @default(0)
otpLockedUntil DateTime?
isOtpVerified Boolean @default(false)
otpVerifiedAt DateTime?
// WhatsApp Cross-Check
whatsappSentAt DateTime?
buyerFeedbackStatus String?
feedbackReceivedAt DateTime?
// Partner Documentation
visitNotes String?
visitPhotoUrls String[]
closureDocumentUrls String[]
partnerNotes String?
// Phase 2 — Commission (not active in MVP):
// platformCommissionPct Float?
// commissionAmount Float?
// commissionStatus CommissionStatus @default(PENDING)
// invoiceUrl String?
// invoicedAt DateTime?
// collectedAt DateTime?
// Escrow
escrowTransactions EscrowTransaction[]
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
}

// --- USER DOCUMENT VAULT ---------------------------------
model UserDocument {
id String @id @default(auto()) @map("_id") @db.ObjectId
userId String @db.ObjectId
user User @relation(fields: [userId], references: [id])
documentType String // PAN_CARD | AADHAR | SALARY_SLIP | FORM_16 | BANK_STATEMENT
fileUrl String
fileName String
isVerified Boolean @default(false)
verifiedAt DateTime?
uploadedAt DateTime @default(now())
}

// --- CONSTRUCTION TRACKER (Phase 2) --------------------------------
model ConstructionUpdate {
id String @id @default(auto()) @map("_id") @db.ObjectId
propertyId String @db.ObjectId
property Property @relation(fields: [propertyId], references: [id])
milestoneTitle String
description String?
mediaUrls String[]
completionPct Int?
postedAt DateTime @default(now())
}

// --- SERVICES --------------------------------------------
model Service {
id String @id @default(auto()) @map("_id") @db.ObjectId
name String
shortDesc String
description String
price Float
category String // MAINTENANCE | CONSTRUCTION | LEGAL | LOAN | VALUATION
features String[]
isActive Boolean @default(true)
sortOrder Int @default(0)
imageUrl String?
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
}

model UserSubscription {
id String @id @default(auto()) @map("_id") @db.ObjectId
userId String @db.ObjectId
user User @relation(fields: [userId], references: [id])
serviceId String @db.ObjectId
razorpayOrderId String @unique
razorpayPaymentId String?
paymentStatus String // PENDING | SUCCESS | FAILED | REFUNDED
amountPaid Float
currency String @default("INR")
startDate DateTime @default(now())
endDate DateTime
tickets ServiceTicket[]
}

model ServiceTicket {
id String @id @default(auto()) @map("_id") @db.ObjectId
userId String @db.ObjectId
user User @relation(fields: [userId], references: [id])
subscriptionId String @db.ObjectId
subscription UserSubscription @relation(fields: [subscriptionId], references: [id])
subject String
description String
category String? // PLUMBING | ELECTRICAL | PAINTING | GENERAL
status TicketStatus @default(OPEN)
priority String @default("NORMAL")
adminNotes String?
resolutionUrls String[]
vendorName String?
vendorPhone String?
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
resolvedAt DateTime?
verifiedAt DateTime?
}

// --- B2B BROKER NETWORK (Phase 2) ----------------------------------
model B2BConnection {
id String @id @default(auto()) @map("_id") @db.ObjectId
listingPartnerId String @db.ObjectId
listingPartner User @relation("ListingPartner", fields: [listingPartnerId], references: [id])
buyerPartnerId String @db.ObjectId
buyerPartner User @relation("BuyerPartner", fields: [buyerPartnerId], references: [id])
propertyId String @db.ObjectId
status String @default("INTERESTED")
message String?
createdAt DateTime @default(now())
}

// --- ESCROW TRANSACTION ---------------------------------
model EscrowTransaction {
id                String        @id @default(auto()) @map("_id") @db.ObjectId
leadId            String        @db.ObjectId
lead              Lead          @relation(fields: [leadId], references: [id])
buyerId           String        @db.ObjectId
razorpayOrderId   String        @unique
razorpayPaymentId String?
amount            Float
currency          String        @default("INR")
status            EscrowStatus  @default(HELD)
heldAt            DateTime      @default(now())
releasedAt        DateTime?
refundedAt        DateTime?
releasedByAdminId String?       @db.ObjectId
adminNote         String?
createdAt         DateTime      @default(now())
updatedAt         DateTime      @updatedAt
}

// --- VIDEO TOUR REQUEST (NRI Feature - Phase 2) --------------------
model VideoTourRequest {
id          String   @id @default(auto()) @map("_id") @db.ObjectId
userId      String   @db.ObjectId
user        User     @relation(fields: [userId], references: [id])
propertyId  String   @db.ObjectId
status      String   @default("PENDING") // PENDING | ASSIGNED | COMPLETED
assignedTo  String?  @db.ObjectId
videoUrl    String?
scheduledAt DateTime?
createdAt   DateTime @default(now())
}

// --- ADMIN CMS -------------------------------------------
model ContentBlock {
id String @id @default(auto()) @map("_id") @db.ObjectId
type String // BLOG | FAQ | HERO_BANNER | TESTIMONIAL | ANNOUNCEMENT | STATS_BAR | NRI_GUIDE | TEAM_MEMBER
title String
slug String? @unique
content String
excerpt String?
imageUrl String?
author String?
tags String[]
isPublished Boolean @default(false)
publishedAt DateTime?
seoTitle String?
seoDesc String?
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
}

// --- NOTIFICATIONS ---------------------------------------
model Notification {
id String @id @default(auto()) @map("_id") @db.ObjectId
userId String @db.ObjectId
user User @relation(fields: [userId], references: [id])
title String
message String
type String
isRead Boolean @default(false)
linkUrl String?
createdAt DateTime @default(now())
}

// --- AUDIT LOG -------------------------------------------
model AuditLog {
id String @id @default(auto()) @map("_id") @db.ObjectId
adminId String @db.ObjectId
action String
targetType String
targetId String
before String?
after String?
ipAddress String?
createdAt DateTime @default(now())
}

// --- CONTACT MESSAGE -------------------------------------
model ContactMessage {
id String @id @default(auto()) @map("_id") @db.ObjectId
name String
email String
phone String?
subject String
message String
userId String? @db.ObjectId
role String?
isRead Boolean @default(false)
createdAt DateTime @default(now())
}
```

---

## 7\. API ROUTES REFERENCE

### Architecture Overview

```
/app
/(public) → Homepage, Property search, Property detail
/dashboard → USER panel (buyers, tenants)
/partner → PARTNER panel (agents, builders)
/admin → ADMIN panel (platform owner)
/api → All API routes (Next.js Route Handlers)
/prisma
schema.prisma → MongoDB schema (Prisma ORM)
/lib
clerk.ts → Clerk server-side auth helpers (replaces NextAuth)
razorpay.ts → Razorpay Payment Gateway + Route (escrow/split) helpers
wati-otp.ts → OTP delivery via WATI WhatsApp Business API
wati.ts → WATI WhatsApp Business API triggers
notifications.ts → In-app notification creator
```

### Payment Infrastructure — Razorpay (Gateway + Route)

> **Decision:** Use **Razorpay** as the single payment provider. It covers payment gateway (collect money) + **Razorpay Route** (hold/split/release money) in one dashboard. No separate bank escrow account needed for MVP.

|     |     |     |
| --- | --- | --- |
| Capability | Razorpay Product | Usage in RealtyDoor |
| Collect service payments | **Payment Gateway** | User buys maintenance/construction/legal services → Razorpay order → `payment.captured` webhook → activate `UserSubscription` |
| Hold token advance | **Route (Escrow)** | Buyer pays ₹X token → funds held in Razorpay Route → released to seller/builder on Admin approval |
| Split on release | **Route (Transfers)** | On escrow release: platform fee auto-deducted, remainder transferred to seller's linked account |
| Refund token | **Route (Reversals)** | If deal falls through → Admin triggers refund → Razorpay reverses held amount to buyer |

**Env vars required:**

```env
RAZORPAY_KEY_ID=rzp_live_xxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxxxxx
RAZORPAY_ROUTE_ACCOUNT_ID=acc_xxxxxxxx # Platform's linked account for Route
```

**Escrow flow (Razorpay Route):**

```
1. Buyer clicks "Pay Token" → POST /api/escrow/create-order
→ razorpay.orders.create({ amount, currency: "INR", transfers: [{ account: platformAccountId, amount: platformFee, on_hold: true }] })
2. Buyer completes payment → Razorpay webhook: payment.captured
→ Create EscrowTransaction { status: HELD, razorpayPaymentId, razorpayOrderId }
3. Admin reviews allocation letter → clicks "Release Escrow"
→ PATCH /api/admin/escrow/[id]/release
→ razorpay.payments.transfer(paymentId, { transfers: [{ account: sellerAccountId, amount: releaseAmount }] })
→ EscrowTransaction { status: RELEASED }
4. Deal falls through → Admin clicks "Refund"
→ POST /api/admin/escrow/[id]/refund
→ razorpay.payments.refund(paymentId, { amount })
→ EscrowTransaction { status: REFUNDED }
```

**Service payment flow (standard gateway):**

```
1. User clicks "Buy Service" → POST /api/services/create-order
→ razorpay.orders.create({ amount, currency: "INR" })
2. Client-side Razorpay checkout opens → User pays
3. Razorpay webhook: payment.captured
→ Update UserSubscription { paymentStatus: SUCCESS, razorpayPaymentId }
→ Trigger email B.9 (Service Activated)
```

### Middleware Rules

```typescript
// Public: /, /properties/*, /services, /blog/*
// Requires USER or above: /dashboard/*
// Requires PARTNER role: /partner/*
// Requires ADMIN role: /admin/*
// If wrong role → redirect to /unauthorized
```

### Public APIs

|     |     |     |
| --- | --- | --- |
| Method | Route | Description |
| GET | `/api/properties` | Search with filters (type, city, bhk, budget, listing type) |
| GET | `/api/properties/[slug]` | Single property detail |
| GET | `/api/services` | All active services |
| GET | `/api/blog` | Published blog posts |
| POST | `/api/leads` | Submit inquiry (requires USER auth) |
| POST | `/api/contact` | General contact form submission |

### User APIs (`/dashboard/*` — requires `USER` role)

|     |     |     |
| --- | --- | --- |
| Method | Route | Description |
| GET | `/api/user/leads` | My submitted inquiries + status |
| POST | `/api/user/favorites` | Save/unsave property |
| GET | `/api/user/documents` | List my uploaded KYC docs |
| POST | `/api/user/documents` | Upload new KYC document |
| GET | `/api/user/subscriptions` | My service subscriptions |
| POST | `/api/user/tickets` | Raise new service ticket |
| PATCH | `/api/user/tickets/[id]` | Verify fix (close ticket) |
| POST | `/api/user/video-tour` | _(Phase 2)_ Request video tour (NRI feature) |

### Partner APIs (`/partner/*` — requires `PARTNER` role + `kycStatus: VERIFIED`)

|     |     |     |
| --- | --- | --- |
| Method | Route | Description |
| POST | `/api/partner/properties` | Create new listing |
| PATCH | `/api/partner/properties/[id]` | Edit my listing |
| GET | `/api/partner/leads` | My assigned leads only |
| POST | `/api/partner/leads/[id]/schedule-visit` | Schedule site visit + trigger OTP |
| POST | `/api/partner/leads/[id]/verify-otp` | Verify OTP, reveal buyer contact |
| PATCH | `/api/partner/leads/[id]/document` | Upload visit photos/closure docs |
| PATCH | `/api/partner/leads/[id]/close` | Mark lead as closed |
| POST | `/api/partner/kyc` | Submit KYC documents |

### Admin APIs (`/admin/*` — requires `ADMIN` role)

|     |     |     |
| --- | --- | --- |
| Method | Route | Description |
| GET | `/api/admin/leads` | All leads (with filters) |
| PATCH | `/api/admin/leads/[id]/assign` | Assign lead to Partner |
| GET | `/api/admin/properties` | All pending + approved + rejected |
| PATCH | `/api/admin/properties/[id]/approve` | Approve listing |
| PATCH | `/api/admin/properties/[id]/reject` | Reject with note |
| GET | `/api/admin/kyc` | All pending KYC submissions |
| PATCH | `/api/admin/kyc/[userId]/verify` | Approve/reject KYC |
| GET | `/api/admin/revenue` | Revenue dashboard data |
| POST | `/api/admin/content` | Create blog/banner |
| GET | `/api/admin/audit-logs` | All admin actions |
| POST | `/api/admin/notifications/broadcast` | Send to all users or segment |
| GET | `/api/admin/partners` | Partner performance metrics |

### Search API — Exact Specification

**Endpoint:** `GET /api/properties`

|     |     |     |     |
| --- | --- | --- | --- |
| Param | Type | Example | Notes |
| `q` | string | `"whitefield flat"` | Full-text on title + description + locality |
| `city` | string | `"Bangalore"` | Exact match, case-insensitive |
| `locality` | string | `"Whitefield"` | Partial match (contains) |
| `propertyType` | string | `"FLAT"` | Enum values |
| `listingType` | string | `"SALE"` | SALE, RENT, LEASE |
| `bhk` | number | `2` | Exact match |
| `minPrice` | number | `4000000` | In absolute rupees |
| `maxPrice` | number | `6000000` | In absolute rupees |
| `minArea` | number | `900` | Carpet area in Sq.Ft |
| `maxArea` | number | `1500` | Carpet area in Sq.Ft |
| `furnishing` | string | `"FULLY_FURNISHED"` |     |
| `propertyStatus` | string | `"READY_TO_MOVE"` |     |
| `isVerified` | boolean | `true` | RealtyDoor Verified only |
| `amenities` | string\[\] | `"Power Backup,Vaastu"` | Comma-separated, AND logic |
| `sort` | string | `"price_asc"` | price_asc, price_desc, newest, area_asc |
| `page` | number | `1` | Default: 1 |
| `limit` | number | `20` | Default: 20, Max: 50 |

**Always apply (non-negotiable):**

```typescript
where: {
publishStatus: "APPROVED", // Never show PENDING or REJECTED to public
isB2BOnly: false, // Never show B2B-only listings to public
}
```

---

## 8\. PUBLIC PORTAL ARCHITECTURE

### Rendering Strategy

|     |     |     |     |
| --- | --- | --- | --- |
| Page | Strategy | Revalidation | Reason |
| Homepage (`/`) | ISR | 60 minutes | Featured listings change; CMS banners update |
| Properties Listing (`/properties`) | SSR | Per request | Search filters are dynamic; must be fresh |
| Property Detail (`/properties/[slug]`) | ISR | 30 minutes | Rarely changes; SEO needs fast load |
| Builder Microsite | ISR | 30 minutes | Same as property detail |
| Services (`/services`) | ISR | 2 hours | Service prices update via Admin CMS |
| Blog Index (`/blog`) | ISR | 30 minutes | New posts added by Admin CMS |
| Blog Post (`/blog/[slug]`) | ISR | 1 hour | Content rarely changes after publish |
| About (`/about`) | SSG | Build time | Fully static content |
| Contact (`/contact`) | SSG | Build time | Fully static, form is client-side |

### Page 1: Homepage (`/`)

**Section 1.1 — Sticky Navigation Bar:**

```
[Logo: RealtyDoor] [Buy] [Rent] [Projects] [Services] [Blog] [Login] [List Property →]
```

- On scroll: glassmorphism `background: rgba(255,255,255,0.9)` + `backdrop-filter: blur(12px)` (light-first nav)
- Mobile: Hamburger menu with slide-in drawer

**Section 1.2 — Hero Section (100vh, dark overlay):**

```
H1: "Find Your Perfect Property in India"
Sub: "Verified listings. Zero fake leads. Expert advisors."

[Buy | Rent | Lease] [Search city, locality, or project name...] [Search →]

Popular: Bangalore · Hyderabad · Pune · Chennai · Mumbai · Delhi
```

- Hero image from Admin CMS (`ContentBlock.type = "HERO_BANNER"`)

**Section 1.3 — Trust Stats Bar:**

```
[ 10,000+ Verified Listings ] [ 500+ Expert Partners ] [ 50+ Cities ] [ ₹500Cr+ Deals Closed ]
```

- Configurable from Admin CMS (`ContentBlock.type = "STATS_BAR"`)
- Animated number counter on scroll-into-view

**Section 1.4 — Browse by Property Type (3×2 grid desktop, horizontal scroll mobile):**

|     |     |
| --- | --- |
| Card | Link |
| Flats & Apartments | `/properties?propertyType=FLAT` |
| Independent Houses | `/properties?propertyType=INDEPENDENT_HOUSE` |
| Villas | `/properties?propertyType=VILLA` |
| Plots & Land | `/properties?propertyType=PLOT` |
| Commercial Spaces | `/properties?propertyType=COMMERCIAL_OFFICE` |
| Retail Shops | `/properties?propertyType=RETAIL_SHOP` |

- Each card: glassmorphism background, hover lift animation

**Section 1.5 — Featured Properties (Embla Carousel):**

- Admin manually features properties (`isFeatured: true`) OR fallback: newest approved from top 5 cities
- Max 12 featured. Property card: cover image, verified badge, title, locality, price/BHK/sqft, \[Contact Now\]

**Section 1.6 — New Launch Projects:**

- Properties where `publishStatus: APPROVED` AND `propertyStatus: UNDER_CONSTRUCTION`
- Project card: "NEW LAUNCH" ribbon, builder company, project name, city, starting price, RERA, \[Explore Project →\]

**Section 1.7 — Our Services (4-column grid):**

- Data from `Service` collection where `isActive: true`, sorted by `sortOrder`

**Section 1.8 — How RealtyDoor Works (3 Steps):**

1. Search & Discover
2. Connect with Experts
3. Move In Worry-Free

**Section 1.9 — Testimonials (Auto-scrolling carousel):**

- Data from `ContentBlock.type = "TESTIMONIAL"`

**Section 1.10 — Latest Blog Articles (3 cards):**

- Newest 3 published blogs

**Section 1.11 — CTA Banner:**

```
"Ready to List Your Property?"
"Join 500+ agents and builders already on RealtyDoor."
[List Your Property Free] [Talk to Our Team]
```

**Section 1.12 — Footer:**

```
Col 1: Logo + tagline + social links
Col 2: Quick Links (Buy, Rent, Services, Blog, Careers, About)
Col 3: Property Types
Col 4: Contact (Phone, Email, WhatsApp, Office address)
Bottom: © RealtyDoor 2025 | Privacy Policy | Terms of Service | Sitemap
```

### Page 2: Properties Listing (`/properties`) — SSR

**Layout (Desktop):** `[Filter Sidebar 25%] | [Results Grid 75%]`  
**Layout (Mobile):** Horizontal filter chips → vertical cards → sticky "Map View" button

**Filter Sidebar:**

1. Listing Type Toggle: Buy / Rent / Lease
2. Property Type checkboxes
3. City dropdown (searchable)
4. Locality input (autocomplete)
5. Budget range slider (₹5L – ₹10Cr)
6. BHK pills (multi-select)
7. Area Sq.Ft Min/Max
8. Property Status
9. Furnishing
10. Amenities (top 8 checkboxes)
11. ☑ RealtyDoor Verified Only
12. ☑ Show B2B Only (hidden — PARTNER role only)
13. Sort: Newest / Price Low-High / Price High-Low / Area Large-Small

**Map View:** Leaflet.js, markers at lat/long, clicking marker shows mini property card popup

**SEO Metadata:**

```typescript
title: `${propertyType} for ${listingType} in ${city} | RealtyDoor`,
description: `Browse verified ${propertyType} for ${listingType} in ${city}. RERA registered, zero fake listings.`
```

### Page 3: Property Detail (`/properties/[slug]`) — ISR 30min

**Layout:**

```
[Image Gallery — Full Width]
[Title + Badges] [Contact Form Card — Sticky Right]
[Price + Key Stats]
[Description]
[Amenities]
[Location Map]
[Locality Insights]
[EMI Calculator]
[Stamp Duty Calculator]
[Under-Construction Tracker — if applicable]
[Similar Properties]
```

**Contact Form Card:** Shows "RealtyDoor Expert" (NOT partner's personal contact — anti-leakage)

**EMI Calculator:**

- Property price pre-filled, loan amount slider (default 80%), interest rate input (default 8.5%), tenure slider (5–30 years)
- Shows: Monthly EMI, Total Interest, Total Amount

**Stamp Duty Calculator:**

```typescript
const stampDutyRates = {
"Karnataka": { male: 0.056, female: 0.056, joint: 0.056 },
"Maharashtra": { male: 0.05, female: 0.04, joint: 0.045 },
"Delhi": { male: 0.06, female: 0.04, joint: 0.05 },
"Telangana": { male: 0.05, female: 0.05, joint: 0.05 },
"Tamil Nadu": { male: 0.07, female: 0.07, joint: 0.07 },
"Uttar Pradesh": { male: 0.07, female: 0.06, joint: 0.065 },
};
const registrationFee = 0.01; // 1% flat (capped ₹30,000 in some states)
```

- Disclaimer: "Rates are approximate. Verify with your sub-registrar."

**Under-Construction Tracker (conditional):** Visible only if `propertyStatus: UNDER_CONSTRUCTION`

**SEO Metadata:**

```typescript
title: `${property.title} | ${property.city} | ₹${formatPrice(property.price)} | RealtyDoor`,
description: `${property.bhk}BHK ${property.propertyType} for ${property.listingType} in ${property.locality}...`,
openGraph: { images: [property.images[0]] }
```

**JSON-LD (Property Detail):**

```typescript
{ "@type": "RealEstateListing", "name": property.title, "price": property.price, ... }
```

### Page 4: Builder Microsite (`/properties/[project-slug]`) — ISR 30min

> **MVP:** One **fixed-layout template** with CMS-editable fields. Partner fills a step-by-step wizard; output is always the same professional, mobile-responsive page. No drag-and-drop builder, no template selection.

**Sections (fixed layout, CMS-populated):**

|     |     |     |     |
| --- | --- | --- | --- |
| #   | Section | CMS Field Type | Partner Input |
| 1   | Hero | Text + Upload | Project name, tagline, hero image |
| 2   | About Project | Rich text + Upload | Builder story, USPs, masterplan image |
| 3   | Configuration Units | Repeater (add/remove) | Unit cards: type (2BHK, 3BHK), area, price, floor plan image |
| 4   | Amenities | Multi-select | Pick from predefined icon grid |
| 5   | Gallery | Multi-upload + URL | Photos (min 5, max 30) + YouTube video URL |
| 6   | Location Advantages | Address + Repeater | Map embed (auto from address), distance list (e.g., "Airport — 12km") |
| 7   | RERA & Approvals | Text fields | RERA number, bank approval names, QR code image |
| 8   | Builder Track Record | Repeater | Past projects: name, year, location, image |
| 9   | Construction Progress | Repeater + Upload | Timeline entries: date, milestone, photo |
| 10  | Contact / Book Now | Auto-generated | Inquiry form + "Pay Token via Escrow" CTA (mandatory for deal closure) |
| 11  | Similar Projects | Auto-generated | System picks 3 projects in same city/locality |

**Microsite Creation Wizard (Partner fills this):**

- Step 1: Project basics (name, tagline, builder name, city, locality)
- Step 2: Configuration units (repeater — add 2BHK, 3BHK etc. with area + price + floor plan)
- Step 3: About + Builder track record
- Step 4: Gallery (drag-to-reorder photos, add video URL)
- Step 5: Location (address auto-populates map; add distance landmarks)
- Step 6: RERA, approvals, construction progress
- Step 7: Review & Submit → `publishStatus: PENDING_APPROVAL`

Admin approves/rejects just like a regular listing. Once approved, microsite goes live at `/properties/[project-slug]`.

### Page 5: Services (`/services`) — ISR 2h

- Hero → Service Cards (one large card per service) → Process → CTA
- Service card: category icon, name, short desc, features list, price, \[Buy Now\]

### Page 6: Blog (`/blog`, `/blog/[slug]`) — ISR

- Blog Index: Featured article + grid, filter by tag (Market Trends / Legal Guide / NRI Corner / City Reports)
- Blog Post: Author, date, read time, cover image, rich text from Markdown, ToC, Related Articles, social share

**JSON-LD (Blog):**

```typescript
{ "@type": "Article", "headline": post.title, "author": { "@type": "Person", "name": post.author }, ... }
```

### Page 7: About (`/about`) — SSG

Sections: Mission Statement, Team, Why RealtyDoor (3 differentiators), By the Numbers, Careers CTA

### Page 8: Contact (`/contact`) — SSG

- Left: contact info + WhatsApp button
- Right: Name / Phone / Email / Subject / Message form → `POST /api/contact`

### Global UI Rules (All Public Pages)

|     |     |
| --- | --- |
| Rule | Detail |
| Font | Inter (Google Fonts) — Headings: 700, Body: 400/500 |
| Primary Color | Deep orange `#FF5722` |
| Glassmorphism | `backdrop-filter: blur(12px)`, `bg: rgba(255,255,255,0.7)` |
| Mobile Breakpoint | 768px. All grids collapse to single column. |
| Loading States | Skeleton shimmer on all data-fetched sections |
| Empty States | Friendly illustration + clear message + primary CTA button |
| Animations | Framer Motion: fade-in-up on scroll for all sections |
| Price Display | `formatINR(price)` → "₹45 Lakhs" or "₹1.2 Crores" |
| Area Display | Always Sq.Ft. Offer toggle to Sq.Yards where applicable |
| WhatsApp Float | Floating button on all public pages (bottom right) → `wa.me/...` |

---

## 9\. ADMIN PANEL SPECIFICATIONS

### Revenue Dashboard (`/admin`)

**Top KPI Cards (This Month vs. Last Month):**

|     |     |
| --- | --- |
| Metric | Calculation |
| Total Leads | Count of all Leads created this month |
| Leads Closed | Count of Leads where `status: CLOSED` |
| Conversion Rate | (Closed / Total) × 100% |
| Escrow Held | Sum of `EscrowTransaction.amount` where `status: HELD` |
| Escrow Released | Sum of `EscrowTransaction.amount` where `status: RELEASED` |
| Service Revenue | Sum of `UserSubscription.amountPaid` where `paymentStatus: SUCCESS` |
| Active Partners | Count of Users where `role: PARTNER` and `kycStatus: VERIFIED` |

**Charts (time range: 7d / 30d / 90d / 1y):**

- **Leads Over Time** — Bar chart: new leads per day
- **Revenue Over Time** — Line chart: escrow held/released + service revenue combined
- **Lead Funnel** — Funnel: Received → Assigned → Site Visit → Closed (with % drop-off)
- **Properties by Type** — Donut: count of approved listings by `propertyType`
- **Top Cities** — Bar: count of approved listings per city

### Partner Performance Analytics (`/admin/partners`)

**Per-Partner Metrics Table:**

|     |     |
| --- | --- |
| Column | Calculation |
| Partner Name | User.name |
| Leads Assigned | Count of Leads where `assignedPartnerId = this partner` |
| Leads Closed | Count where `status: CLOSED` for this partner |
| Conversion Rate | Closed / Assigned × 100% |
| Avg Days to Close | Avg(closedAt - assignedAt) in days |
| Escrow Deals | Count of deals with escrow payments for this partner |
| Active Listings | Count of Properties where `publishStatus: APPROVED` |
| Last Active | Most recent `Lead.updatedAt` for this partner |

**Color Coding:**

- Conversion Rate > 30% → 🟢 Green badge "High Performer"
- Conversion Rate 10–30% → 🟡 Yellow badge "Average"
- Conversion Rate < 10% → 🔴 Red badge "Needs Review"

**Drill-Down (clicking a Partner row →** `/admin/partners/[partnerId]`**):**

- All their leads with full timeline (assigned → visited → closed)
- All their listings with publish status
- Escrow transaction history
- Their KYC documents
- Full audit log of actions related to this partner

### Notification Trigger Map

|     |     |     |     |
| --- | --- | --- | --- |
| Event | Who Gets Notified | Channel | Message |
| New inquiry submitted | Admin | In-app + Email | "New lead: {buyer} interested in {property}" |
| Lead assigned to Partner | Partner | In-app + WhatsApp | "New lead assigned! {buyer} wants to see {property}" |
| Property submitted | Admin | In-app | "New listing pending review: {property title}" |
| Property Approved | Partner | In-app + Email | "Your listing '{title}' is now live!" |
| Property Rejected | Partner | In-app + Email | "Listing rejected. Reason: {note}. Please edit and resubmit." |
| OTP generated for visit | Buyer (User) | WhatsApp | "RealtyDoor Visit OTP: {otp}. Share with your agent." |
| OTP verified | Admin | In-app | "Site visit confirmed: {partner} visited {property} with {buyer}" |
| WhatsApp sent to buyer | —   | WhatsApp Bot | "Did you finalize with {partner}? (Yes/No/Still Deciding)" |
| Buyer confirms close | Admin | In-app + Email | "✅ Deal closed! Review escrow release for {partner}." |
| KYC approved | Partner | In-app + Email | "Your account is verified! Full access enabled." |
| KYC rejected | Partner | In-app + Email | "KYC rejected. Reason: {note}. Please reupload." |
| Service ticket updated | User | In-app + Email | "Ticket #{id} updated: {new status}" |

---

## 10\. PARTNER PANEL SPECIFICATIONS

### Partner Onboarding Workflow

1. External person registers → `role: PARTNER`, `kycStatus: NOT_SUBMITTED`
2. Partner Panel shows **"Verify Your Account"** banner. CRM is locked.
3. Partner uploads RERA cert / Business PAN / Aadhar → `kycStatus: PENDING_REVIEW`
4. Admin reviews KYC Queue → Approves → `kycStatus: VERIFIED`. Full panel unlocks.
5. `AuditLog` created. Partner gets notification.

### Listing Creation Options

**Single Listing Wizard:** Step-by-step form for 1 property

- Step 1: Basic Info (title, type, listing type, price)
- Step 2: Physical Details (BHK, area, floor, furnishing, facing)
- Step 3: Location (address, locality, city, state, pincode, map pin)
- Step 4: Media (min 3 images, max 25; cover image selection)
- Step 5: Amenities & Features (multi-select checkboxes)
- Step 6: RERA & Verification (RERA number, bank approvals)
- Step 7: Review & Submit

> **Bulk Upload:** _(Phase 2)_ CSV template + image upload for 10+ properties — see `phase2_prd.md`.

**Microsite Builder:** Single fixed-layout template with CMS fields — step-by-step wizard for large projects with multiple units

### Property Slug Generation

```typescript
function generateSlug(title: string, city: string): string {
const base = `${title} ${city}`
.toLowerCase()
.replace(/[^a-z0-9\s-]/g, "")
.replace(/\s+/g, "-")
.replace(/-+/g, "-")
.slice(0, 60);
const suffix = nanoid(6);
return `${base}-${suffix}`;
}
// Example: "spacious-3bhk-flat-whitefield-k3mP9x"
```

- Slug is set once at creation and **never changes** (preserves SEO URLs)
- Partners cannot manually set slugs
- Title edits do NOT update the slug

### Image Upload Constraints

**Per-Property:**

|     |     |
| --- | --- |
| Constraint | Value |
| Maximum images | 25  |
| Minimum images required | 3 (enforced before submission) |
| Accepted formats | JPG, JPEG, PNG, WebP |
| Maximum file size | 5MB per image |
| Recommended resolution | Min 1200×800px |

**KYC Documents:**

|     |     |
| --- | --- |
| Constraint | Value |
| Accepted formats | PDF, JPG, PNG |
| Maximum file size | 10MB |
| Storage | Private S3 bucket. Signed URLs expire in 1 hour. |
| Access | Only ADMIN can view KYC documents. |

---

## 11\. USER DASHBOARD SPECIFICATIONS

### Panel Modules

|     |     |     |
| --- | --- | --- |
| Module | Route | Description |
| Dashboard Home | `/dashboard` | Summary: active inquiries, favorites count, service status |
| My Inquiries | `/dashboard/inquiries` | Status: Received → Assigned → Site Visit → Closed |
| My Favorites | `/dashboard/favorites` | Saved properties with compare |
| Property Comparison | `/dashboard/compare` | Side-by-side comparison of up to 3 properties |
| Document Vault | `/dashboard/vault` | Upload PAN, Aadhar, Salary Slips for loan processing |
| Loan Status Tracker | `/dashboard/loan` | Docs Verified → Sent to Bank → Approved/Rejected |
| My Services | `/dashboard/services` | Purchased plans, active tickets, payment history |
| Service Tickets | `/dashboard/services/[id]/tickets/[tid]` | Ticket detail, vendor info, resolution photos |
| Notifications | `/dashboard/notifications` | All notifications with read/unread status |
| Account Settings | `/dashboard/account` | Edit profile, data export, delete account |

### Property Comparison Feature

**User Flow:**

1. Each property card has a "Compare" checkbox (bottom-left corner)
2. Select up to 3 properties → sticky bar: "Comparing 2/3 Properties \[View Comparison →\]"
3. "View Comparison" → `/compare?ids=abc,def,ghi`
4. Max 3 properties. 4th attempt: "Remove one property to add another."
5. State stored in `localStorage` (no auth required)

**Comparison Table Columns:** Cover image, title, price, property type, listing type, BHK, carpet area, built-up area, floor, furnishing, facing, age, locality, city, RERA, RealtyDoor Verified, bank approvals, amenities, auto-calculated EMI (20yr @ 8.5%), \[Contact Now\] per property

### NRI-Specific Features

|     |     |
| --- | --- |
| Feature | Spec |
| Remote Video Tour Request (Phase 2) | "Request Video Tour" on any listing → `VideoTourRequest` record → Admin assigns to Partner → Partner records walkthrough → User notified |
| TDS Information Panel | Collapsible "NRI Tax Guide" on every property detail page (20% TDS on sale, lower TDS certificate guide) — static content via Admin CMS |
| Power of Attorney (PoA) Service | Purchasable service under `category: LEGAL` → ticket created → Admin handles PoA documentation remotely |
| Maintenance from Abroad | NRI users get "Manage from Abroad" badge on maintenance dashboard |
| NRI Friendly Filter | Homepage filter for `amenities: ["NRI Friendly"]` properties |

---

## 12\. EDGE CASES & DEVELOPER GOTCHAS

### OTP System — Complete Edge Case Handling

|     |     |
| --- | --- |
| Scenario | Behaviour |
| OTP expires (> 2 hours) | API returns `OTP_EXPIRED`. Partner clicks "Resend OTP" → new OTP generated, buyer re-messaged on WhatsApp. |
| Wrong OTP entered | Show: "Incorrect OTP. Ask the buyer to check their WhatsApp." Max 5 attempts. |
| After 5 wrong attempts | Lock OTP entry for 30 minutes. Show: "Too many failed attempts. Try again in 30 minutes." Notify Admin. |
| Buyer never received WhatsApp | Partner can click "Resend OTP" after 5-minute cooldown. If fails again → Partner contacts Admin. |
| OTP already verified | If Partner tries to re-verify: `OTP_ALREADY_USED`. Show: "Visit already confirmed." |
| WhatsApp feedback fails | After 48h with no `buyerFeedbackStatus`, Admin gets flag: "Buyer unreachable on WhatsApp for lead #{id}." Lead stays SITE_VISIT_DONE, not auto-closed. |

### Razorpay Webhook — Idempotency

```typescript
// Step 1: Verify signature
const expectedSig = crypto.createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
.update(rawBody).digest("hex");
if (expectedSig !== req.headers["x-razorpay-signature"]) {
return res.status(400).json({ error: "Invalid signature" });
}

// Step 2: Idempotency check
const existing = await db.userSubscription.findUnique({
where: { razorpayOrderId: payload.order_id }
});
if (existing?.paymentStatus === "SUCCESS") {
return res.status(200).json({ message: "Already processed" });
}

// Step 3: Update
await db.userSubscription.update({
where: { razorpayOrderId: payload.order_id },
data: { paymentStatus: "SUCCESS", razorpayPaymentId: payload.payment_id }
});
```

**Webhook Events:**

|     |     |
| --- | --- |
| Event | Action |
| `payment.captured` | Set subscription `paymentStatus: SUCCESS`. Send confirmation email. |
| `payment.failed` | Set `paymentStatus: FAILED`. Notify user to retry. |
| `refund.created` | Set `paymentStatus: REFUNDED`. Close subscription early. Notify admin. |

### Partner KYC Rejection After Active Leads

|     |     |
| --- | --- |
| State | Behaviour |
| KYC rejected before any leads | Partner Panel shows "Verification Failed" banner. All CMS locked. Partner can resubmit. |
| KYC rejected after leads assigned | Admin must manually reassign all `ASSIGNED` leads before deactivating. System shows: "This partner has {n} active leads. Reassign before deactivating." |
| Partner account suspended | All their `APPROVED` listings → `ARCHIVED` (not deleted). Inquiries redirect to Admin contact form. |

### Rate Limiting & Spam Prevention

|     |     |
| --- | --- |
| Rule | Value |
| Max inquiries per user per day | 5   |
| Max inquiries per user per property | 1 (cannot submit twice for same property) |
| Phone verification required | YES — verify phone via OTP before first inquiry |
| Cooldown between inquiries | 30 minutes between any two submissions |

### Error States — UI Messages Reference

|     |     |
| --- | --- |
| Scenario | User-Facing Message |
| No search results | "No properties found matching your criteria. Try adjusting your filters." |
| Property no longer available | "This listing has been sold/rented. Browse similar properties below." |
| KYC pending | "Your account is under review. You'll receive a notification once verified (usually within 24 hours)." |
| Inquiry already submitted | "You've already expressed interest in this property. Our team will contact you soon." |
| Daily inquiry limit hit | "You've reached your daily inquiry limit (5). Come back tomorrow!" |
| OTP expired | "Your OTP has expired. Click 'Resend OTP' to send a new one to the buyer." |
| Payment failed | "Payment could not be processed. Please try a different payment method or contact support." |
| Service ticket closed | "This ticket has been closed and verified. Raise a new ticket for any new issues." |
| Property rejected | "Your listing was not approved. Reason: \[admin note\]. Edit and resubmit, or contact support." |

---

## 13\. COMMUNICATION LAYER (EMAIL, WHATSAPP)

> All emails sent via Resend (or Nodemailer + SMTP). Use React Email or HTML templates. All emails must be mobile-responsive.  
> **All OTPs and transactional messages are delivered exclusively via WhatsApp (WATI API). No SMS channel is used.** WhatsApp ensures higher delivery rates, read receipts, and a richer messaging experience.

### Email Templates

|     |     |     |     |
| --- | --- | --- | --- |
| #   | Template | Trigger | Subject |
| 1.1 | Welcome — New USER | On successful registration | "Welcome to RealtyDoor! 🏠 Your Property Journey Starts Here" |
| 1.2 | Welcome — New PARTNER | On PARTNER registration | "Welcome to RealtyDoor Partner Program! Let's Get You Verified" |
| 1.3 | KYC Approved | Admin clicks Approve on Partner KYC | "✅ Your RealtyDoor Account is Verified! Full Access Unlocked" |
| 1.4 | KYC Rejected | Admin clicks Reject on KYC | "Action Required: Your RealtyDoor Verification Needs Attention" |
| 1.5 | Property Approved | Admin approves listing | "🎉 Your Listing is Now Live on RealtyDoor!" |
| 1.6 | Property Rejected | Admin rejects listing | "Your Listing Needs a Few Changes" |
| 1.7 | New Lead Assigned | Admin assigns lead | "📩 New Lead Assigned: \[Buyer Name\] is interested in \[Property\]" |
| 1.8 | Service Purchase Confirm | Razorpay payment success webhook | "✅ Service Activated: \[Service Name\]" |
| 1.9 | Service Ticket Resolved | Admin changes ticket to RESOLVED | "Your Service Request Has Been Resolved!" |

### Partner Onboarding Drip Sequence

|     |     |     |
| --- | --- | --- |
| Timing | Email | Subject |
| Immediately | Welcome (1.2) | "Welcome! Get Verified" |
| T+24h (if KYC not submitted) | Reminder | "Don't lose your spot — complete verification" |
| T+0 (KYC approved) | KYC Approval (1.3) | "✅ Full Access Unlocked!" |
| T+1 day after approval | First Listing Prompt | "List your first property in under 5 minutes" |
| T+3 days (if no listing) | Nudge | "Your listing could be getting views right now" |
| T+7 days (if no listing) | Tips email | "3 tips to get your first lead on RealtyDoor" |
| First lead assigned | Lead Alert (1.7) | "📩 New Lead Assigned!" |

### WhatsApp Bot Messages

- **Lead Assigned to Partner:** "New lead assigned! {buyer} is interested in {property}. Open your CRM: \[link\]"
- **Buyer Feedback (T+24h after OTP verified):** "Hi {buyer}! How was your visit to {property}? Did you decide to move forward? (Yes / No / Still Deciding)"
- **Site Visit OTP (to Buyer):** Via WhatsApp: "RealtyDoor Visit OTP: {otp}. Share this with your agent at the property."

---

## 14\. UX, LEGAL & COMPLIANCE

### Data Privacy — DPDPA 2023 Compliance

**Personal Data We Collect:**

|     |     |     |
| --- | --- | --- |
| Data | Where Collected | Retention |
| Name, Email, Phone | Registration | Until account deletion |
| KYC Documents (Aadhar, PAN) | Partner Profile | 2 years after last transaction, then deleted |
| Salary Slips, Bank Statements | Document Vault | 1 year after loan status resolved |
| Property inquiry messages | Lead submission | 3 years (for audit and dispute resolution) |
| Site visit photos | Lead CRM | 1 year after lead is closed |
| Payment data | Razorpay | We store only Order ID + Payment ID. Razorpay holds card/bank data. |
| IP Address | Audit Logs | 90 days |

**User Rights (Must Implement):**

|     |     |
| --- | --- |
| Right | Implementation |
| Right to Access | `/dashboard/account/data` — Download all personal data as JSON |
| Right to Correction | User can edit name, phone, email from Profile settings |
| Right to Erasure | "Delete My Account" → Anonymizes data (name → "Deleted User", phone/email → null). Does NOT delete property/lead history for audit. |
| Right to Withdraw Consent | Unsubscribe link in every marketing email. Toggle in `/dashboard/account/notifications`. |

**Data Security Requirements:**

- KYC documents in **private S3 bucket** with signed URLs (expire in 1 hour)
- All API calls over HTTPS only
- `hashedPassword` uses bcryptjs (salt rounds: 12)
- Admin accessing KYC docs creates an `AuditLog` entry
- PostHog and Clarity must be configured to anonymize IPs (no PII to third-party analytics)

**Required Legal Pages (SSG):**

- `/privacy` — Privacy Policy (data collected, why, retention, deletion process)
- `/terms` — Terms of Service

### Support & Contact System

- **General Contact:** `/contact` form → `POST /api/contact` → `ContactMessage` DB record → email to admin inbox
- **WhatsApp Float:** All public pages, bottom right. `wa.me/+91XXXXXXXXXX?text=Hi! I need help with RealtyDoor`
- **Partner Support:** "Help & Support" section in Partner Panel, pre-fills `role: PARTNER` and `userId`

---

## 15\. COMPLETE SITE ROUTE MAP

### Public Routes (no auth required)

```
/ Homepage
/properties Property search & listing
/properties/[slug] Property detail page
/services Services overview
/services/[category] Service category detail
/blog Blog index
/blog/[slug] Blog post
/about About page
/contact Contact page
/privacy Privacy policy
/terms Terms of service
/sitemap.xml Auto-generated XML sitemap
/robots.txt SEO robots file
/compare Property comparison (localStorage-based)
```

### Authentication Routes

```
/login Login page
/register Registration page (with role selection)
/verify-email Email verification
/forgot-password Password reset request
/reset-password Password reset with token
/unauthorized Access denied page
```

### User Routes (requires USER role)

```
/dashboard User dashboard home
/dashboard/inquiries My submitted inquiries
/dashboard/inquiries/[id] Single inquiry detail + status
/dashboard/favorites Saved properties
/dashboard/compare Property comparison view
/dashboard/vault Document vault (KYC uploads for loan)
/dashboard/loan Loan application status tracker
/dashboard/services Purchased service plans
/dashboard/services/[id] Service subscription detail
/dashboard/services/[id]/tickets/[tid] Service ticket detail
/dashboard/account Account settings + data export + delete
/dashboard/notifications All notifications
```

### Partner Routes (requires PARTNER role + kycStatus: VERIFIED)

```
/partner Partner dashboard home
/partner/listings My property listings
/partner/listings/new Add single listing (wizard)
// /partner/listings/bulk  ← Phase 2: Bulk CSV upload
/partner/listings/[id]/edit Edit a listing
/partner/projects My builder projects
/partner/projects/new Microsite creation wizard (single template + CMS fields)
/partner/projects/[id]/edit Edit microsite CMS fields
/partner/leads My assigned leads (CRM)
/partner/leads/[id] Lead detail + OTP + visit docs
/partner/b2b B2B hidden market (open to all verified Partners)
/partner/finance Deal & escrow tracker
/partner/profile Profile + KYC documents
/partner/notifications Partner notifications
```

### Admin Routes (requires ADMIN role)

```
/admin Revenue dashboard home
/admin/leads Lead dispatch center
/admin/leads/monitor All leads monitor (real-time)
/admin/leads/[id] Lead detail view
/admin/properties Property moderation queue
/admin/properties/[id] Property review + approve/reject
/admin/kyc Partner KYC verification queue
/admin/kyc/[userId] KYC document review
/admin/users All users + partners management
/admin/users/[id] User detail + role + suspend
/admin/partners Partner performance analytics
/admin/partners/[id] Single partner drill-down
/admin/services Service catalog management
/admin/services/new Create new service
/admin/services/[id]/edit Edit service
/admin/tickets All service tickets
/admin/tickets/[id] Ticket detail + dispatch vendor
/admin/cms Content management (blogs, banners)
/admin/cms/new Create content block
/admin/cms/[id]/edit Edit content block
/admin/finance Revenue tracking (escrow + services)
/admin/notifications Broadcast notifications
/admin/logs Audit logs
```

---

## 16\. NON-FUNCTIONAL REQUIREMENTS

### Performance

- **MongoDB Indexes:** Create on `city`, `locality`, `propertyType`, `listingType`, `publishStatus` for sub-100ms search queries
- **Images:** Use `next/image` with WebP format for all photos
- **LCP Target:** < 2.5s on 4G networks
- **Pagination:** 20 properties per page (max 50 per API call)

### Security

- Middleware blocks `/partner` from `USER` role; `/admin` from non-`ADMIN`
- Razorpay webhooks verify `x-razorpay-signature` header. Never trust client-side payment success.
- S3 documents private with signed URLs (expire 1 hour)
- bcryptjs for passwords (salt rounds: 12)

### File Uploads

- All images go to AWS S3 or Cloudinary (public bucket, CDN-served)
- KYC documents go to private S3 bucket (signed URLs, 1h expiry)

### SEO

- Every Property page: dynamic `generateMetadata()` with title, meta description, OpenGraph image
- Every Blog page: `generateMetadata()` + JSON-LD (`Article` schema)
- Property Detail: JSON-LD (`RealEstateListing` schema)
- Builder Microsite: JSON-LD (`Organization` schema)
- Auto-generated `/sitemap.xml` covering all approved property slugs and published blog slugs
- `/robots.txt`: allow all public, disallow `/admin`, `/partner`, `/dashboard`

### Cron Jobs (Vercel Cron)

- **Every hour:** Check for leads needing WhatsApp feedback message (otpVerifiedAt < now-24h AND whatsappSentAt = null) → call WhatsApp API

### Analytics & Telemetry (PostHog Events)

- `inquiry_submitted`
- `site_visit_otp_generated`
- `otp_verified`
- `deal_closed`
- `service_purchased`
- `ticket_raised`
- `ticket_verified`
- **Microsoft Clarity:** Heatmaps on homepage and property detail pages
- **Important:** Both tools must be configured to **anonymize IPs** — no PII sent to third-party analytics

### System Workflows Summary

**6.1 Partner Onboarding:** Register → KYC upload → Admin review → VERIFIED → Full panel access  
**6.2 Property Listing → Live:** Partner creates → PENDING_APPROVAL → Admin reviews → APPROVED (live) or REJECTED (with note, can resubmit)  
**6.3 Lead to Closure:** User inquiry → Admin dispatch → Partner site visit (OTP via WhatsApp) → Documentation → **Mandatory Escrow Payment** → Closure → WhatsApp cross-check → Admin releases escrow  
**6.4 Service → Ticket Resolution:** User buys → Razorpay payment → UserSubscription → Ticket raised → Admin dispatches vendor → Photos uploaded → User verifies → VERIFIED_BY_USER  
**6.5 Builder Microsite + Escrow:** Partner (Builder) creates microsite → Buyer books → Razorpay Route holds token → Builder uploads allocation letter → Admin releases via Route transfer (platform fee auto-deducted)

---

_End of RealtyDoor Master PRD v1.0_  
_Consolidated from: prd_part1_personas_flows.md, prd_part2_technical_specs.md, prd_part3_edge_cases_specs.md, prd_part4_public_portal.md, prd_part5_ux_legal_comms.md, website_summary_and_prd.md_

---

## APPENDIX A: SCHEMA PATCHES (High Priority Additions)

> These were identified as missing after initial consolidation. Add these to `schema.prisma` and the User model.

### A.1 — `phoneVerified` Field on User Model

Add to the `User` model in schema:

```prisma
model User {
// ... existing fields ...
phoneVerified Boolean @default(false) // Required before first inquiry submission
phoneVerifiedAt DateTime?
}
```

**Where it is enforced:**

```typescript
// In POST /api/leads (inquiry submission):
if (!session.user.phoneVerified) {
return res.status(403).json({
error: "Please verify your phone number first.",
code: "PHONE_NOT_VERIFIED"
});
}
```

**How phone verification works:**

1. User registers with phone number
2. On first inquiry attempt (or triggered from profile), system sends OTP to phone via WhatsApp
3. User enters OTP → `phoneVerified: true`, `phoneVerifiedAt: now()`
4. One-time only — no re-verification unless phone number changes

---

### A.2 — Locality Insights Model

**Problem:** Property detail page shows `"Whitefield avg price ₹5,200/Sq.Ft"` but there was no data source or model defined.

**Solution:** Admin-managed static table, updated periodically (monthly).

```prisma
model LocalityInsight {
id String @id @default(auto()) @map("_id") @db.ObjectId
city String
locality String
// Price benchmarks
avgPricePerSqft Float // e.g., 5200 (INR per Sq.Ft)
minPricePerSqft Float?
maxPricePerSqft Float?
// Market signals
priceChangeLastMonth Float? // % change e.g., +2.3 or -1.1
avgRentPerMonth Float? // For RENT type locality benchmarks
// Infrastructure tags
nearbyInfra String[] // ["Metro: 500m", "ITPL: 1.2km", "Hospital: 2km"]
// Meta
dataAsOfDate DateTime // When this data was last updated
updatedByAdminId String? @db.ObjectId
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt

@@unique([city, locality]) // One record per locality per city
}
```

**API:**

```
GET /api/locality-insights?city=Bangalore&locality=Whitefield
→ Returns: { avgPricePerSqft, priceChangeLastMonth, nearbyInfra, ... }
```

**Admin CMS route:** `/admin/cms/locality-insights` — table view of all localities, inline edit.

**On Property Detail Page:**

```typescript
// Compare property price vs locality avg:
const pricePerSqft = property.price / property.carpetArea;
const diff = ((pricePerSqft - insight.avgPricePerSqft) / insight.avgPricePerSqft) * 100;
// diff < -3% → show "Good Deal 👍" badge
// diff > +5% → show "Above Market" badge
// else → show "Fair Price" badge
```

---

### A.3 — Loan Application Model

**Problem:** `/dashboard/loan` route exists and Priya's journey references "loan status tracking" but no schema model was defined.

```prisma
enum LoanStatus {
DOCUMENTS_PENDING
DOCUMENTS_SUBMITTED
DOCUMENTS_VERIFIED
SENT_TO_BANK
AWAITING_SANCTION
SANCTIONED
DISBURSED
REJECTED
}

model LoanApplication {
id String @id @default(auto()) @map("_id") @db.ObjectId
userId String @db.ObjectId
user User @relation(fields: [userId], references: [id])
propertyId String? @db.ObjectId // Which property they're buying
// Bank Details
preferredBank String? // "HDFC" | "SBI" | "ICICI" | "AXIS" etc.
loanAmountRequested Float? // In rupees
// Status Tracking
status LoanStatus @default(DOCUMENTS_PENDING)
statusHistory String[] // JSON snapshots: [{ status, timestamp, note }]
adminNote String? // Internal note from RealtyDoor loan team
bankRefNumber String? // Reference number from bank after submission
sanctionedAmount Float?
sanctionedAt DateTime?
disbursedAt DateTime?
rejectionReason String?
// Documents (references to UserDocument)
submittedDocIds String[] // Array of UserDocument IDs submitted for this application
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
}
```

**Add relation to User model:**

```prisma
model User {
// ... existing fields ...
loanApplications LoanApplication[]
}
```

**API Routes:**

```
POST /api/user/loan → Create new loan application
GET /api/user/loan/[id] → Get loan application + status history
PATCH /api/admin/loan/[id]/status → Admin updates loan status (ADMIN only)
```

**Status Timeline UI (on** `/dashboard/loan`**):**

```
○ Documents Pending
○ Documents Submitted
✅ Documents Verified — June 3, 2025
✅ Sent to Bank (HDFC) — June 5, 2025
◉ Awaiting Sanction ← current
○ Sanctioned
○ Disbursed
```

---

### A.4 — Partner Analytics: Missing `Avg OTP to Close` Metric

**Add to the Per-Partner Metrics Table in §9:**

|     |     |
| --- | --- |
| Column | Calculation |
| Avg OTP to Close | Avg time from `otpVerifiedAt` to `status: CLOSED` in days — measures Partner efficiency post-site-visit |

**Significance:** A high "Avg OTP to Close" (e.g., 30+ days) indicates the Partner is struggling to convert after visits. Admin can use this to identify Partners who need coaching or leads that need reassignment.

---

### A.5 — EscrowTransaction Model (Required for MVP)

|     |     |     |
| --- | --- | --- |
| Feature | Status | Notes |
| **Escrow Transaction Model** | ✅ Required (MVP) | `EscrowTransaction` model with states `HELD → RELEASED → REFUNDED`. Escrow is **mandatory** for every deal closure. All token advances flow through **Razorpay Route** (hold → transfer/refund). No deal can be marked CLOSED without a corresponding escrow payment. |

---

## APPENDIX B: FULL EMAIL TEMPLATE SPECIFICATIONS

> All emails sent via **Resend** (or Nodemailer + SMTP fallback). Use **React Email** components or HTML templates. All emails MUST be mobile-responsive. Use Inter font. Primary accent: `#FF5722`.

---

### B.1 — Welcome Email: New USER Registration

**Trigger:** Immediately on successful registration  
**To:** New user  
**Subject:** `Welcome to RealtyDoor! Your Property Journey Starts Here`

```
Hi [Name],

Welcome aboard! You've just joined India's most transparent real estate platform.

Here's what you can do right now:
✓ Search 10,000+ verified properties
✓ Save your favorites and compare up to 3 at a time
✓ Submit inquiries and track them live in your dashboard

[ Start Searching Properties → ] (links to /properties)

-------------------------------
Need help? WhatsApp us: +91 XXXXX XXXXX
Or email: hello@realtydoor.in

RealtyDoor — Find. Verify. Move In.
Unsubscribe | Privacy Policy
```

---

### B.2 — Welcome Email: New PARTNER Registration

**Trigger:** Immediately on registration with `role: PARTNER`  
**To:** New partner  
**Subject:** `Welcome to RealtyDoor Partner Program! Let's Get You Verified`

```
Hi [Name],

Great to have you on RealtyDoor! You're one step away from accessing
high-quality leads and a powerful listing CMS.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEXT STEP: Complete your verification
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Upload your RERA certificate and ID documents to unlock:
✓ Full access to your Partner CRM
✓ Lead assignments from our team
✓ Property listing tools (wizard, bulk upload, microsite)

[ Complete Verification → ] (links to /partner/profile)

Verification usually takes less than 24 hours.

Questions? Reply to this email or WhatsApp: +91 XXXXX XXXXX
```

---

### B.3 — Partner KYC Approved

**Trigger:** Admin clicks "Approve" on a Partner's KYC  
**To:** Verified partner  
**Subject:** `✅ Your RealtyDoor Account is Verified! Full Access Unlocked`

```
Hi [Name],

Great news! Your account has been verified by our team.

You can now:
✓ List properties (single, bulk, or microsite)
✓ Receive and manage leads assigned by our team
✓ Access the Partner CRM and deal tracker

[ Go to Partner Dashboard → ] (links to /partner)

━━━━━━━━━━━━━━━━━━━━━━━━
PRO TIP: List your first property today.
Partners who list within 24 hours of verification receive
priority placement in our lead dispatch queue.
━━━━━━━━━━━━━━━━━━━━━━━━

Welcome to the team,
RealtyDoor Partner Success
```

---

### B.4 — Partner KYC Rejected

**Trigger:** Admin clicks "Reject" on KYC  
**To:** Partner  
**Subject:** `Action Required: Your RealtyDoor Verification Needs Attention`

```
Hi [Name],

We reviewed your verification documents and need some changes
before we can approve your account.

Reason: [kycRejectionNote]

Please upload the correct documents to proceed:

[ Update Documents → ] (links to /partner/profile)

━━━━━━━━━━━━━━━━━━━━
Common reasons for rejection:
• RERA certificate must be current and not expired
• ID documents must clearly show name and photo
• Business PAN must match the business name provided
━━━━━━━━━━━━━━━━━━━━

Need help? WhatsApp us: +91 XXXXX XXXXX
We're here to get you verified as fast as possible.
```

---

### B.5 — Property Approved (to Partner)

**Trigger:** Admin approves a listing  
**To:** Partner who submitted the listing  
**Subject:** `🎉 Your Listing is Now Live on RealtyDoor!`

```
Hi [Name],

Your listing "[Property Title]" has been approved and is
now visible to buyers across India.

[ View Your Live Listing → ] (links to /properties/[slug])
[ Manage Listing → ] (links to /partner/listings)

━━━━━━━━━━━━━━━━━━━━━━━━
Want more visibility?
Share your listing on WhatsApp and social media.
Buyers who come through your shared link are still
tracked through RealtyDoor.
━━━━━━━━━━━━━━━━━━━━━━━━

RealtyDoor Partner Team
```

---

### B.6 — Property Rejected (to Partner)

**Trigger:** Admin rejects a listing  
**To:** Partner  
**Subject:** `Your Listing Needs a Few Changes`

```
Hi [Name],

We reviewed "[Property Title]" and couldn't approve it yet.

Reason: [rejectionNote]

Don't worry — this is easy to fix. Edit your listing and
resubmit. It will go back to our review queue immediately.

[ Edit Listing → ] (links to /partner/listings/[id]/edit)

━━━━━━━━━━━━━━━━━━━━
Common fixes:
• Minimum 3 clear photos required (min 1200x800px)
• RERA number must be present for under-construction projects
• Price field cannot be left empty
━━━━━━━━━━━━━━━━━━━━

Questions? Reply to this email.
```

---

### B.7 — New Lead Assigned (to Partner)

**Trigger:** Admin assigns a lead to this Partner  
**To:** Partner  
**Subject:** `📩 New Lead Assigned: [Buyer Name] is interested in [Property Title]`

```
Hi [Name],

You have a new lead to follow up on!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Buyer: [buyerName]
Property: [Property Title]
Message: "[buyerMessage]"
Received: [timestamp]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[ View Lead in CRM → ] (links to /partner/leads/[leadId])

💡 Leads contacted within 1 hour convert 3x better. Act fast!

Next steps:
1. Call the buyer (number revealed after OTP site visit verification)
2. Schedule a site visit from your CRM
3. Document the visit with photos and notes

RealtyDoor Partner Team
```

---

### B.8 — Service Purchase Confirmation (to User)

**Trigger:** Razorpay `payment.captured` webhook  
**To:** User who purchased the service  
**Subject:** `✅ Service Activated: [Service Name]`

```
Hi [Name],

Your [Service Name] plan is now active!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Plan Details:
Service: [Service Name]
Valid From: [startDate]
Valid Until: [endDate]
Amount Paid: ₹[amountPaid]
Payment ID: [razorpayPaymentId]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

How to use your plan:
1. Log in to your dashboard
2. Go to "My Services"
3. Click "Raise a Service Request" anytime

[ Go to My Services → ] (links to /dashboard/services)

Our team will respond to service requests within 24 hours.

RealtyDoor Services Team
```

---

### B.10 — Service Ticket Resolved (to User)

**Trigger:** Admin changes ticket `status` to `RESOLVED`  
**To:** User  
**Subject:** `Your Service Request Has Been Resolved!`

```
Hi [Name],

Great news! Your request "[subject]" has been resolved by our team.

Our team has uploaded photos of the completed work for your review.

[ Review & Verify Fix → ]
(links to /dashboard/services/[subscriptionId]/tickets/[ticketId])

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
What to do next:
• Review the before/after photos
• Click "Verify Fix" if you're satisfied
• Click "Raise New Ticket" if the issue persists
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IMPORTANT: Unverified tickets auto-close after 7 days.
Please verify within 7 days to keep your service record accurate.

RealtyDoor Services Team
```

---

### B.12 — Partner Onboarding Drip: KYC Reminder (T+24h)

**Trigger:** Cron — 24h after PARTNER registration if `kycStatus: NOT_SUBMITTED`  
**Subject:** `Don't lose your spot — complete your RealtyDoor verification`

```
Hi [Name],

You registered on RealtyDoor yesterday but haven't uploaded
your verification documents yet.

Your account is reserved, but you're missing out on leads
being dispatched to verified Partners right now.

It takes less than 5 minutes:
1. Upload your RERA certificate (or Aadhar for individual owners)
2. Upload your Business PAN
3. Submit — our team reviews within 24 hours

[ Complete Verification → ] (links to /partner/profile)

━━━━━━━━━━━━━━━━━━━━━━━━
We currently have [N] open leads in your city.
Verified Partners get first access.
━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### B.13 — Partner Onboarding Drip: First Listing Prompt (T+1 day after KYC approval)

**Trigger:** 1 day after `kycStatus: VERIFIED` if Partner has 0 listings  
**Subject:** `List your first property in under 5 minutes`

```
Hi [Name],

Your account is verified — now let's get your first listing live!

Your step-by-step listing wizard takes less than 5 minutes.
No technical knowledge required.

[ Add Your First Listing → ] (links to /partner/listings/new)

━━━━━━━━━━━━━━━━━━━━━━━━
What you'll need:
✓ At least 3 clear property photos
✓ Basic details: BHK, area, price, location
✓ RERA number (if applicable)
━━━━━━━━━━━━━━━━━━━━━━━━

Have 10+ properties? Use our Bulk Upload tool instead:
[ Bulk Upload → ] (links to /partner/listings/bulk)
```

---

### B.14 — Partner Onboarding Drip: Tips Email (T+7 days, no listing)

**Trigger:** 7 days after `kycStatus: VERIFIED` if Partner has 0 listings  
**Subject:** `3 tips to get your first lead on RealtyDoor`

```
Hi [Name],

Partners who list within their first week get 3x more leads.
Here's what our top-performing Partners do:

━━━━━━━━━━━━━━━━━━━━━━━━
TIP 1: Photos make or break a listing
Listings with 8+ photos get 5x more inquiries.
Use natural light. Shoot wide angles.

TIP 2: Price it right
Check our Locality Insights on the listing page to see
the average price per Sq.Ft in your area.

TIP 3: Complete every field
Listings with RERA numbers, bank approvals, and full
amenity lists rank higher in search results.
━━━━━━━━━━━━━━━━━━━━━━━━

[ Add Your First Listing Now → ] (links to /partner/listings/new)

We're here to help — WhatsApp us: +91 XXXXX XXXXX
```

---

_End of Appendix B: Full Email Template Specifications_

---

_RealtyDoor Master PRD v1.1 — Patches Applied May 2026_  
_Additions: phoneVerified field, LocalityInsight model, LoanApplication model, Avg OTP to Close metric, Future scope registry, Full email template body content (Appendix B)_

---

## APPENDIX C: BUSINESS RULES CLARIFICATIONS (Admin Operations)

> These rules were confirmed by the platform owner and must be enforced in code exactly as described.

---

### C.2 — DROPPED Lead: Two-Tier Permission System

**Rule:** Partners CANNOT drop leads. Only Admin can execute a drop. Partners can only REQUEST a drop with a reason note.

**Workflow:**

```
Partner wants to drop a lead:
→ Clicks "Request Drop" on lead (NOT "Drop Lead")
→ Required field: dropRequestNote (text, mandatory)
→ Lead status stays: ASSIGNED (unchanged)
→ Admin gets in-app notification: "Partner [name] has requested to drop lead #{id}. Reason: [note]"
→ Admin reviews → either:
(a) ADMIN DROPS: sets status: DROPPED, fills droppedReason, creates AuditLog
(b) ADMIN REJECTS REQUEST: dismisses, lead stays ASSIGNED, Partner notified

Admin can also drop a lead directly without Partner request:
→ From /admin/leads/[id] → "Drop Lead" button (Admin-only visible)
→ Required: droppedReason (mandatory)
→ Sets status: DROPPED
→ Creates AuditLog
```

**Schema additions to Lead model:**

```prisma
// Add these fields to Lead model:
dropRequestedByPartner Boolean @default(false) // Partner clicked "Request Drop"
dropRequestNote String? // Partner's reason for drop request
dropRequestedAt DateTime?
droppedReason String? // Admin's reason when actually dropping
droppedAt DateTime?
droppedByAdminId String? @db.ObjectId // Which Admin dropped it
```

**What happens to the property after drop:**

- The property listing remains `APPROVED` and visible publicly
- The dropped lead is marked `DROPPED` — it does NOT go back to the unassigned pool automatically
- If the same buyer submits a new inquiry for the same property, it creates a NEW lead (Admin reassigns)
- Admin can manually create a new lead and assign to a different Partner if needed

**Notification additions:**

|     |     |     |     |
| --- | --- | --- | --- |
| Event | Who | Channel | Message |
| Partner requests drop | Admin | In-app | "Partner \[name\] requested to drop lead #{id}. Reason: \[note\]. Review required." |
| Admin drops lead | Partner | In-app + Email | "Lead #{id} has been dropped by Admin. Reason: \[droppedReason\]." |
| Admin rejects drop request | Partner | In-app | "Your drop request for lead #{id} was not approved. Please continue working this lead." |

---

### C.3 — Lead Assignment: Manual by Admin

**Rule:** Lead assignment is **100% manual**. Admin uses their own judgment. No auto-suggestion logic in MVP.

**How Admin decides (operational, not system-enforced):**

- Admin knows which Partners cover which localities
- Admin checks Partner's current lead load (visible in `/admin/leads/monitor`)
- Admin checks Partner's conversion rate (visible in `/admin/partners`)
- Admin assigns to the Partner they judge best fit

**UI in Lead Dispatch Center (**`/admin/leads`**):**

```
Unassigned Lead Card:
Buyer: Priya Kumar
Property: Whitefield 3BHK (Bangalore)
Message: "Looking for east-facing, ready to move"
Received: 2 hours ago

[Assign to Partner ▾]
+-- Ravi Sharma — Whitefield, Sarjapur (12 active leads)
+-- Meena Patel — HSR, Koramangala (6 active leads)
+-- Suresh Kumar — Pan Bangalore (3 active leads)
[Assign]
```

- Show Partner's active lead count next to their name to help Admin avoid overloading one Partner
- Assignment is irreversible by Partner — only Admin can reassign (`PATCH /api/admin/leads/[id]/assign` can be called again to reassign)

---

### C.4 — "Still Deciding" Follow-Up Rules

**Rule:** Leads with `buyerFeedbackStatus: STILL_DECIDING` stay **open indefinitely**. No auto-expiry. Follow-up is a shared responsibility between the Partner and the WhatsApp bot.

**Follow-up flow:**

```
T+24h after OTP verified:
→ WhatsApp bot sends: "Did you finalize? (Yes / No / Still Deciding)"
→ Buyer replies "Still Deciding"
→ buyerFeedbackStatus: STILL_DECIDING
→ Lead remains at status: SITE_VISIT_DONE

T+7 days (if still STILL_DECIDING):
→ Cron fires SECOND WhatsApp bot message:
"Hi [Buyer]! Just checking in on your visit to [Property].
Any update? Our advisor [Partner Name] is ready to help.
(Yes, I want to proceed / No, not interested)"

Ongoing (Limit: 4-6 follow-up cycles):
→ Partner is expected to manually follow up via calls
→ Partner can log follow-up notes in lead's `partnerNotes` field
→ After 4-6 unsuccessful follow-up cycles, Partner should request to drop the lead
→ Lead stays open until Admin drops it OR Partner closes it
```

**Cron job addition:**

```
// Add to Vercel Cron:
// Daily: Check leads where buyerFeedbackStatus = 'STILL_DECIDING'
// AND feedbackReceivedAt < now - 7 days
// AND secondFollowupSentAt IS NULL
// → Send second WhatsApp follow-up
// → Set secondFollowupSentAt = now()
```

**Schema addition to Lead model:**

```prisma
// Existing:
buyerFeedbackStatus String? // PENDING | VERIFIED_CLOSED | VERIFIED_DROPPED | STILL_DECIDING | NO_RESPONSE

// Add:
secondFollowupSentAt DateTime? // Set after 7-day WhatsApp re-ping
```

**Updated** `buyerFeedbackStatus` **values (complete enum):**

|     |     |
| --- | --- |
| Value | Meaning |
| `PENDING` | WhatsApp sent, no reply yet |
| `VERIFIED_CLOSED` | Buyer confirmed deal is done |
| `VERIFIED_DROPPED` | Buyer confirmed they are not proceeding |
| `STILL_DECIDING` | Buyer replied "still deciding" |
| `NO_RESPONSE` | 48h passed, no WhatsApp reply (Admin flagged) |

---

### C.7 — Admin Edits to Partner Listings: Edit Trail

**Rule:** Admin can edit any property on the platform. Partner can see a full trail of every Admin edit (what changed, when, by whom) but CANNOT revert Admin changes.

**Edit Trail Implementation:**

Add `PropertyEditLog` model:

```prisma
model PropertyEditLog {
id String @id @default(auto()) @map("_id") @db.ObjectId
propertyId String @db.ObjectId
editedBy String @db.ObjectId // Admin's userId
editedByName String // Snapshot of admin name at time of edit
fieldChanged String // e.g., "price", "description", "publishStatus"
oldValue String? // JSON string of old value
newValue String? // JSON string of new value
editNote String? // Admin's reason for the edit (optional but encouraged)
editedAt DateTime @default(now())
}
```

**API behavior:**

```typescript
// PATCH /api/admin/properties/[id] (Admin editing any property)
// For every field changed:
// → Create PropertyEditLog entry
// → If adminEditNote provided, save to Property.adminEditNote
// → Create Notification for Partner: PROPERTY_EDITED_BY_ADMIN
```

**Partner view (on** `/partner/listings/[id]`**):**

```
Edit History:
-------------------------------------
Jun 5, 2025 — Edited by RealtyDoor Admin
Field: Price ₹55,00,000 → ₹52,00,000
Reason: "Price corrected per builder communication"
-------------------------------------
Jun 3, 2025 — Edited by RealtyDoor Admin
Field: Description — [View Changes]
Reason: "Grammar corrections"
-------------------------------------
```

**Notification addition:**

|     |     |     |     |
| --- | --- | --- | --- |
| Event | Who | Channel | Message |
| Admin edits Partner's listing | Partner | In-app + Email | "RealtyDoor Admin has updated your listing '\[Property Title\]'. View edit history in your dashboard." |

**AuditLog entry is also created** (for Admin's own records) every time an Admin edits a property.

---

_End of Appendix C: Business Rules Clarifications_  
_Confirmed by platform owner — May 2026_

---

## APPENDIX D: REMAINING BUSINESS RULE CLARIFICATIONS

---

### D.1 — NRI Self-Declaration: Trust Model

**Rule:** NRI status is **self-declared during registration**. No verification required in MVP. Platform trusts the declaration.

**Why no verification:**

- NRI verification (passport, visa, OCI card) adds friction to onboarding
- The NRI-specific features (video tours, PoA service, maintenance from abroad) are beneficial, not gated — there's no financial risk in a non-NRI accidentally accessing them
- Post-MVP: if NRI-specific pricing or tax treatment is introduced, verification can be added then

**Registration UI:**

```
[ ] I am an NRI (Non-Resident Indian)
"Check this if you are currently residing outside India.
We'll show you NRI-friendly properties and remote services."
```

**What** `isNRI: true` **unlocks:**

|     |     |
| --- | --- |
| Feature | Available to NRI only? |
| "NRI Friendly" property filter on homepage | Yes — filter only shown to `isNRI: true` users |
| "Request Video Tour" button (Phase 2) | Yes — only shown to `isNRI: true` users |
| TDS Information Panel on property detail | No — shown to ALL users (informational) |
| Power of Attorney (PoA) service | No — purchasable by any user |
| "Manage from Abroad" badge on dashboard | Yes — shown only if `isNRI: true` |
| Maintenance plan purchase | No — available to all users |

**Schema (already in User model):**

```prisma
isNRI Boolean @default(false) // Self-declared. No verification required.
```

**Abuse risk assessment:** Low. NRI features are convenience features, not premium-gated. No financial exposure from false declaration in MVP.

**Post-MVP consideration:** If NRI users get special pricing on services (e.g., discounted PoA), add an `nriDocumentUrl` field and a verification step before the discount applies.

---

### D.2 — societyFeatures vs amenities: Search Bug Fix

**The Problem:**  
The `Property` model has two separate string arrays:

- `amenities[]` → e.g., `["Power Backup", "Vaastu Compliant", "Parking", "Lift"]`
- `societyFeatures[]` → e.g., `["Gated Community", "24x7 Security", "Gym", "Clubhouse"]`

The search filter sidebar queries ONLY `amenities[]`. This means a buyer filtering for "Gym" or "Security" gets zero results even if those properties have them in `societyFeatures[]`. **This is a confirmed search bug.**

**Fix: Merge at query time — do NOT change the schema**

The schema separation is correct and meaningful for the listing form (Partners understand the distinction between property amenities and society-level features). The fix is in the **search API query layer only**.

**Updated search query logic:**

```typescript
// In GET /api/properties — amenities filter:
// OLD (broken):
where: {
amenities: { hasSome: selectedAmenities }
}

// NEW (fixed) — search BOTH arrays:
if (selectedAmenities && selectedAmenities.length > 0) {
// Property must have ALL selected amenities in EITHER array
filters.AND = selectedAmenities.map((amenity) => ({
OR: [
{ amenities: { has: amenity } },
{ societyFeatures: { has: amenity } }
]
}));
}
```

**Updated filter sidebar — unified label:**

- The sidebar section is labelled **"Amenities & Features"** (not just "Amenities")
- All 16 unique values from both arrays are shown as checkboxes in one unified list
- No visual distinction between `amenities[]` and `societyFeatures[]` in the filter UI — buyers don't care which array it lives in

**Canonical combined list for filter sidebar:**

```
Property Amenities:
☐ Power Backup ☐ Vaastu Compliant
☐ Parking ☐ Lift / Elevator
☐ Intercom ☐ CCTV

Society Features:
☐ Gated Community ☐ 24x7 Security
☐ Gym ☐ Swimming Pool
☐ Clubhouse ☐ Children's Play Area
☐ Jogging Track ☐ Power Backup (Society)
☐ Visitor Parking ☐ Maintenance Staff
```

> **Dev note:** Show both groups under one "Amenities & Features" accordion in the filter sidebar. The query treats them identically — `OR` across both arrays per amenity selected.

**On the Property Detail page:**

- Display them in two separate sections as today (Partners entered them separately)
- Section 1: "Amenities" (from `amenities[]`)
- Section 2: "Society Features" (from `societyFeatures[]`)

**On Property Cards (listing grid):**

- Show top 4 combined from both arrays as pills

---

### D.3 — B2B Collaboration: Admin Awareness Rule (Phase 2)

**Rule:** When two Partners connect via the B2B tab, the **platform's only obligation is to ensure Admin is notified** every time a B2B connection is made.

**What the platform tracks:**

- `B2BConnection` record is created when a buyer Partner expresses interest in a listing Partner's B2B property
- Admin receives a notification each time a new `B2BConnection` is created
- Admin can monitor all active B2B connections from the Admin panel

**What the platform does NOT track:**

- Whether the B2B deal eventually closed
- Any financial arrangements between Partners (handled offline)

**This is intentional.** The platform tracks connections for visibility but does not monetize or regulate offline arrangements between Partners.

**Notification added:**

|     |     |     |     |
| --- | --- | --- | --- |
| Event | Who | Channel | Message |
| New B2B connection created | Admin | In-app | "Partner \[buyerPartner\] is interested in \[listingPartner\]'s B2B listing: \[Property Title\]. Monitor for offline close." |

**Admin visibility in** `/admin/partners/[id]`**:**

- Show a "B2B Activity" tab listing all B2BConnections where this Partner is either listing or buyer side
- Columns: Property, Counter-Party Partner, Status (INTERESTED / NEGOTIATING / CLOSED), Date

**No change to the existing** `B2BConnection` **schema** — the current fields are sufficient for Admin awareness.