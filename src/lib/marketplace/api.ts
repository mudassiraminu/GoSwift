import { supabase } from "@/lib/supabase/client";
import { encodeCompanyChoice, encodeCourierInfo, parseCompanyChoice } from "@/lib/marketplace/dispatch";
import type {
  Delivery,
  DeliveryProvider,
  DeliveryQuote,
  DeliveryRequest,
  DeliveryStatus,
  DeliveryStatusHistory,
  Payment,
  Rating,
  Rider,
} from "@/lib/supabase/types";

function trackingCode() {
  const n = Math.floor(100000 + Math.random() * 900000);
  return `GS${n}`;
}

export async function listMyRequests(customerId: string) {
  const { data, error } = await supabase
    .from("delivery_requests")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as DeliveryRequest[];
}

export async function listAllRequests() {
  const { data, error } = await supabase
    .from("delivery_requests")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as DeliveryRequest[];
}

export async function getRequest(id: string) {
  const { data, error } = await supabase.from("delivery_requests").select("*").eq("id", id).single();
  if (error) throw error;
  return data as DeliveryRequest;
}

export async function createRequest(
  customerId: string,
  input: {
    pickup_address: string;
    pickup_city?: string;
    pickup_contact?: string;
    pickup_phone?: string;
    dropoff_address: string;
    dropoff_city?: string;
    dropoff_contact?: string;
    dropoff_phone?: string;
    package_description?: string;
    package_weight_kg?: number;
    service_type?: string;
    notes?: string;
    /** Company chosen by customer from curated list */
    preferred_provider_id?: string;
    preferred_company_name?: string;
  },
) {
  const notes = input.preferred_provider_id
    ? encodeCompanyChoice(
        input.preferred_provider_id,
        input.preferred_company_name || "Company",
        input.notes,
      )
    : input.notes ?? null;

  const { data, error } = await supabase
    .from("delivery_requests")
    .insert({
      customer_id: customerId,
      pickup_address: input.pickup_address,
      pickup_city: input.pickup_city ?? null,
      pickup_contact: input.pickup_contact ?? null,
      pickup_phone: input.pickup_phone ?? null,
      dropoff_address: input.dropoff_address,
      dropoff_city: input.dropoff_city ?? null,
      dropoff_contact: input.dropoff_contact ?? null,
      dropoff_phone: input.dropoff_phone ?? null,
      package_description: input.package_description ?? null,
      package_weight_kg: input.package_weight_kg ?? null,
      service_type: input.preferred_company_name ?? input.service_type ?? null,
      notes,
      status: "open",
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as DeliveryRequest;
}

/** Companies listed by admin for customers to pick. */
export async function listListedCompanies() {
  const { data, error } = await supabase
    .from("delivery_providers")
    .select("*")
    .in("status", ["verified", "pending", "under_review"])
    .order("company_name", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as DeliveryProvider[]).filter(
    (p) => p.company_name !== "GOSwift Independent Couriers",
  );
}

export async function listAllCompaniesAdmin() {
  const { data, error } = await supabase
    .from("delivery_providers")
    .select("*")
    .order("company_name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as DeliveryProvider[];
}

/** Admin adds a delivery company (no company login required). */
export async function adminAddCompany(
  adminUserId: string,
  input: {
    company_name: string;
    phone?: string;
    office_address?: string;
    city?: string;
    contact_person?: string;
  },
) {
  const { data, error } = await supabase
    .from("delivery_providers")
    .insert({
      owner_id: adminUserId,
      company_name: input.company_name.trim(),
      phone: input.phone?.trim() || null,
      office_address: input.office_address?.trim() || null,
      city: input.city?.trim() || null,
      contact_person: input.contact_person?.trim() || null,
      status: "verified",
      verified_at: new Date().toISOString(),
      description: "Curated partner — contacted offline by GOSwift",
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as DeliveryProvider;
}

export async function adminUpdateCompanyStatus(
  id: string,
  status: "verified" | "suspended" | "inactive",
) {
  const { data, error } = await supabase
    .from("delivery_providers")
    .update({ status })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as DeliveryProvider;
}

/**
 * After offline negotiation with the company, admin posts the agreed price.
 * Creates an accepted quote + pending payment so the customer can pay.
 */
export async function adminPostPrice(opts: {
  request: DeliveryRequest;
  amount: number;
  adminId: string;
  providerId?: string;
}) {
  const parsed = parseCompanyChoice(opts.request.notes);
  const providerId = opts.providerId || parsed.providerId;
  if (!providerId) {
    throw new Error("No company linked to this request. Customer must pick a company.");
  }

  const { data: quote, error: qErr } = await supabase
    .from("delivery_quotes")
    .upsert(
      {
        request_id: opts.request.id,
        provider_id: providerId,
        amount: opts.amount,
        currency: "NGN",
        message: "Price agreed with company (offline)",
        status: "accepted",
      },
      { onConflict: "request_id,provider_id" },
    )
    .select("*")
    .single();
  if (qErr) throw qErr;

  await supabase.from("delivery_requests").update({ status: "quoted" }).eq("id", opts.request.id);

  // Replace previous pending payment if any
  await supabase.from("payments").delete().eq("request_id", opts.request.id).eq("status", "pending");

  const { data: payment, error: pErr } = await supabase
    .from("payments")
    .insert({
      request_id: opts.request.id,
      customer_id: opts.request.customer_id,
      amount: opts.amount,
      currency: "NGN",
      status: "pending",
      gateway: "manual",
    })
    .select("*")
    .single();
  if (pErr) throw pErr;

  return { quote: quote as DeliveryQuote, payment: payment as Payment };
}

/** Customer pays the admin-posted price (stub). Then courier details can be shown. */
export async function payAdminPostedPrice(opts: {
  paymentId: string;
  requestId: string;
  customerId: string;
  amount: number;
  providerId: string;
}) {
  const commission = Math.round(opts.amount * 0.1 * 100) / 100;
  const providerAmount = Math.round((opts.amount - commission) * 100) / 100;

  const { data: payment, error: payErr } = await supabase
    .from("payments")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      commission_amount: commission,
      provider_amount: providerAmount,
      gateway_reference: `manual_${Date.now()}`,
    })
    .eq("id", opts.paymentId)
    .select("*")
    .single();
  if (payErr) throw payErr;

  let delivery = await getDeliveryByRequest(opts.requestId);
  if (!delivery) {
    const { data, error } = await supabase
      .from("deliveries")
      .insert({
        request_id: opts.requestId,
        provider_id: opts.providerId,
        customer_id: opts.customerId,
        status: "assigned",
        tracking_code: trackingCode(),
      })
      .select("*")
      .single();
    if (error) throw error;
    delivery = data as Delivery;
  }

  await supabase.from("payments").update({ delivery_id: delivery.id }).eq("id", opts.paymentId);
  await supabase.from("delivery_requests").update({ status: "assigned" }).eq("id", opts.requestId);
  await addStatusHistory(delivery.id, "assigned", opts.customerId, "Payment received");

  return { payment: payment as Payment, delivery };
}

/** Admin records who will deliver (from company) — visible to customer after pay. */
export async function adminSetCourierContact(opts: {
  requestId: string;
  providerId: string;
  customerId: string;
  adminId: string;
  courierName: string;
  courierPhone: string;
}) {
  let delivery = await getDeliveryByRequest(opts.requestId);
  if (!delivery) {
    const { data, error } = await supabase
      .from("deliveries")
      .insert({
        request_id: opts.requestId,
        provider_id: opts.providerId,
        customer_id: opts.customerId,
        status: "assigned",
        tracking_code: trackingCode(),
      })
      .select("*")
      .single();
    if (error) throw error;
    delivery = data as Delivery;
  }

  const note = encodeCourierInfo(opts.courierName.trim(), opts.courierPhone.trim());
  await addStatusHistory(delivery.id, "assigned", opts.adminId, note);
  await supabase.from("delivery_requests").update({ status: "assigned" }).eq("id", opts.requestId);
  return delivery;
}

export async function getProvider(id: string) {
  const { data, error } = await supabase.from("delivery_providers").select("*").eq("id", id).single();
  if (error) throw error;
  return data as DeliveryProvider;
}

export async function listVerifiedProviders(city?: string) {
  let q = supabase.from("delivery_providers").select("*").eq("status", "verified");
  if (city?.trim()) q = q.ilike("city", `%${city.trim()}%`);
  const { data, error } = await q.order("avg_rating", { ascending: false });
  if (error) throw error;
  return (data ?? []) as DeliveryProvider[];
}

export async function listQuotesForRequest(requestId: string) {
  const { data, error } = await supabase
    .from("delivery_quotes")
    .select("*")
    .eq("request_id", requestId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as DeliveryQuote[];
}

export async function getPaymentForRequest(requestId: string) {
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("request_id", requestId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as Payment | null;
}

export async function getDeliveryByRequest(requestId: string) {
  const { data, error } = await supabase
    .from("deliveries")
    .select("*")
    .eq("request_id", requestId)
    .maybeSingle();
  if (error) throw error;
  return data as Delivery | null;
}

export async function listStatusHistory(deliveryId: string) {
  const { data, error } = await supabase
    .from("delivery_status_history")
    .select("*")
    .eq("delivery_id", deliveryId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as DeliveryStatusHistory[];
}

export async function addStatusHistory(
  deliveryId: string,
  status: DeliveryStatus,
  userId: string | null,
  note?: string,
) {
  await supabase.from("delivery_status_history").insert({
    delivery_id: deliveryId,
    status,
    changed_by: userId,
    note: note ?? null,
  });
}

export async function updateDeliveryStatus(
  deliveryId: string,
  status: DeliveryStatus,
  userId: string,
  note?: string,
) {
  const patch: Record<string, unknown> = { status };
  if (status === "picked_up") patch.picked_up_at = new Date().toISOString();
  if (status === "delivered") patch.delivered_at = new Date().toISOString();
  if (status === "confirmed") patch.confirmed_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("deliveries")
    .update(patch)
    .eq("id", deliveryId)
    .select("*")
    .single();
  if (error) throw error;
  await addStatusHistory(deliveryId, status, userId, note);
  return data as Delivery;
}

export async function confirmDeliveryAndPayout(delivery: Delivery, customerId: string) {
  const updated = await updateDeliveryStatus(
    delivery.id,
    "confirmed",
    customerId,
    "Customer confirmed",
  );
  await supabase
    .from("delivery_requests")
    .update({ status: "completed" })
    .eq("id", delivery.request_id);
  return updated;
}

export async function submitRating(input: {
  delivery_id: string;
  rater_id: string;
  provider_id: string;
  score: number;
  review?: string;
}) {
  const { data: rating, error } = await supabase
    .from("ratings")
    .upsert(
      {
        delivery_id: input.delivery_id,
        rater_id: input.rater_id,
        provider_id: input.provider_id,
        score: input.score,
      },
      { onConflict: "delivery_id,rater_id" },
    )
    .select("*")
    .single();
  if (error) throw error;
  if (input.review?.trim()) {
    await supabase.from("reviews").insert({
      rating_id: (rating as Rating).id,
      provider_id: input.provider_id,
      author_id: input.rater_id,
      body: input.review.trim(),
      is_published: true,
    });
  }
  return rating as Rating;
}

export function formatMoney(amount: number, currency = "NGN") {
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

// Legacy stubs kept so older imports don't break
export async function acceptQuote(quote: DeliveryQuote, customerId: string) {
  await supabase.from("delivery_quotes").update({ status: "accepted" }).eq("id", quote.id);
  const { data: payment, error } = await supabase
    .from("payments")
    .insert({
      request_id: quote.request_id,
      customer_id: customerId,
      amount: quote.amount,
      currency: quote.currency || "NGN",
      status: "pending",
      gateway: "stub",
    })
    .select("*")
    .single();
  if (error) throw error;
  return { quote, payment: payment as Payment };
}

export async function completePaymentStub(opts: {
  paymentId: string;
  quote: DeliveryQuote;
  customerId: string;
  riderId?: string | null;
}) {
  return payAdminPostedPrice({
    paymentId: opts.paymentId,
    requestId: opts.quote.request_id,
    customerId: opts.customerId,
    amount: opts.quote.amount,
    providerId: opts.quote.provider_id,
  });
}

export async function rejectQuote(quoteId: string) {
  const { data, error } = await supabase
    .from("delivery_quotes")
    .update({ status: "rejected" })
    .eq("id", quoteId)
    .select("*")
    .single();
  if (error) throw error;
  return data as DeliveryQuote;
}

export async function getRiderByUserId(userId: string) {
  const { data, error } = await supabase
    .from("riders")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as Rider | null;
}

export async function listDeliveriesForRider(riderId: string) {
  const { data, error } = await supabase
    .from("deliveries")
    .select("*")
    .eq("rider_id", riderId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Delivery[];
}
