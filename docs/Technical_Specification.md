# Technical Specification: Crop Digitwin Platform (Version 2.0)

This specification outlines the architecture for a high-fidelity Digital Twin platform designed to provide 90%+ accurate phenology-driven advisories by digitizing the biological and operational lifecycle of a crop.

## 1. System Vision & Core Mission

The platform architects farmer-level Digital Twins to optimize productivity and resource efficiency.

*   **Yield Optimization:** Maximum productivity through precise, stage-specific nutrition and protection.
*   **Operational Confidence:** Scientific decision support providing 90%+ accuracy through multi-source validation.
*   **Voice-First UX:** Leveraging the Bhashini/AI4Bharat stack to enable hands-free interaction for low-literacy users.

## 2. Backend Architecture: Hybrid Cloud & Edge

A dual-layer architecture ensures global analytics while maintaining field-level responsiveness in zero-connectivity environments.

### Cloud Layer (Global Strategy)
*   **Microservices Layer:** Decoupled services managing the Digital Twin state, task scheduling, and the Digital Decision Engine (DDE).
*   **Event Store:** A central immutable ledger capturing every state change with a unique UUID and deterministic hash for 100% auditability and provenance. (Powered by PostgreSQL with MongoDB for projections).
*   **Object Storage:** Secure repository for "ground truth" evidence, including geo-tagged photos, sensor logs, and drone-captured indices.

### Edge Runtime (Local Execution)
*   **Offline-First Resilience:** Deployment of Edge Runtimes capable of local inference in zero-connectivity environments using SQLite as the local Outbox buffer.
*   **Delta-Sync Protocol:** Utilizes an idempotent merge protocol to push the delta cache to the Cloud API once connectivity is restored.
*   **Resource Management:** The Edge Runtime is restricted to Nutrition, Protection, and Irrigation logic for the current crop stage to accommodate limited device memory.

## 3. Frontend Architecture: Voice-Routed UX

The UX is designed to move from complex navigation to "Voice-to-Action" using the Bhashini/AI4Bharat stack.

*   **Performance:** p95 latency for ASR/TTS must be < 2 seconds to maintain natural interaction.
*   **Daily Readiness Narrative:** The UI is sliced into hourly segments starting at 07:00 AM, divided into:
    *   **Yesterday (Audit):** Review of past activities.
    *   **Today (Action):** Immediate tasks to prevent "analysis paralysis".
    *   **7-Day Prediction (Preparation):** Upcoming requirements to ensure input availability.
*   **Offline Mapping:** Automated generation of MBTiles per cluster with a mandatory 14-day refresh cycle.

## 4. Digital Decision Engine (DDE) & Integrations

The DDE synthesizes sensor telemetry with human validation to generate high-precision advisories.

*   **Logic Weighting:** Physical hardware inputs (soil moisture, weather stations) are assigned a priority weight of >= 0.8.
*   **Irrigation Gate:** Before recommending irrigation, the DDE performs a mandatory 48-hour precipitation check against IMD forecasts.
*   **Phenology & Branching:**
    *   **GDD Tracking:** The system tracks biological time via Growing Degree Days (GDD) to trigger stage-based nutrition (e.g., SSP application at pre-sowing for Pulses).
    *   **Specific Branching:** Specialized logic for Tomatoes (e.g., "Leaf Curling" or "Yellowing") overrides standard calendars to issue corrective protection tasks.

### Required Third-Party Integrations

| Feature | Integration | Purpose |
| :--- | :--- | :--- |
| **Mapping & Land** | AgriStack / Bhuvan | Bidirectional linking with State Farmer IDs and OGC basemaps. |
| **Earth Observation** | Sentinel-2 / GEE | NDVI/VCI anomaly ingestion for advisory overrides. |
| **Weather** | IMD / GKMS | Direct ingestion of 5-day forecasts and Agromet advisories. |
| **Voice Services** | Bhashini / AI4Bharat | Real-time ASR/TTS execution in Indic languages. |

## 5. Security & Technical Standards

*   **Privacy:** Fully compliant with the DPDP Act 2023 with multilingual consent flows.
*   **Availability:** >= 99.5% (Cloud API).
*   **Latency:** Dashboard < 1s; Voice < 2s; Geo-tiles < 800ms.
*   **Compliance:** Hard enforcement of DGCA compliance for drone spray activation (RPC and UIN validation).
