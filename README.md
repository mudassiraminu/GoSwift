# Swift Ship

FULL PRODUCT BUILD PROMPT — DELIVERY MARKETPLACE PLATFORM

We are building a complete, production-ready delivery marketplace platform.

IMPORTANT: I am attaching a UI/UX reference image with this prompt. Use the attached image ONLY as a visual and design reference for the overall look, layout, spacing, typography, cards, navigation, colors, and visual hierarchy.

DO NOT copy the business logic, features, text, or functionality from the reference image unless explicitly requested.

The actual product functionality, user roles, workflows, and business rules must follow the specifications below.

Build this as a real, scalable application — NOT a static landing page and NOT a basic MVP.

The platform should be designed to eventually operate across multiple cities and countries.

1. PRODUCT CONCEPT

The platform is a trusted delivery marketplace that connects:

Small businesses and individual customers who need delivery services.

Verified delivery companies that provide delivery services.

Delivery riders who are managed and assigned by delivery companies.

Platform administrators who manage the marketplace.

We are NOT directly recruiting or employing individual riders.

We partner with delivery companies.

Delivery companies register on the platform, submit their business information and verification documents, manage their own riders, receive delivery leads, provide delivery quotes, and assign riders to accepted delivery jobs.

The platform acts as the trusted marketplace, booking, payment, commission, and transaction layer between customers/businesses and delivery companies.

The core value proposition is:

"Find verified delivery providers, get transparent quotes, pay securely, and track your delivery with confidence."

2. CORE BUSINESS WORKFLOW

The complete delivery workflow should work as follows:

STEP 1:
A customer or small business owner creates a delivery request.

They provide:

Pickup location

Delivery/destination location

Pickup contact name

Pickup contact phone number

Recipient name

Recipient phone number

Package type

Package description

Package size

Estimated weight

Fragile package status

Special instructions

STEP 2:
The platform identifies delivery companies that operate in the relevant pickup and destination areas.

Only verified and active delivery companies should appear.

STEP 3:
The customer sees a list of matching delivery providers.

Each provider card should show:

Company name

Verified badge

Company logo

Average rating

Number of completed deliveries

Operating locations

Delivery service types

Delivery terms

Estimated response time

Short company description

The customer should NOT see the personal contact information of the assigned rider at this stage.

STEP 4:
The customer selects a delivery company.

The platform sends the selected delivery company a new delivery lead/request.

The provider receives:

"New delivery request received."

The provider can see:

Pickup location

Destination

Package information

Special instructions

Customer information where appropriate

STEP 5:
The delivery company reviews the request.

The delivery company must:

Provide a delivery quote/price

Provide estimated delivery time

Assign one of its registered riders

The provider submits:

Delivery price

Estimated delivery time

Assigned rider

Optional provider notes

STEP 6:
The customer receives the provider's quote.

The customer sees:

Delivery company

Verified status

Assigned rider name

Rider profile photo if available

Delivery price

Estimated delivery time

Delivery terms

Provider notes

The customer has two options:

ACCEPT QUOTE

or

REJECT QUOTE

STEP 7:
If the customer rejects the quote, the delivery request is closed or the customer may select another provider.

STEP 8:
If the customer accepts the quote, the customer must complete payment.

The customer should NOT receive the private contact details of the assigned rider before the quote is accepted and payment is successfully completed.

STEP 9:
After successful payment:

The delivery is confirmed.

The provider is notified.

The assigned rider is notified.

Relevant contact information becomes available to the customer and provider.

The delivery status changes to "Payment Secured" or "Ready for Pickup."

STEP 10:
The rider contacts the pickup person and begins the delivery.

Delivery statuses should include:

Request Created

Provider Selected

Quote Requested

Quote Submitted

Awaiting Customer Decision

Quote Accepted

Payment Pending

Payment Successful

Rider Assigned

Ready for Pickup

Pickup in Progress

Picked Up

In Transit

Delivered

Customer Confirmation Pending

Completed

Payment Released

Cancelled

Disputed

STEP 11:
The rider completes the delivery.

The rider or provider marks the delivery as "Delivered."

The system should support delivery proof, such as:

