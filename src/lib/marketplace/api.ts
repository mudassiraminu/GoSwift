import { supabase } from "@/lib/supabase/client";
import type {
  Delivery,
  DeliveryProvider,
  DeliveryQuote,
  DeliveryRequest,
  DeliveryStatus,
  DeliveryStatusHistory,
  Payment,
  Profile,
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

/** Admin: all delivery requests, newest first. */
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
  },
) {
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
      service_type: input.service_type ?? null,
      notes: input.notes ?? null,
      status: "open",
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as DeliveryRequest;
}

/** Independent couriers registered in the app. */
export async function listAllCouriers() {
  const { data, error } = await supabase
    .from("riders")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Rider[];
}

export async function listActiveCouriers(city?: string) {
  let q = supabase.from("riders").select("*").eq("status", "active");
  const { data, error } = await q.order("full_name", { ascending: true });
  if (error) throw error;
  let rows = (data ?? []) as Rider[];
  if (city?.trim()) {
    const c = city.trim().toLowerCase();
    // vehicle_type sometimes stores city notes; prefer phone/name match later via profile
    rows = rows.filter(
      (r) =>
        (r.vehicle_type ?? "").toLowerCase().includes(c) ||
        (r.full_name ?? "").toLowerCase().includes(c),
    );
  }
  return rows;
}

/** Create or update courier profile linked to auth user (admin-dispatch model). */
export async function ensureCourierProfile(
  userId: string,
  input: {
    full_name: string;
    phone?: string;
    city?: string;
    vehicle_type?: string;
  },
) {
  await supabase.from("user_roles").upsert(
    { user_id: userId, role: "rider" },
    { onConflict: "user_id,role" },
  );

  const existing = await getRiderByUserId(userId);
  if (existing) {
    const { data, error } = await supabase
      .from("riders")
      .update({
        full_name: input.full_name.trim() || existing.full_name,
        phone: input.phone ?? existing.phone,
        vehicle_type: input.vehicle_type ?? input.city ?? existing.vehicle_type,
        status: "active",
      })
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error) throw error;
    return data as Rider;
  }

  // Independent courier — provider_id optional if schema allows; else use a soft placeholder note in vehicle_type
  const row: Record<string, unknown> = {
    user_id: userId,
    full_name: input.full_name.trim() || "Courier",
    phone: input.phone ?? null,
    vehicle_type: input.vehicle_type ?? input.city ?? null,
    status: "active",
  };

  // Try insert without provider_id first (preferred for independent model)
  let { data, error } = await supabase.from("riders").insert(row).select("*").single();

  if (error && /provider_id|null value/i.test(error.message)) {
    // Fallback: attach to a system-owned independent pool provider if required by DB
    const pool = await ensureIndependentPoolProvider();
    ({ data, error } = await supabase
      .from("riders")
      .insert({ ...row, provider_id: pool.id })
      .select("*")
      .single());
  }
  if (error) throw error;
  return data as Rider;
}

