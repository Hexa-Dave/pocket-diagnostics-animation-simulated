# Pocket Diagnostics --- Animation System

A standalone, browser-based visualisation layer for the Pocket
Diagnostics first-response appliance diagnostic system.

The animation system visualises diagnostic activity: customer input,
specialist verification nodes, the central Expert Guidance Engine, the
one-step-at-a-time customer conversation, re-evaluation, and the final
session outcome.

It is **not** the diagnostic engine. It does not decide whether a repair
is safe, interpret appliance faults, approve procedures, or replace the
main application's workflow. It visualises events and state supplied by
the main application.

## Project status

This repository now contains a working static Vite + TypeScript + PixiJS +
GSAP animation shell with:

- a central Expert Guidance Engine visual;
- a fixed workflow layout with status-driven department labels;
- customer and outcome panels;
- an input-driven simulated workflow for multiple selected customer symptoms;
- a typed event adapter compatible with the documented host integration.

The scene uses a fixed 1600 × 900 logical layout and scales uniformly to fit
the available viewport. Department positions do not move; active, completed,
blocked, and re-evaluated states are shown on their fixed workstation.

### Asset status

All configured workstation illustrations and the central-engine artwork are
present and loaded from `public/assets`. The scene draws its background,
connections, effects, and outcome panels directly rather than loading separate
image assets for them. The full flattened reference infographic is not used as
the scene.

### Input-driven demo

The Customer Input Features panel accepts appliance, model, age,
insurance/warranty, and one or more symptom selections (A–L). Any unchecked
appliance, model, or age field is requested through Customer Conversation
before the symptom route begins. Selecting insurance/warranty includes the
coverage review when the workflow reaches a repair decision. When multiple
symptoms are selected, the system completes the interview for each symptom in
order before starting the next. Safety escalation can pause the sequence.
The routes are illustrative only and do not diagnose the appliance or determine
repair advice.

Symptom A (`Not turning on`) has an interactive dishwasher demonstration.
Expert Guidance asks about observable power response, safety warning signs,
and breaker behavior; the relevant specialist nodes process each reply before
the next question.

Symptom B (`Making loud noise`) has an interactive dishwasher demonstration.
It gathers a description and timing, screens for safety concerns, and limits
customer checks to visible loading issues and normal user access. It can end as
resolved when the customer reports that correcting a visible loading issue
stopped the sound; otherwise it routes to a qualified technician. Coverage
review and a DIY preference question are included when insurance/warranty is
selected.

Symptoms C–L (`Not heating` through `Not spinning`) now have interactive
customer follow-up flows after the shared appliance/model/age intake. They
collect symptom-specific observations, check for relevant safety concerns,
and route unresolved or uncertain cases to a qualified technician. Error-code
text is recorded but not interpreted without model-verified documentation.
Burning-smell and repeated-breaker-trip concerns are escalated immediately.
These simulated flows do not diagnose a fault or prescribe internal repair.

These demos do not contain manufacturer manuals or model-verified repair
procedures and never direct the customer to open the appliance or test live
electrical components.

### Run commands

```bash
npm install
npm run dev -- --host 0.0.0.0 --port 4173
npm run build
npm run preview -- --host 0.0.0.0 --port 4173
```

### Event contract

```ts
const event = {
  type: 'GUIDANCE_MESSAGE',
  messageId: 'demo-1',
  text: 'Please confirm whether the dishwasher still has power.'
};
```

The host application dispatches events via `DiagnosticStateAdapter` to the
stage, which updates the relevant node states, signals, and conversation.

## 1. Goals

-   Build a lightweight single-page animation experience that can be
    hosted as static files.
-   Use TypeScript, PixiJS, GSAP and Vite.
-   Present an isometric business-infographic scene inspired by the
    supplied Pocket Diagnostics reference image.
-   Show small human-operated specialist workstations, not abstract
    floating icons or robot-only departments.
-   Animate specialist nodes conditionally, based on events from the
    diagnostic application.
-   Show information moving between relevant specialist nodes and the
    central Expert Guidance Engine.
-   Make the customer interaction visibly iterative: one question or
    instruction, customer response, re-evaluation, and the next
    response.
-   Keep the animation module independent of the diagnostic backend so
    that simulated events can be used during development.

## 2. Technology

-   **TypeScript** --- application and animation logic.
-   **PixiJS** --- 2D/2.5D scene rendering, sprites, containers, assets
    and pointer interaction.
-   **GSAP** --- timelines, character movement, node activation, signal
    pulses and transitions.
-   **Vite** --- local development server and static production build.

Do not introduce a backend, database, authentication system, or LLM
dependency into this animation-only project. Do not add a large
application framework unless there is a concrete requirement and it is
agreed first.

## 3. System boundary

