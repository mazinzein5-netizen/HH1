import * as MailComposer from "expo-mail-composer";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Alert, Linking, Platform } from "react-native";
import type { PatientData } from "@/context/PatientContext";

/* ────────────────────────────────────────────────────────────────────────────
 * Prescription document generation + delivery utilities.
 * Everything runs on-device: the PDF is rendered locally and sent through the
 * patient's own mail app / share sheet / printer (Zero-Server framework).
 * Exposed as plain functions so other flows (e.g. the companion chat) can
 * reuse them later.
 * ──────────────────────────────────────────────────────────────────────────── */

export interface PrescriptionPatientInfo {
  fullName: string;
  dateOfBirth?: string;
  bloodType?: string;
}

const FOOTER_NOTE =
  "Issued via HIVE Intake : Patient Portal — for pharmacy information only. This document is not a legal prescription unless signed by a registered prescriber.";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Build the HTML used to render the Current Prescription PDF. */
export function buildPrescriptionHtml(
  patient: PrescriptionPatientInfo,
  data: PatientData
): string {
  const meds = data.kardex.filter((k) => k.status === "active");
  const today = new Date().toLocaleDateString("en-IE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const medRows = meds.length
    ? meds
        .map(
          (m, i) => `
        <tr>
          <td class="num">${i + 1}</td>
          <td><strong>${esc(m.medication)}</strong></td>
          <td>${esc(m.dose)}</td>
          <td>${esc(m.frequency)}</td>
          <td>${esc(m.route)}</td>
          <td>${esc(m.prescribedBy)}${m.prescriberIMC ? `<br/><span class="sub">IMC ${esc(m.prescriberIMC)}</span>` : ""}</td>
        </tr>`
        )
        .join("")
    : `<tr><td colspan="6" class="empty">No active medications recorded.</td></tr>`;

  const allergies = data.allergies.length
    ? data.allergies.map((a) => `${esc(a.drug)} (${esc(a.reaction)} — ${esc(a.severity)})`).join("; ")
    : "None recorded";

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #10182b; margin: 0; padding: 32px; font-size: 13px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #C9860A; padding-bottom: 14px; }
  .brand { font-size: 20px; font-weight: 800; color: #102060; letter-spacing: -0.3px; }
  .brand span { color: #C9860A; }
  .docTitle { font-size: 13px; font-weight: 700; color: #6b7280; letter-spacing: 2px; margin-top: 2px; }
  .dateBox { text-align: right; font-size: 12px; color: #374151; }
  .section { margin-top: 20px; }
  .sectionTitle { font-size: 11px; font-weight: 800; color: #102060; letter-spacing: 1.6px; margin-bottom: 8px; }
  .patientGrid { display: flex; gap: 28px; background: #f4f6fb; border: 1px solid #dde3f0; border-radius: 8px; padding: 12px 16px; }
  .patientGrid .cell .label { font-size: 10px; color: #6b7280; letter-spacing: 1px; }
  .patientGrid .cell .value { font-size: 14px; font-weight: 700; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; margin-top: 4px; }
  th { text-align: left; font-size: 10px; letter-spacing: 1px; color: #6b7280; border-bottom: 2px solid #102060; padding: 6px 8px; }
  td { padding: 8px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
  td.num { color: #9ca3af; width: 24px; }
  td .sub { font-size: 10px; color: #6b7280; }
  td.empty { color: #6b7280; font-style: italic; }
  .allergies { background: #fdf2f2; border: 1px solid #f5c2c7; border-radius: 8px; padding: 10px 14px; font-size: 12px; }
  .allergies strong { color: #b02a37; }
  .footer { margin-top: 28px; border-top: 1px solid #e5e7eb; padding-top: 12px; font-size: 10.5px; color: #6b7280; line-height: 1.5; }
  .sigRow { display: flex; justify-content: space-between; margin-top: 34px; }
  .sigBox { width: 46%; border-top: 1px solid #9ca3af; padding-top: 6px; font-size: 11px; color: #6b7280; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">HIVE <span>INTAKE</span></div>
      <div class="docTitle">CURRENT PRESCRIPTION RECORD</div>
    </div>
    <div class="dateBox">
      <div><strong>Date issued:</strong> ${esc(today)}</div>
      <div>Generated on the patient's device</div>
    </div>
  </div>

  <div class="section">
    <div class="sectionTitle">PATIENT DETAILS</div>
    <div class="patientGrid">
      <div class="cell"><div class="label">FULL NAME</div><div class="value">${esc(patient.fullName.trim() || "Not provided")}</div></div>
      <div class="cell"><div class="label">DATE OF BIRTH</div><div class="value">${esc(patient.dateOfBirth?.trim() || "Not provided")}</div></div>
      <div class="cell"><div class="label">BLOOD TYPE</div><div class="value">${esc(patient.bloodType?.trim() || "Not provided")}</div></div>
    </div>
  </div>

  <div class="section">
    <div class="sectionTitle">CURRENT MEDICATIONS</div>
    <table>
      <thead>
        <tr><th>#</th><th>MEDICATION</th><th>DOSE</th><th>FREQUENCY</th><th>ROUTE</th><th>PRESCRIBER</th></tr>
      </thead>
      <tbody>${medRows}</tbody>
    </table>
  </div>

  <div class="section">
    <div class="sectionTitle">DRUG ALLERGIES</div>
    <div class="allergies"><strong>Allergies:</strong> ${allergies}</div>
  </div>

  <div class="sigRow">
    <div class="sigBox">Prescriber signature (required for dispensing)</div>
    <div class="sigBox">Date &amp; stamp</div>
  </div>

  <div class="footer">${esc(FOOTER_NOTE)}</div>
</body>
</html>`;
}

/** Render the Current Prescription to a local PDF file. Returns the file URI. */
export async function generatePrescriptionPdf(
  patient: PrescriptionPatientInfo,
  data: PatientData
): Promise<string> {
  const html = buildPrescriptionHtml(patient, data);
  const { uri } = await Print.printToFileAsync({ html });
  return uri;
}

/**
 * Open the device mail composer with the prescription PDF attached and a
 * polite message. The patient picks or types the pharmacy address.
 * Falls back to a mailto: link (no attachment) if no mail account is set up.
 */
export async function emailPrescriptionToPharmacy(
  patient: PrescriptionPatientInfo,
  data: PatientData,
  pharmacyEmail?: string
): Promise<void> {
  const subject = `Prescription record — ${patient.fullName}`;
  const body = [
    "Dear Pharmacist,",
    "",
    "Please find attached my current prescription record for your information.",
    "I would be grateful if you could advise on availability and preparation.",
    "",
    "Kind regards,",
    ...(patient.fullName.trim() ? [patient.fullName] : []),
    "",
    FOOTER_NOTE,
  ].join("\n");

  if (Platform.OS === "web") {
    const mailto = `mailto:${pharmacyEmail ?? ""}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    Linking.openURL(mailto).catch(() => {
      Alert.alert("Unable to open mail", "Please send the prescription from the Share option instead.");
    });
    return;
  }

  const available = await MailComposer.isAvailableAsync();
  if (!available) {
    Alert.alert(
      "No mail account found",
      "Set up a mail account on this device, or use Share to send the prescription through another app."
    );
    return;
  }

  const pdfUri = await generatePrescriptionPdf(patient, data);
  await MailComposer.composeAsync({
    recipients: pharmacyEmail ? [pharmacyEmail] : [],
    subject,
    body,
    attachments: [pdfUri],
  });
}

/** Open the native print dialog (AirPrint / Android print service). */
export async function printPrescription(
  patient: PrescriptionPatientInfo,
  data: PatientData
): Promise<void> {
  const html = buildPrescriptionHtml(patient, data);
  await Print.printAsync({ html });
}

/** Share the prescription PDF via the share sheet (AirDrop, WhatsApp, etc.). */
export async function sharePrescriptionPdf(
  patient: PrescriptionPatientInfo,
  data: PatientData
): Promise<void> {
  const pdfUri = await generatePrescriptionPdf(patient, data);
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    Alert.alert("Sharing unavailable", "Your device does not support sharing files.");
    return;
  }
  await Sharing.shareAsync(pdfUri, {
    mimeType: "application/pdf",
    dialogTitle: "Share Prescription",
    UTI: "com.adobe.pdf",
  });
}

/** Dial a phone number (pharmacy call button). */
export function callPhoneNumber(phone: string) {
  const cleaned = phone.replace(/[^\d+]/g, "");
  if (Platform.OS === "web") {
    Alert.alert("Call Pharmacy", `On a phone this dials ${phone}.`);
    return;
  }
  Linking.openURL(`tel:${cleaned}`).catch(() => {
    Alert.alert("Unable to place call", `Please dial ${phone} manually.`);
  });
}

/* ────────────────────────────────────────────────────────────────────────────
 * Pharmacy finder — OpenStreetMap (Overpass + Nominatim), no API key needed.
 * ──────────────────────────────────────────────────────────────────────────── */

export interface NearbyPharmacy {
  id: string;
  name: string;
  lat: number;
  lon: number;
  distanceKm: number;
  phone?: string;
  openingHours?: string;
  openNow?: boolean; // undefined = unknown
  address?: string;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const DAY_KEYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;

/**
 * Best-effort "open now" check for common OSM opening_hours patterns like
 * "Mo-Fr 09:00-18:00; Sa 09:00-13:00" or "24/7".
 * Returns undefined when the format can't be interpreted confidently.
 */
export function isOpenNow(openingHours: string, now: Date = new Date()): boolean | undefined {
  const spec = openingHours.trim();
  if (!spec) return undefined;
  if (spec === "24/7") return true;

  const today = DAY_KEYS[now.getDay()];
  const minutes = now.getHours() * 60 + now.getMinutes();
  let sawParsableRule = false;
  let openNow = false;

  for (const rawRule of spec.split(";")) {
    const rule = rawRule.trim();
    if (!rule) continue;

    // "Su off" / "Su closed" style rules — those days are simply closed.
    const offMatch = rule.match(/^([A-Za-z ,-]+)\s+(?:off|closed)$/i);
    const m = offMatch ?? rule.match(/^([A-Za-z ,-]+)\s+([\d:,\s-]+)$/);
    if (!m) return undefined; // unknown syntax anywhere → don't guess

    const dayPart = m[1].trim();
    const timePart = offMatch ? "" : m[2].trim();

    // Expand day ranges/lists e.g. "Mo-Fr", "Sa", "Mo,We,Fr"
    const days = new Set<string>();
    for (const seg of dayPart.split(",")) {
      const s = seg.trim();
      const range = s.match(/^([A-Za-z]{2})\s*-\s*([A-Za-z]{2})$/);
      if (range) {
        const a = DAY_KEYS.indexOf(range[1] as (typeof DAY_KEYS)[number]);
        const b = DAY_KEYS.indexOf(range[2] as (typeof DAY_KEYS)[number]);
        if (a === -1 || b === -1) return undefined;
        for (let i = a; ; i = (i + 1) % 7) {
          days.add(DAY_KEYS[i]);
          if (i === b) break;
        }
      } else if (DAY_KEYS.includes(s as (typeof DAY_KEYS)[number])) {
        days.add(s);
      } else {
        return undefined;
      }
    }

    sawParsableRule = true;
    if (offMatch || !days.has(today)) continue;

    for (const span of timePart.split(",")) {
      const t = span.trim().match(/^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/);
      if (!t) return undefined;
      const start = parseInt(t[1], 10) * 60 + parseInt(t[2], 10);
      let end = parseInt(t[3], 10) * 60 + parseInt(t[4], 10);
      if (end <= start) end += 24 * 60; // spans midnight
      if (minutes >= start && minutes < end) openNow = true;
    }
  }

  return sawParsableRule ? openNow : undefined;
}

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

/** Find pharmacies within `radiusKm` of a coordinate via the Overpass API. */
export async function findNearbyPharmacies(
  lat: number,
  lon: number,
  radiusKm: number = 5
): Promise<NearbyPharmacy[]> {
  const radiusM = Math.round(radiusKm * 1000);
  const query = `[out:json][timeout:20];
(
  node["amenity"="pharmacy"](around:${radiusM},${lat},${lon});
  way["amenity"="pharmacy"](around:${radiusM},${lat},${lon});
);
out center tags;`;

  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "HIVE-Intake-App/1.0 (pharmacy finder)",
    },
    body: `data=${encodeURIComponent(query)}`,
  });
  if (!res.ok) throw new Error(`Pharmacy lookup failed (${res.status})`);
  const json = (await res.json()) as { elements?: OverpassElement[] };

  const results: NearbyPharmacy[] = [];
  for (const el of json.elements ?? []) {
    const plat = el.lat ?? el.center?.lat;
    const plon = el.lon ?? el.center?.lon;
    if (plat == null || plon == null) continue;
    const tags = el.tags ?? {};
    const hours = tags.opening_hours;
    const addressParts = [
      tags["addr:housenumber"],
      tags["addr:street"],
      tags["addr:city"] ?? tags["addr:town"],
    ].filter(Boolean);
    results.push({
      id: `${el.type}-${el.id}`,
      name: tags.name ?? "Pharmacy",
      lat: plat,
      lon: plon,
      distanceKm: haversineKm(lat, lon, plat, plon),
      phone: tags.phone ?? tags["contact:phone"],
      openingHours: hours,
      openNow: hours ? isOpenNow(hours) : undefined,
      address: addressParts.length ? addressParts.join(" ") : undefined,
    });
  }

  results.sort((a, b) => a.distanceKm - b.distanceKm);
  return results.slice(0, 25);
}

/** Geocode a town / area / Eircode via Nominatim (manual search fallback). */
export async function geocodePlace(
  queryText: string
): Promise<{ lat: number; lon: number; label: string } | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(queryText)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "HIVE-Intake-App/1.0 (pharmacy finder)" },
  });
  if (!res.ok) throw new Error(`Area search failed (${res.status})`);
  const json = (await res.json()) as { lat: string; lon: string; display_name: string }[];
  if (!json.length) return null;
  return {
    lat: parseFloat(json[0].lat),
    lon: parseFloat(json[0].lon),
    label: json[0].display_name,
  };
}