async function ensureIndependentPoolProvider() {
  const { data: existing } = await supabase
    .from("delivery_providers")
    .select("*")
    .eq("company_name", "GOSwift Independent Couriers")
    .maybeSingle();
  if (existing) return existing as DeliveryProvider;

  // owner_id must be a real user — use first admin if any, else skip
  const { data: admin } = await supabase
    .from("user_roles")
    .select("user_id")
    .eq("role", "admin")
    .limit(1)
    .maybeSingle();

  if (!admin?.user_id) {
    throw new Error(
      "Could not create courier profile: set provider_id nullable on riders, or create an admin first.",
    );
  }

  const { data, error } = await supabase
    .from("delivery_providers")
    .insert({
      owner_id: admin.user_id,
      company_name: "GOSwift Independent Couriers",
      status: "verified",
      description: "Pool for self-registered couriers (admin dispatch)",
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as DeliveryProvider;
}

export async function getProfilesByIds(ids: string[]) {
  if (ids.length === 0) return [] as Profile[];
  const { data, error } = await supabase.from("profiles").select("*").in("id", ids);
  if (error) throw error;
  return (data ?? []) as Profile[];
}

/** Admin assigns a courier to a request: creates delivery row + marks request assigned. */
export async function adminAssignCourier(opts: {
  request: DeliveryRequest;
  riderId: string;
  adminId: string;
  amount?: number;
}) {
  const { request, riderId, adminId, amount } = opts;

  await supabase.from("delivery_requests").update({ status: "assigned" }).eq("id", request.id);

  // Prefer existing delivery for this request
  let delivery = await getDeliveryByRequest(request.id);
  if (delivery) {
    const { data, error } = await supabase
      .from("deliveries")
      .update({ rider_id: riderId, status: "assigned" })
      .eq("id", delivery.id)
      .select("*")
      .single();
    if (error) throw error;
    delivery = data as Delivery;
  } else {
    // provider_id may still be required — use courier's provider if any
    const rider = await getRider(riderId);
    const providerId = rider?.provider_id;
    if (!providerId) {
      throw new Error("Courier is missing provider link. Re-save courier profile or fix DB schema.");
    }
    const { data, error } = await supabase
      .from("deliveries")
      .insert({
        request_id: request.id,
        provider_id: providerId,
        rider_id: riderId,
        customer_id: request.customer_id,
        status: "assigned",
        tracking_code: trackingCode(),
      })
      .select("*")
      .single();
    if (error) throw error;
    delivery = data as Delivery;
  }

  if (amount && amount > 0) {
    await supabase.from("payments").insert({
      request_id: request.id,
      delivery_id: delivery.id,
      customer_id: request.customer_id,
      amount,
      currency: "NGN",
      status: "pending",
      gateway: "manual",
    });
  }

  await addStatusHistory(delivery.id, "assigned", adminId, "Admin assigned courier");
  return delivery;
}

export async function getRider(id: string) {
  const { data, error } = await supabase.from("riders").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as Rider | null;
}

export async function listVerifiedProviders(city?: string) {
  let q = supabase.from("delivery_providers").select("*").eq("status", "verified");
  if (city?.trim()) q = q.ilike("city", `%${city.trim()}%`);
  const { data, error } = await q.order("avg_rating", { ascending: false });
  if (error) throw error;
  return (data ?? []) as DeliveryProvider[];
}

export async function listOpenRequestsForProviders() {
  const { data, error } = await supabase
    .from("delivery_requests")
    .select("*")
    .in("status", ["open", "quoted"])
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as DeliveryRequest[];
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

export async function listQuotesForProvider(providerId: string) {
  const { data, error } = await supabase
    .from("delivery_quotes")
    .select("*")
    .eq("provider_id", providerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as DeliveryQuote[];
}

export async function submitQuote(input: {
  request_id: string;
  provider_id: string;
  amount: number;
  eta_minutes?: number;
  message?: string;
  currency?: string;
}) {
  const { data, error } = await supabase
    .from("delivery_quotes")
    .upsert(
      {
        request_id: input.request_id,
        provider_id: input.provider_id,
        amount: input.amount,
        currency: input.currency ?? "NGN",
        eta_minutes: input.eta_minutes ?? null,
        message: input.message ?? null,
        status: "pending",
      },
      { onConflict: "request_id,provider_id" },
    )
    .select("*")
    .single();
  if (error) throw error;
  await supabase.from("delivery_requests").update({ status: "quoted" }).eq("id", input.request_id);
  return data as DeliveryQuote;
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

export async function acceptQuote(quote: DeliveryQuote, customerId: string) {
  await supabase
    .from("delivery_quotes")
    .update({ status: "rejected" })
    .eq("request_id", quote.request_id)
    .neq("id", quote.id);

  const { data: accepted, error: qErr } = await supabase
    .from("delivery_quotes")
    .update({ status: "accepted" })
    .eq("id", quote.id)
    .select("*")
    .single();
  if (qErr) throw qErr;

  await supabase.from("delivery_requests").update({ status: "assigned" }).eq("id", quote.request_id);

  const { data: payment, error: pErr } = await supabase
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
  if (pErr) throw pErr;

  return { quote: accepted as DeliveryQuote, payment: payment as Payment };
}

export async function completePaymentStub(opts: {
  paymentId: string;
  quote: DeliveryQuote;
  customerId: string;
  riderId?: string | null;
}) {
  const commissionPct = await getCommissionPercentage();
  const commission = Math.round(((opts.quote.amount * commissionPct) / 100) * 100) / 100;
  const providerAmount = Math.round((opts.quote.amount - commission) * 100) / 100;

  const { data: payment, error: payErr } = await supabase
    .from("payments")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      commission_amount: commission,
      provider_amount: providerAmount,
      gateway_reference: `stub_${Date.now()}`,
    })
    .eq("id", opts.paymentId)
    .select("*")
    .single();
  if (payErr) throw payErr;

  const { data: delivery, error: dErr } = await supabase
    .from("deliveries")
    .insert({
      request_id: opts.quote.request_id,
      quote_id: opts.quote.id,
      provider_id: opts.quote.provider_id,
      rider_id: opts.riderId ?? null,
      customer_id: opts.customerId,
      status: "assigned",
      tracking_code: trackingCode(),
    })
    .select("*")
    .single();
  if (dErr) throw dErr;

  await supabase
    .from("payments")
    .update({ delivery_id: (delivery as Delivery).id })
    .eq("id", opts.paymentId);

  await addStatusHistory((delivery as Delivery).id, "assigned", opts.customerId, "Payment secured");

  return { payment: payment as Payment, delivery: delivery as Delivery };
}

async function getCommissionPercentage() {
  const { data } = await supabase
    .from("commission_rules")
    .select("percentage")
    .eq("active", true)
    .limit(1)
    .maybeSingle();
  return data?.percentage ?? 10;
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

export async function getDeliveryByRequest(requestId: string) {
  const { data, error } = await supabase
    .from("deliveries")
    .select("*")
    .eq("request_id", requestId)
    .maybeSingle();
  if (error) throw error;
  return data as Delivery | null;
}

export async function getDelivery(id: string) {
  const { data, error } = await supabase.from("deliveries").select("*").eq("id", id).single();
  if (error) throw error;
  return data as Delivery;
}

export async function listDeliveriesForCustomer(customerId: string) {
  const { data, error } = await supabase
    .from("deliveries")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Delivery[];
}

export async function listDeliveriesForProvider(providerId: string) {
  const { data, error } = await supabase
    .from("deliveries")
    .select("*")
    .eq("provider_id", providerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Delivery[];
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

export async function listStatusHistory(deliveryId: string) {
  const { data, error } = await supabase
    .from("delivery_status_history")
    .select("*")
    .eq("delivery_id", deliveryId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as DeliveryStatusHistory[];
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

export async function assignRider(deliveryId: string, riderId: string, userId: string) {
  const { data, error } = await supabase
    .from("deliveries")
    .update({ rider_id: riderId })
    .eq("id", deliveryId)
    .select("*")
    .single();
  if (error) throw error;
  await addStatusHistory(deliveryId, "assigned", userId, "Rider assigned");
  return data as Delivery;
}

export async function listRiders(providerId: string) {
  const { data, error } = await supabase
    .from("riders")
    .select("*")
    .eq("provider_id", providerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Rider[];
}

export async function getMyProvider(ownerId: string) {
  const { data, error } = await supabase
    .from("delivery_providers")
    .select("*")
    .eq("owner_id", ownerId)
    .maybeSingle();
  if (error) throw error;
  return data as DeliveryProvider | null;
}

export async function ensureProviderProfile(
  ownerId: string,
  companyName: string,
  phone?: string,
  city?: string,
) {
  const existing = await getMyProvider(ownerId);
  if (existing) return existing;

  const { data, error } = await supabase
    .from("delivery_providers")
    .insert({
      owner_id: ownerId,
      company_name: companyName,
      phone: phone ?? null,
      city: city ?? null,
      status: "pending",
    })
    .select("*")
    .single();
  if (error) throw error;

  await supabase.from("user_roles").upsert(
    { user_id: ownerId, role: "provider" },
    { onConflict: "user_id,role" },
  );

  return data as DeliveryProvider;
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

export async function setCourierStatus(riderId: string, status: "active" | "inactive") {
  const { data, error } = await supabase
    .from("riders")
    .update({ status })
    .eq("id", riderId)
    .select("*")
    .single();
  if (error) throw error;
  return data as Rider;
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

  const { data: payment } = await supabase
    .from("payments")
    .select("*")
    .eq("delivery_id", delivery.id)
    .maybeSingle();

  if (payment && payment.status === "paid" && delivery.provider_id) {
    const amount = payment.provider_amount ?? payment.amount * 0.9;
    await supabase.from("payouts").insert({
      provider_id: delivery.provider_id,
      payment_id: payment.id,
      amount,
      currency: payment.currency,
      status: "pending",
      reference: `po_${delivery.tracking_code ?? delivery.id.slice(0, 8)}`,
    });
  }

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

export async function getProvider(id: string) {
  const { data, error } = await supabase.from("delivery_providers").select("*").eq("id", id).single();
  if (error) throw error;
  return data as DeliveryProvider;
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