Delivery confirmation

Recipient name

Optional recipient signature

Optional delivery photo

Delivery timestamp

Delivery notes

STEP 12:
The customer confirms successful delivery.

The customer clicks:

"Confirm Delivery"

STEP 13:
After successful confirmation, the payment is released to the delivery company, minus the platform commission and applicable transaction fees.

Example:

Delivery fee: $100
Platform commission: 10%
Platform commission: $10
Provider payout: $90

The commission rate must NOT be hard-coded.

Administrators must be able to configure:

Default commission percentage

Provider-specific commission percentage

Transaction fees

Other applicable platform fees

3. PAYMENT ARCHITECTURE

The platform must be designed for secure payment collection and delayed provider settlement.

The platform should NOT directly hold customer funds in its own bank account.

The architecture must support integration with a compliant and licensed payment provider that supports appropriate payment collection, transaction management, commission deduction, and provider settlement/payout functionality.

Payment lifecycle:

Customer accepts quote
→ Payment required
→ Customer completes payment
→ Payment successful
→ Transaction marked as secured
→ Delivery proceeds
→ Delivery completed
→ Customer confirms delivery
→ Platform commission deducted
→ Provider payout initiated
→ Provider receives funds

Payment statuses:

Pending

Processing

Successful

Failed

Refunded

Partially Refunded

Held/Settlement Pending

Released

Disputed

Payout statuses:

Pending

Processing

Paid

Failed

Reversed

Build the payment architecture in a way that allows a real payment provider to be integrated later.

Do not create fake payment success logic as the final production implementation.

4. USER ROLES

Create secure role-based authentication and authorization for four primary roles:

CUSTOMER / BUSINESS USER

DELIVERY PROVIDER COMPANY

DELIVERY RIDER

PLATFORM ADMINISTRATOR

Each role must have its own permissions and dashboard.

5. CUSTOMER / BUSINESS USER

Users should be able to:

Register

Login

Logout

Reset password

Verify phone/email

Manage profile

Select Individual or Business account

Add business information

Create delivery requests

View matching delivery providers

View provider profiles

Select a delivery provider

Receive quotes

Accept quotes

Reject quotes

Make payments

View payment status

View active deliveries

View delivery status

View assigned rider after payment

View relevant contact information after payment

Confirm delivery

View delivery history

View invoices and receipts

Open disputes

View dispute status

Rate delivery providers

Rate riders

Receive notifications

Customer dashboard sections:

Overview

Create Delivery

Active Deliveries

Pending Quotes

Payments

Completed Deliveries

Disputes

Notifications

Profile

6. DELIVERY PROVIDER COMPANY

Delivery companies should be able to register.

Registration fields:

Company name

Company logo

Contact person

Phone

Email

Office address

Operating cities

Operating areas

Delivery service types

Business registration information

Verification documents

Bank/payment information

Company description

Delivery terms

Provider account status:

Pending Verification

Under Review

Verified

Rejected

Suspended

Active

Inactive

Only verified and active providers should appear in customer searches.

Provider dashboard:

Overview

New Leads

Quote Requests

Pending Quotes

Active Deliveries

Completed Deliveries

Cancelled Deliveries

Riders

Earnings

Commission

Payouts

Ratings

Company Profile

Notifications

Provider actions:

View new delivery lead

Accept/review lead

Submit quote

Set delivery price

Set estimated delivery time

Assign rider

Update delivery status

View completed deliveries

View earnings

View commission deductions

View payout history

7. RIDER MANAGEMENT

Delivery companies manage their own riders.

A provider can:

Add rider

Edit rider

Activate rider

Deactivate rider

Suspend rider

Assign rider to delivery

View rider delivery history

Rider information:

Full name

Profile photo

Phone number

Identification information

Vehicle type

Vehicle registration number

Service areas

Availability status

Rider statuses:

Available

Assigned

On Delivery

Offline

Suspended

Riders should only have access to deliveries assigned to them.

Riders should NOT have access to:

Other providers

Other riders

Platform-wide customer data

Financial information unrelated to their assigned deliveries

8. ADMINISTRATOR DASHBOARD

