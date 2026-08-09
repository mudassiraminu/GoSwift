import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2, MapPin, Package } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { MobileAppShell } from "@/components/mobile/app-shell";
import { RoleGuard } from "@/components/role-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createRequest } from "@/lib/marketplace/api";
import { useAuth } from "@/lib/supabase/auth";

export const Route = createFileRoute("/_authenticated/new-delivery")({
  head: () => ({
    meta: [
      { title: "New delivery — GOSwift" },
      {
        name: "description",
        content: "Create a delivery request and get quotes from verified providers.",
      },
    ],
  }),
  component: () => (
    <RoleGuard role="customer">
      <NewDeliveryPage />
    </RoleGuard>
  ),
});

function NewDeliveryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupCity, setPickupCity] = useState("");
  const [pickupContact, setPickupContact] = useState("");
  const [pickupPhone, setPickupPhone] = useState("");
  const [dropoffAddress, setDropoffAddress] = useState("");
  const [dropoffCity, setDropoffCity] = useState("");
  const [dropoffContact, setDropoffContact] = useState("");
  const [dropoffPhone, setDropoffPhone] = useState("");
  const [packageDescription, setPackageDescription] = useState("");
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");

  async function handleSubmit() {
    if (!user) return;
    if (!pickupAddress.trim() || !dropoffAddress.trim()) {
      toast.error("Pickup and delivery addresses are required.");
      return;
    }
    setSubmitting(true);
    try {
      const req = await createRequest(user.id, {
        pickup_address: pickupAddress.trim(),
        pickup_city: pickupCity.trim() || undefined,
        pickup_contact: pickupContact.trim() || undefined,
        pickup_phone: pickupPhone.trim() || undefined,
        dropoff_address: dropoffAddress.trim(),
        dropoff_city: dropoffCity.trim() || undefined,
        dropoff_contact: dropoffContact.trim() || undefined,
        dropoff_phone: dropoffPhone.trim() || undefined,
        package_description: packageDescription.trim() || undefined,
        package_weight_kg: weight ? Number(weight) : undefined,
        notes: notes.trim() || undefined,
      });
      toast.success("Delivery request posted — providers can quote now.");
      await navigate({ to: "/request/$id", params: { id: req.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create request");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <MobileAppShell
      header={
        <header className="pt-safe flex items-center gap-3 border-b border-border bg-background px-4 pb-3">
          <Link
            to="/dashboard"
            className="tap-scale flex h-10 w-10 items-center justify-center rounded-xl bg-secondary"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="font-display text-lg font-bold">New delivery</h1>
            <p className="text-xs text-muted-foreground">Step {step} of 3</p>
          </div>
        </header>
      }
    >
      <div className="space-y-5 px-5 pb-32 pt-4">
        <div className="flex gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                s <= step ? "bg-primary" : "bg-secondary"
              }`}
            />
          ))}
        </div>

        {step === 1 ? (
          <div className="gs-rise space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <MapPin className="h-4 w-4 text-primary" /> Pickup
            </div>
            <div className="space-y-2">
              <Label htmlFor="pickup">Pickup address</Label>
              <Input
                id="pickup"
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                placeholder="Street, landmark"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pickupCity">City</Label>
              <Input
                id="pickupCity"
                value={pickupCity}
                onChange={(e) => setPickupCity(e.target.value)}
                placeholder="e.g. Lagos"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="pickupContact">Contact name</Label>
                <Input
                  id="pickupContact"
                  value={pickupContact}
                  onChange={(e) => setPickupContact(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pickupPhone">Phone</Label>
                <Input
                  id="pickupPhone"
                  value={pickupPhone}
                  onChange={(e) => setPickupPhone(e.target.value)}
                  placeholder="+234…"
                />
              </div>
            </div>
            <Button className="h-12 w-full rounded-xl" onClick={() => setStep(2)}>
              Continue
            </Button>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="gs-rise space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <MapPin className="h-4 w-4 text-primary" /> Delivery
            </div>
            <div className="space-y-2">
              <Label htmlFor="dropoff">Drop-off address</Label>
              <Input
                id="dropoff"
                value={dropoffAddress}
                onChange={(e) => setDropoffAddress(e.target.value)}
                placeholder="Street, landmark"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dropoffCity">City</Label>
              <Input
                id="dropoffCity"
                value={dropoffCity}
                onChange={(e) => setDropoffCity(e.target.value)}
                placeholder="e.g. Abuja"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="dropoffContact">Recipient</Label>
                <Input
                  id="dropoffContact"
                  value={dropoffContact}
                  onChange={(e) => setDropoffContact(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dropoffPhone">Phone</Label>
                <Input
                  id="dropoffPhone"
                  value={dropoffPhone}
                  onChange={(e) => setDropoffPhone(e.target.value)}
                  placeholder="+234…"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="h-12 flex-1 rounded-xl" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button className="h-12 flex-1 rounded-xl" onClick={() => setStep(3)}>
                Continue
              </Button>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="gs-rise space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Package className="h-4 w-4 text-primary" /> Package
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">What are you sending?</Label>
              <Textarea
                id="desc"
                value={packageDescription}
                onChange={(e) => setPackageDescription(e.target.value)}
                placeholder="Clothes, documents, food…"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Estimated weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                min={0}
                step={0.1}
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Special instructions</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Fragile, call before arrival…"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="h-12 flex-1 rounded-xl" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button className="h-12 flex-1 rounded-xl" disabled={submitting} onClick={() => void handleSubmit()}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Post request
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </MobileAppShell>
  );
}
