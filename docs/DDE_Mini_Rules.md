# V2 DDE-mini (Digital Decision Engine): Edge Rule Specifications

The `DDE-mini` is a lightweight, strictly declarative rule engine designed to run identically on the Cloud API and the offline Edge Runtime (mobile app). It is strictly limited to Nutrition, Protection, and Irrigation logic for the *current* crop stage to prevent resource exhaustion on low-end Android devices.

## 1. Declarative Rule Engine Format

Instead of hardcoding business logic, the Edge Runtime downloads a JSON configuration of the current crop's ruleset.

```json
{
  "cropId": "CROP-TOMATO-001",
  "version": "1.0",
  "rules": [
    {
      "ruleId": "RULE_IRR_001",
      "type": "IRRIGATION_GATE",
      "description": "Block irrigation if soil is > 60% moist or > 15mm rain expected.",
      "conditions": {
        "operator": "OR",
        "evaluations": [
          {
            "fact": "currentSoilMoisture",
            "operator": "greaterThanInclusive",
            "value": 60
          },
          {
            "fact": "forecastedRainfall48h",
            "operator": "greaterThanInclusive",
            "value": 15
          }
        ]
      },
      "action": {
        "allow": false,
        "reasonCode": "DDE_IRR_BLOCKED_MOISTURE_OR_RAIN"
      }
    },
    {
      "ruleId": "RULE_PEST_001",
      "type": "PROTECTION_GATE",
      "description": "Trigger specific Tomato branch for Leaf Curling.",
      "conditions": {
        "operator": "AND",
        "evaluations": [
          {
            "fact": "observedSymptom",
            "operator": "equal",
            "value": "LEAF_CURLING"
          }
        ]
      },
      "action": {
        "allow": true,
        "overrideStandardCalendar": true,
        "advisoryTrigger": "ADVISORY_TOMATO_LEAF_CURL"
      }
    }
  ]
}
```

## 2. Porting Core Logic

### 2.1 The Irrigation Gate (48-Hour Precipitation Check)

When an Operator selects "I want to irrigate today", the Edge UI (Voice or Tap) evaluates the `IRRIGATION_GATE` rule.

1.  **Fact Injection**: The Edge Runtime evaluates its local state (the `local_projections` DB).
    *   `currentSoilMoisture`: Last sensor reading (e.g., 40%).
    *   `forecastedRainfall48h`: Last synced IMD/GKMS forecast (e.g., 20mm).
2.  **Evaluation Engine**: Runs the JSON rule. 20mm > 15mm => `allow: false`.
3.  **UX Flow**: The UI immediately blocks the action with reason: "DDE_IRR_BLOCKED_MOISTURE_OR_RAIN". No event is written to the Outbox.

### 2.2 Phenology & Growing Degree Days (GDD)

Crop stages (e.g., Vegetative to Flowering) progress aggressively based on GDD.

*   **Rule Type**: `STAGE_PROGRESSION`.
*   **Facts**: `accumulatedGDD` (calculated locally by summing `(Tmax + Tmin)/2 - Tbase` for each day in the local weather cache).
*   **Action**: If `accumulatedGDD >= 450`, the DDE-mini automatically spawns a `CropStageAdvanced` event into the Outbox Queue, transitioning the local state to "Flowering."

## 3. Escaping to the Cloud

If a rule evaluates to `needs_external_approval` (such as the CM Spray Approval Workflow with Escalation):

1.  The DDE-mini sets the `sync_status` of the proposed `PesticideApplied` event to `PENDING_APPROVAL`.
2.  The Sync Queue transmits this to the Cloud.
3.  The Cloud routes it to the Cluster Manager's dashboard.
4.  Once approved, the Cloud pushes an `ApprovalGranted` event down the Sync Queue to the Edge device, unlocking the UI for execution.