Create a comprehensive admin dashboard.

Admin overview should show:

Total users

Total businesses

Total verified providers

Total riders

Active deliveries

Completed deliveries

Cancelled deliveries

Disputed deliveries

Total transaction volume

Platform revenue

Provider payouts

Pending provider verification

Pending disputes

Admin sections:

Users

Businesses

Delivery Providers

Riders

Deliveries

Quotes

Payments

Payouts

Disputes

Reviews

Provider Verification

Commission Settings

Platform Settings

Notifications

Audit Logs

9. PROVIDER VERIFICATION

Admin must be able to:

Review provider application

Review uploaded documents

Approve provider

Reject provider

Request additional information

Suspend provider

Reactivate provider

Provider verification should display:

Pending

Under Review

Verified

Rejected

Suspended

Only verified providers can receive public delivery requests.

10. DELIVERY SEARCH AND MATCHING

When a customer enters:

Pickup Location
+
Destination Location

The system should identify providers based on:

Pickup service area

Destination service area

Provider availability

Provider active status

Provider verification status

Supported package types

Delivery service type

The system should prioritize relevant providers.

Do not require exact GPS matching for the first implementation.

Design the architecture so location-based matching can later be enhanced with maps and geolocation APIs.

11. QUOTE SYSTEM

The quote workflow must be transparent.

Customer:

Create delivery request
→ Select provider
→ Wait for quote

Provider:

Receive lead
→ Review request
→ Assign rider
→ Enter delivery price
→ Enter estimated delivery time
→ Submit quote

Customer:

View quote
→ Accept or Reject

Quote statuses:

Requested

Submitted

Accepted

Rejected

Expired

Cancelled

The system should record the full quote history.

12. DISPUTE SYSTEM

Customers should be able to open disputes for:

Delivery not completed

Package not received

Package damaged

Wrong delivery

Rider did not arrive

Incorrect delivery

Other issue

Users should be able to upload evidence where appropriate.

Admin can:

Review dispute

View delivery history

View payment information

View provider information

View rider information

View delivery proof

View communication records where available

Resolve dispute

Possible resolutions:

Release payment to provider

Full refund

Partial refund

Cancel transaction

Every dispute action must be logged with timestamp and administrator identity.

13. RATING AND REVIEW SYSTEM

After a successful delivery:

Customers can rate:

Delivery provider

Assigned rider

Providers can rate:

Customer

Business

Rating system:

1 to 5 stars

Written review

Average rating

Total review count

Only users involved in a completed transaction should be able to leave reviews.

Prevent duplicate reviews for the same transaction.

14. NOTIFICATION SYSTEM

Create an in-app notification system.

Notification events:

Account created

Provider verification update

New delivery request

Provider selected

Quote submitted

Quote accepted

Quote rejected

Payment successful

Rider assigned

Pickup started

Package picked up

Delivery in transit

Delivery completed

Customer confirmation required

Payment released

Payout completed

Dispute opened

Dispute updated

Dispute resolved

Design the notification architecture so email, SMS, WhatsApp, and push notifications can be integrated later.

15. CONTACT INFORMATION PRIVACY

This is an important business rule.

Before the customer accepts a quote and successfully completes payment:

Do not expose the assigned rider's personal phone number.

Do not expose private rider contact details.

Do not expose unnecessary private provider information.

After successful payment:

Reveal the relevant contact information needed to complete the delivery.

Keep an audit log of when sensitive contact information is revealed.

16. AUDIT LOGS

Create an audit trail for important actions.

Log:

User registration

Provider verification

Quote submission

Quote acceptance

Payment events

Rider assignment

Delivery status changes

Delivery completion

Payment release

Payout

Dispute actions

Admin actions

Account suspension

Each log should contain:

Action

User

Role

Timestamp

Related transaction/delivery

Previous state

New state

17. MAIN CUSTOMER NAVIGATION

Use:

Home

Find Delivery

My Deliveries

Quotes

Payments

Notifications

Profile

18. PROVIDER NAVIGATION

Use:

Dashboard

New Leads

Quotes

Active Deliveries

Completed

Riders

Earnings

