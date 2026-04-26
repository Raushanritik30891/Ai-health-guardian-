// ============================================================
// TypeScript Interfaces — AI Health Guardian v2
// Generated for: dosage_rules.json + medicine_timing_rules.json
// ============================================================

// ─── DATASET 1: Dosage Rules ────────────────────────────────

export interface DosageRule {
  medicine: string;                   // Brand name(s) e.g. "Paracetamol (Crocin 500 / Dolo 650)"
  generic_name: string;               // INN/generic name
  usual_single_dose: string;          // e.g. "500–1000 mg"
  max_daily_dose: string;             // e.g. "4000 mg/day (healthy adults)"
  frequency: string;                  // e.g. "Every 4–6 hours as needed"
  warning_if_exceeded: string;        // Plain-language danger description
  special_risk_groups: string[];      // Array of at-risk groups with instructions
  source_name: string;                // e.g. "DailyMed (FDA)"
  source_url: string;                 // Canonical URL to source
  confidence: "high" | "moderate" | "low";
}

// ─── DATASET 2: Medicine Timing Rules ───────────────────────

export type TimingSeverity = "high" | "moderate" | "low";

export interface MedicineTimingRule {
  medicine_a: string;                 // Primary drug (brand + generic)
  medicine_b_or_food: string;         // Interacting drug or food/beverage
  minimum_gap: string;                // Plain-language gap instruction
  severity: TimingSeverity;           // Interaction severity
  reason: string;                     // Pharmacological explanation
  recommendation: string;             // Actionable patient/clinician guidance
  source_name: string;                // e.g. "DailyMed (FDA) — Warfarin label"
  source_url: string;                 // Canonical URL
  confidence: "high" | "moderate" | "low";
}

// ─── Utility: Lookup helpers ─────────────────────────────────

/**
 * Find all timing rules for a given medicine name (case-insensitive partial match)
 */
export function getTimingRulesForMedicine(
  rules: MedicineTimingRule[],
  medicineName: string
): MedicineTimingRule[] {
  const q = medicineName.toLowerCase();
  return rules.filter(
    (r) =>
      r.medicine_a.toLowerCase().includes(q) ||
      r.medicine_b_or_food.toLowerCase().includes(q)
  );
}

/**
 * Find dosage rule for a medicine (case-insensitive partial match)
 */
export function getDosageRule(
  rules: DosageRule[],
  medicineName: string
): DosageRule | undefined {
  const q = medicineName.toLowerCase();
  return rules.find(
    (r) =>
      r.medicine.toLowerCase().includes(q) ||
      r.generic_name.toLowerCase().includes(q)
  );
}

/**
 * Get all high-severity timing rules (MVP priority filter)
 */
export function getHighSeverityRules(
  rules: MedicineTimingRule[]
): MedicineTimingRule[] {
  return rules.filter((r) => r.severity === "high");
}