The main Pocket Diagnostics application owns: - Customer case data and
conversation history. - Appliance identification and diagnostic
reasoning. - Specialist checks and their results. - Safety, warranty,
insurance and user-capability restrictions. - The decision about the
next customer-facing question or instruction. - Terminal decisions:
resolved, contact warranty/insurance provider, or contact a qualified
repair technician.

The animation module owns: - Rendering the scene and visual assets. -
Mapping application events to visual states. - Animating characters,
workstations, connections, highlights and transitions. - Showing the
current customer-facing conversation when supplied by the host
application. - Providing a demo event simulator for development and
presentation.

The animation must never imply that a visual effect is a real diagnostic
result. In demo mode, clearly identify the scenario as simulated.

## 4. Diagnostic nodes represented

Use stable IDs. The IDs below are visual identifiers and should be kept
consistent across configuration, event payloads and tests.

  -----------------------------------------------------------------------
  ID                      Node                    Purpose shown visually
  ----------------------- ----------------------- -----------------------
  `customer_input`        Customer problem input  Customer submits
                                                  appliance details,
                                                  symptoms, error codes,
                                                  photos and observations

  `A`                     Dishwasher              Identify brand, model,
                          identification          age and version

  `B`                     Most likely causes      Assess and rank
                                                  possible fault
                                                  explanations

  `C`                     Expert knowledge        Consult manufacturer
                                                  manuals and
                                                  expert-verified
                                                  knowledge

  `D`                     Diagnostic procedures   Identify applicable
                                                  checks and approved
                                                  procedures

  `E`                     Safety verification     Assess electrical,
                                                  water, slip/fall and
                                                  other action-related
                                                  hazards

  `F`                     Warranty verification   Check warranty coverage
                                                  and repair restrictions

  `G`                     Insurance verification  Check insurance
                                                  coverage, exclusions
                                                  and restrictions

  `H`                     Tools verification      Check required
                                                  equipment and user
                                                  capability

  `I`                     Parts identification    Identify potentially
                                                  required
                                                  model-compatible parts

  `J`                     Repair options          Present available and
                                                  permitted resolution
                                                  paths

  `K`                     Contradiction and       Cross-validate findings
                          consistency             and surface
                                                  inconsistencies

  `central_engine`        Expert Guidance Engine  Synthesize validated
                                                  findings and decide the
                                                  next customer-facing
                                                  response

  `conversation`          Interactive diagnostic  Show one question,
                          conversation            explanation or
                                                  instruction at a time,
                                                  followed by the
                                                  customer's response

  `outcome_resolved`      Resolved / permitted    End the session when
                          path                    the issue is resolved
                                                  or no further app
                                                  guidance is needed

  `outcome_provider`      Contact warranty /      End the session when a
                          insurance provider      provider must clarify
                                                  coverage or permission

  `outcome_technician`    Contact qualified       End the session when
                          repair technician       qualified professional
                                                  intervention is
                                                  required
  -----------------------------------------------------------------------

Specialist nodes are conditional. Do not activate every node in a fixed
sequence. The main application decides which checks are relevant and
emits corresponding events. Some checks may run in parallel; others may
depend on appliance identification or previous findings.

## 5. Core visual sequence

A typical visual sequence is:

1.  Customer submits a problem and appliance information.
2.  The customer input area activates and a signal travels to diagnostic
    orchestration.
3.  Relevant specialist workstations activate. Each active workstation
    shows a person working, reviewing information or checking documents.
4.  Specialist findings travel to the central Expert Guidance Engine.
5.  The central engine visibly synthesizes and validates findings.
6.  The conversation panel displays exactly the next customer-facing
    message supplied by the main application.
7.  The customer responds. The scene shows the response returning to the
    diagnostic system.
8.  Relevant checks are re-evaluated and the central engine prepares the
    next response.
9.  The cycle repeats until the main application supplies a terminal
    outcome.
10. The corresponding outcome is highlighted and the session is shown as
    ended.

Do not show a complete repair procedure all at once. The intended
customer experience is conversational and incremental.

## 6. Visual direction

-   Dark teal / deep blue-green background, with restrained cyan or
    turquoise highlights.
-   Isometric miniature office and workstation illustrations.
-   Human figures at specialist desks, with monitors, documents, tools
    and relevant technical objects.
-   Clear white or light-coloured connecting paths, with animated pulses
    indicating information flow.
-   A visually prominent central Expert Guidance Engine.
-   A distinct customer conversation area.
-   Legible labels and restrained text. Do not bake important labels
    into images; render them as text in the application.
-   Consistent camera angle, scale, lighting and illustration style
    across all extracted assets.
-   Use transparent PNGs for independent objects and sprite sheets only
    where frame animation is useful.

The supplied generated infographic is a visual reference, not a
production-ready background. Avoid using the full flattened infographic
as the whole scene. Extract or recreate individual assets so they can be
placed, highlighted and animated independently. Preserve the
human-operated specialist-office character of the reference.