Payouts

Reviews

Company Profile

Notifications

19. ADMIN NAVIGATION

Use:

Overview

Users

Businesses

Providers

Riders

Deliveries

Quotes

Payments

Payouts

Disputes

Reviews

Verification

Commission Settings

Platform Settings

Audit Logs

20. DESIGN AND UI/UX

Use the attached UI reference image as inspiration for the visual design.

Match the reference's overall visual quality, professionalism, layout principles, spacing, typography, card design, navigation style, and modern user experience where appropriate.

However, do not copy the reference's exact content or business logic.

The platform should feel:

Trustworthy

Modern

Professional

Simple

Fast

Secure

Logistics-focused

Use a clean, premium, modern interface.

Prioritize mobile-first responsive design because many customers and small businesses will access the platform from mobile devices.

Recommended visual direction:

Deep navy primary brand color

Blue accent color

Green for successful states

Neutral backgrounds

Clean white cards

Modern rounded corners

Clear status badges

Strong typography

Clear CTA buttons

Excellent spacing

Simple navigation

The interface should make users immediately understand:

Where to enter pickup location.

Where to enter destination.

How to find a provider.

How to request a quote.

How to accept a quote.

How to pay.

How to track delivery.

21. HOMEPAGE

Create a strong homepage with:

Hero section:

"Find Verified Delivery Providers You Can Trust."

Supporting text:

"Connect with trusted delivery companies, get transparent quotes, pay securely, and complete your delivery with confidence."

Primary CTA:

"Find a Delivery Provider"

Secondary CTA:

"Register Your Delivery Company"

Include:

How It Works

Why Choose Us

Verified Delivery Providers

Trust and Safety

Secure Payments

Delivery Tracking

Ratings and Reviews

Provider Registration CTA

22. DATABASE AND ARCHITECTURE

Design a scalable relational database structure.

Core entities should include:

Users

Businesses

Customer Profiles

Delivery Providers

Provider Verification Documents

Riders

Provider Service Areas

Delivery Requests

Delivery Quotes

Deliveries

Delivery Status History

Payments

Payouts

Commission Rules

Disputes

Dispute Evidence

Ratings

Reviews

Notifications

Audit Logs

Use proper relationships and foreign keys.

Ensure role-based access control is enforced at the backend level, not only through the frontend UI.

Do not expose sensitive data through client-side queries.

23. SECURITY

Implement:

Secure authentication

Role-based access control

Protected routes

Server-side authorization

Input validation

Secure file uploads

Sensitive data protection

Audit logs

Rate limiting where appropriate

Secure payment integration architecture

Never rely only on frontend restrictions for security.

24. SCALABILITY

Design the platform so it can later support:

Multiple cities

Multiple countries

Multiple currencies

Multiple languages

Multiple payment providers

Multiple delivery providers

Provider-specific commissions

City-specific commissions

API integrations

WhatsApp notifications

SMS notifications

Email notifications

Mobile applications

25. DEVELOPMENT APPROACH

Build this as a functional full-stack application.

Do not create a static mockup.

Do not create fake buttons that do nothing.

All major workflows should be connected.

Use realistic demo data only where necessary for testing.

Create reusable components and a clean architecture.

Make the UI fully responsive.

Ensure the system has clear empty states, loading states, success states, error states, and confirmation dialogs.

Before considering the project complete, test the entire end-to-end workflow:

Customer creates delivery request
→ Selects verified provider
→ Provider receives lead
→ Provider submits quote
→ Provider assigns rider
→ Customer receives quote
→ Customer accepts quote
→ Customer completes payment
→ Contact details become available
→ Rider completes delivery
→ Delivery marked delivered
→ Customer confirms delivery
→ Commission calculated
→ Provider payout initiated
→ Customer and provider leave ratings

Build the product with production readiness, scalability, security, and trust as the highest priorities.

Start by implementing the complete application architecture, authentication, database schema, role-based access control, and core dashboards. Then implement the delivery request, provider selection, quote, payment, delivery, payout, dispute, rating, notification, and admin workflows.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/29b44d93-8975-4cc1-abb9-465ed142b82e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