## 7. Asset conventions

Suggested locations:

``` text
public/assets/
  backgrounds/
  characters/
    customer/
    specialists/
    guidance-expert/
  departments/
    customer-input/
    dishwasher-identification/
    likely-causes/
    expert-knowledge/
    diagnostic-procedures/
    safety-verification/
    warranty-verification/
    insurance-verification/
    tools-verification/
    parts-identification/
    repair-options/
    contradiction-check/
  central-engine/
  outcomes/
  effects/
  ui/
```

Naming conventions: - Use lowercase kebab-case filenames. - Prefer
descriptive names, e.g. `safety-specialist-idle.png`. - Keep character
sprites separate from workstation sprites where independent animation is
needed. - Keep department/workstation composites where a complete node
should move or scale as one unit. - Use transparent backgrounds for
reusable sprites. - Do not stretch assets non-uniformly. - Preserve a
consistent anchor point for sprites of the same type. - Document asset
dimensions, anchor points and intended use in an asset manifest.

If an asset is missing, create a clearly documented placeholder rather
than silently substituting an unrelated image. Do not invent a source
asset path.

## 8. Integration contract

The animation should expose a small, documented API to the host
application. Prefer a typed event interface and avoid importing
diagnostic business logic into the animation module.

Example event types:

``` ts
type DiagnosticAnimationEvent =
  | { type: "CASE_STARTED"; caseId: string }
  | { type: "CUSTOMER_INPUT_RECEIVED"; summary?: string }
  | { type: "NODE_ACTIVATED"; nodeId: string; label?: string }
  | { type: "NODE_PROGRESS"; nodeId: string; progress?: number }
  | { type: "NODE_COMPLETED"; nodeId: string; summary?: string }
  | { type: "NODE_BLOCKED"; nodeId: string; reason: "safety" | "warranty" | "insurance" | "capability" | "unknown" }
  | { type: "FINDINGS_SENT_TO_ENGINE"; nodeIds: string[] }
  | { type: "ENGINE_SYNTHESIS_STARTED" }
  | { type: "ENGINE_SYNTHESIS_COMPLETED" }
  | { type: "GUIDANCE_MESSAGE"; messageId: string; text: string }
  | { type: "CUSTOMER_RESPONSE"; messageId: string; text?: string }
  | { type: "REEVALUATION_STARTED"; nodeIds: string[] }
  | { type: "OUTCOME"; outcome: "resolved" | "contact_provider" | "contact_technician"; message?: string }
  | { type: "SESSION_ENDED" };
```

This is a suggested contract, not a requirement to copy blindly. Keep it
typed, documented and stable. Validate incoming event data and ignore or
report unknown node IDs safely.

The animation API should support: - `start()` / `stop()` or equivalent
lifecycle methods. - `resize(width, height)`. - `dispatch(event)` for
host-supplied events. - `reset()` to return to the initial visual
state. - `destroy()` to release PixiJS resources and event listeners. -
A demo mode that feeds a deterministic scenario through the same event
interface.

The host application remains the source of truth. The animation must not
independently infer outcomes from symptoms or decide that a procedure is
permitted.

## 9. Demo workflow

The Customer Input Features panel drives the simulated workflow. Multiple
selected symptoms are combined into one route; only departments included in
those symptom mappings activate. Selecting insurance/warranty adds both
provider verification departments. No terminal outcome or repair decision is
inferred from a symptom.

Use fictional/demo case content. Do not invent manufacturer-specific
procedures, error-code meanings, safety instructions or repair claims.

## 10. Accessibility and responsiveness

-   Support desktop and tablet layouts; adapt the scene for narrow
    screens.
-   Keep critical status text in HTML or accessible text layers where
    possible, not only inside artwork.
-   Provide reduced-motion handling. In reduced-motion mode, use simple
    fades/highlights instead of long moving paths or repeated pulses.
-   Ensure adequate contrast and readable labels.
-   Do not rely on colour alone to communicate blocked, active,
    completed or terminal states.

## 11. Development

Expected commands:

``` bash
npm install
npm run dev
npm run build
npm run preview
```

The production build should be static and deployable to a static hosting
service. Keep asset paths relative or Vite-compatible so the build can
be hosted under a subpath if required.

## 12. Definition of done

-   The scene loads without console errors.
-   All required node IDs have configuration entries.
-   Each node can be activated, progressed, completed and blocked
    through events.
-   Only nodes named in incoming events activate.
-   Parallel node activations are supported.
-   Findings can be shown flowing to the central engine.
-   The customer conversation is incremental and can update repeatedly.
-   All three terminal outcomes are visually distinct.
-   Demo scenarios run through the same event interface as the host
    application.
-   The scene resizes correctly and can be destroyed cleanly.
-   Reduced-motion mode is supported.
-   Missing assets have documented placeholders.
-   The project builds successfully for static hosting.
