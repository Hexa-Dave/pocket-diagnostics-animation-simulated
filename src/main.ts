import './styles/animation.css';
import { DiagnosticStateAdapter } from './integration/diagnostic-state-adapter';
import type { DiagnosticAnimationEvent, NodeId } from './integration/animation-events';
import { resolveSymptomWorkflow, SYMPTOMS, type CustomerInput } from './nodes/symptom-workflows';
import { CustomerConversationPanel } from './scene/customer-conversation';
import { PocketDiagnosticsStage } from './scene/stage';

type AdditionalSymptomCode = 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L';
type InteractiveNodeId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K';

interface SymptomInterview {
  code: AdditionalSymptomCode;
  nodeId: InteractiveNodeId;
  symptomLabel: string;
  clarification: string;
  choices?: readonly string[];
  followUp: string;
  followUpChoices: readonly string[];
  safetyQuestion: string;
}

const ADDITIONAL_SYMPTOM_INTERVIEWS: Record<AdditionalSymptomCode, SymptomInterview> = {
  C: {
    code: 'C',
    nodeId: 'C',
    symptomLabel: 'Not heating',
    clarification: 'After a normal dishwasher cycle, what makes you think it is not heating?',
    choices: ['Dishes remain cool', 'Dishes are wet and not drying', 'The cycle stops before finishing', 'Not sure'],
    followUp: 'Does this happen after every cycle or only sometimes?',
    followUpChoices: ['After every cycle', 'Only sometimes', 'First noticed today', 'Not sure'],
    safetyQuestion: 'Is there smoke, a burning smell, visible damage, water near electrical areas, or a breaker concern?'
  },
  D: {
    code: 'D',
    nodeId: 'B',
    symptomLabel: 'Not cooling',
    clarification: 'What do you mean by “not cooling” for this dishwasher?',
    choices: ['Dishes are not drying', 'It stays unusually hot', 'Something else', 'Not sure'],
    followUp: 'When did you first notice this, and does it happen after every cycle?',
    followUpChoices: ['After every cycle', 'Only sometimes', 'First noticed today', 'Not sure'],
    safetyQuestion: 'Is there smoke, a burning smell, visible damage, water near electrical areas, or a breaker concern?'
  },
  E: {
    code: 'E',
    nodeId: 'E',
    symptomLabel: 'Leaking water',
    clarification: 'When do you notice the water leak?',
    choices: ['During a cycle', 'After a cycle', 'Water is leaking now', 'Not sure'],
    followUp: 'Where can you see water from a safe, dry position without moving the dishwasher?',
    followUpChoices: ['Near the door', 'Under or behind the dishwasher', 'Cannot tell', 'No water is visible now'],
    safetyQuestion: 'Is water still escaping, near an electrical outlet or wiring, or creating a slip hazard?'
  },
  F: {
    code: 'F',
    nodeId: 'D',
    symptomLabel: 'Not draining',
    clarification: 'After a normal cycle has ended, can you see standing water inside the dishwasher?',
    choices: ['Yes', 'No', 'I have not checked', 'Not sure'],
    followUp: 'When did you first notice the draining concern?',
    followUpChoices: ['This cycle', 'More than one cycle', 'It happens intermittently', 'Not sure'],
    safetyQuestion: 'Is there leaking water, a burning smell, smoke, visible damage, or a breaker concern?'
  },
  G: {
    code: 'G',
    nodeId: 'B',
    symptomLabel: 'Vibrating excessively',
    clarification: 'How does the dishwasher move when the excessive vibration occurs?',
    choices: ['Vibrates but stays in place', 'Shifts or rocks noticeably', 'Makes contact with nearby items', 'Not sure'],
    followUp: 'When do you notice the vibration?',
    followUpChoices: ['During filling', 'During washing', 'During draining', 'Throughout the cycle or not sure'],
    safetyQuestion: 'Is the dishwasher moving enough to risk falling, leaking, or damaging nearby items, or is there smoke or a burning smell?'
  },
  H: {
    code: 'H',
    nodeId: 'C',
    symptomLabel: 'Error code on display',
    clarification: 'Please enter the exact code or message shown on the display. If none is visible, enter “none”; if unsure, enter “not sure”.',
    followUp: 'When does the message appear?',
    followUpChoices: ['As soon as it is turned on', 'During a cycle', 'At the end of a cycle', 'It comes and goes or not sure'],
    safetyQuestion: 'Is the code accompanied by smoke, a burning smell, leaking water, visible damage, or a breaker concern?'
  },
  I: {
    code: 'I',
    nodeId: 'D',
    symptomLabel: 'Door not sealing',
    clarification: 'What have you noticed about the door?',
    choices: ['A visible gap when closed', 'It will not stay closed', 'Water escapes at the door', 'Not sure'],
    followUp: 'Can you see an item preventing the door from closing, without forcing the door or removing panels?',
    followUpChoices: ['Yes, a visible item', 'No', 'Not sure'],
    safetyQuestion: 'Is water escaping now, or is there smoke, a burning smell, visible damage, or a breaker concern?'
  },
  J: {
    code: 'J',
    nodeId: 'E',
    symptomLabel: 'Burning smell',
    clarification: 'Is the burning smell happening now, or did you notice it earlier?',
    choices: ['Happening now', 'Stopped, but happened during use', 'Not sure'],
    followUp: 'Have you also seen smoke, sparks, or visible scorching?',
    followUpChoices: ['Yes', 'No', 'Not sure'],
    safetyQuestion: 'Is there any active burning smell, smoke, sparks, or visible scorching?'
  },
  K: {
    code: 'K',
    nodeId: 'E',
    symptomLabel: 'Tripping breaker',
    clarification: 'How often has the dishwasher circuit breaker tripped?',
    choices: ['More than once', 'Once', 'I am not sure'],
    followUp: 'Is the breaker currently tripped or refusing to stay on?',
    followUpChoices: ['Yes', 'No', 'Not sure'],
    safetyQuestion: 'Has the breaker tripped more than once, or does it not stay on?'
  },
  L: {
    code: 'L',
    nodeId: 'D',
    symptomLabel: 'Not spinning',
    clarification: 'At what point do you notice the dishwasher is not spinning or moving as expected?',
    choices: ['At the start', 'During the wash', 'Near the end', 'Not sure'],
    followUp: 'What else do you notice at the same time?',
    followUpChoices: ['Error message', 'Unusual noise', 'Cycle stops', 'Nothing else or not sure'],
    safetyQuestion: 'Is there smoke, a burning smell, leaking water, visible damage, or a breaker concern?'
  }
};

function isAdditionalSymptomCode(code: string): code is AdditionalSymptomCode {
  return Object.prototype.hasOwnProperty.call(ADDITIONAL_SYMPTOM_INTERVIEWS, code);
}

class DiagnosticAnimationApp {
  private readonly stage: PocketDiagnosticsStage;
  private readonly adapter: DiagnosticStateAdapter;
  private readonly conversation: CustomerConversationPanel;
  private timerId: number | undefined;
  private workflowGeneration = 0;
  private caseNumber = 0;
  private selectedSymptoms: typeof SYMPTOMS[number][] = [];
  private currentSymptomIndex = 0;
  private readonly symptomResults: Array<{ code: string; label: string; status: 'resolved' | 'technician' }> = [];

  public constructor(container: HTMLElement) {
    container.innerHTML = `
      <div class="app-shell">
        <div class="simulated-tag">Simulated</div>
        <div class="stage-host" aria-label="Pocket Diagnostics animation scene"></div>
      </div>
    `;

    const stageHost = container.querySelector('.stage-host');
    if (!(stageHost instanceof HTMLDivElement)) {
      throw new Error('Pocket Diagnostics stage host was not found');
    }

    const appShell = container.querySelector('.app-shell');
    if (!(appShell instanceof HTMLDivElement)) {
      throw new Error('Pocket Diagnostics app shell was not found');
    }

    this.conversation = new CustomerConversationPanel(appShell);
    this.stage = new PocketDiagnosticsStage(
      stageHost,
      (input) => this.runInputWorkflow(input),
      this.conversation.element
    );
    this.adapter = new DiagnosticStateAdapter(this.stage);
    void this.stage.ready.catch((error: unknown) => {
      console.error('Unable to initialize the Pocket Diagnostics scene', error);
      stageHost.textContent = 'The animation could not start. Check the browser console for details.';
    });
  }

  private runInputWorkflow(input: CustomerInput): void {
    const workflow = resolveSymptomWorkflow(input);
    if (workflow.symptoms.length === 0) {
      return;
    }

    this.conversation.clear();
    this.workflowGeneration += 1;
    const generation = this.workflowGeneration;
    if (this.timerId !== undefined) {
      window.clearTimeout(this.timerId);
    }
    this.selectedSymptoms = workflow.symptoms;
    this.currentSymptomIndex = 0;
    this.symptomResults.length = 0;
    this.currentCaseInput = input;

    this.caseNumber += 1;
    this.stage.reset(true);
    this.stage.setCaseLabel(`CASE-${String(this.caseNumber).padStart(3, '0')}`);

    const symptomSummary = workflow.symptoms
      .map((symptom) => `${symptom.code}. ${symptom.label}`)
      .join('; ');
    this.dispatch({ type: 'CUSTOMER_INPUT_RECEIVED', summary: symptomSummary });
    this.dispatch({ type: 'NODE_COMPLETED', nodeId: 'customer_input', summary: symptomSummary });
    this.conversation.note('Customer', symptomSummary);
    this.dispatch({ type: 'ENGINE_SYNTHESIS_STARTED' });
    this.schedule(generation, 350, () => {
      this.dispatch({ type: 'ENGINE_SYNTHESIS_COMPLETED' });
      this.collectIdentificationDetails(input, generation, () => this.runNextSymptom(input, generation));
    });
  }

  private runNextSymptom(input: CustomerInput, generation: number): void {
    if (generation !== this.workflowGeneration) {
      return;
    }

    const symptom = this.selectedSymptoms[this.currentSymptomIndex];
    if (!symptom) {
      this.finishSymptomSequence();
      return;
    }

    this.conversation.note(
      'Expert Guidance',
      `Reviewing symptom ${this.currentSymptomIndex + 1} of ${this.selectedSymptoms.length}: ${symptom.code}. ${symptom.label}.`
    );
    if (symptom.code === 'A') {
      this.runNotTurningOnWorkflow(input, generation);
    } else if (symptom.code === 'B') {
      this.runLoudNoiseWorkflow(input, generation);
    } else if (isAdditionalSymptomCode(symptom.code)) {
      this.runAdditionalSymptomWorkflow(
        ADDITIONAL_SYMPTOM_INTERVIEWS[symptom.code],
        input,
        generation
      );
    } else {
      this.runSimulatedDepartmentRoute(
        resolveSymptomWorkflow(input).departments,
        `${symptom.code}. ${symptom.label}`,
        generation
      );
    }
  }

  private finishCurrentSymptom(status: 'resolved' | 'technician', message: string, stopSequence = false): void {
    const symptom = this.selectedSymptoms[this.currentSymptomIndex];
    if (!symptom) {
      return;
    }
    this.symptomResults.push({ code: symptom.code, label: symptom.label, status });
    if (stopSequence) {
      this.finishSymptomSequence(true, message);
      return;
    }

    this.currentSymptomIndex += 1;
    if (this.currentSymptomIndex < this.selectedSymptoms.length) {
      const next = this.selectedSymptoms[this.currentSymptomIndex];
      this.conversation.note(
        'Expert Guidance',
        `Symptom ${symptom.code} review is complete. Starting symptom ${next.code}: ${next.label}.`
      );
      this.schedule(this.workflowGeneration, 600, () => {
        this.runNextSymptom(
          this.currentCaseInput,
          this.workflowGeneration
        );
      });
      return;
    }
    this.finishSymptomSequence();
  }

  private currentCaseInput: CustomerInput = {
    appliance: false,
    model: false,
    age: false,
    insuranceWarranty: false,
    symptoms: []
  };

  private finishSymptomSequence(stoppedForSafety = false, safetyMessage = ''): void {
    const hasTechnicianRecommendation = stoppedForSafety
      || this.symptomResults.some((result) => result.status === 'technician');
    const statusSummary = this.symptomResults
      .map((result) => `${result.code} ${result.status === 'resolved' ? 'reported resolved' : 'needs technician review'}`)
      .join('; ');
    const message = stoppedForSafety
      ? safetyMessage
      : `${statusSummary}. ${hasTechnicianRecommendation
        ? 'Contact a qualified technician for unresolved symptoms.'
        : 'All selected symptoms were reported as no longer occurring.'} No component diagnosis is confirmed by this demo.`;
    this.dispatch({
      type: 'OUTCOME',
      outcome: hasTechnicianRecommendation ? 'contact_technician' : 'resolved',
      message
    });
    this.dispatch({ type: 'SESSION_ENDED' });
    if (!stoppedForSafety) {
      this.conversation.note('Expert Guidance', 'All selected symptoms have been reviewed in sequence.');
    }
  }

  private runSimulatedDepartmentRoute(
    departments: NodeId[],
    symptomSummary: string,
    generation: number
  ): void {
    let departmentIndex = 0;
    const runNextDepartment = (): void => {
      if (generation !== this.workflowGeneration) {
        return;
      }

      if (departmentIndex >= departments.length) {
        this.dispatch({ type: 'FINDINGS_SENT_TO_ENGINE', nodeIds: departments });
        this.dispatch({ type: 'ENGINE_SYNTHESIS_STARTED' });
        this.schedule(generation, 650, () => {
          this.dispatch({ type: 'ENGINE_SYNTHESIS_COMPLETED' });
          this.dispatch({
            type: 'GUIDANCE_MESSAGE',
            messageId: `route-${this.caseNumber}`,
            text: `Simulated review path visualized for: ${symptomSummary}. This demo does not diagnose the appliance or determine a repair.`
          });
        });
        return;
      }

      const nodeId = departments[departmentIndex];
      this.dispatch({ type: 'NODE_ACTIVATED', nodeId });
      this.schedule(generation, 360, () => {
        this.dispatch({
          type: 'NODE_COMPLETED',
          nodeId,
          summary: 'Simulated review step'
        });
        departmentIndex += 1;
        this.schedule(generation, 180, runNextDepartment);
      });
    };

    this.schedule(generation, 250, runNextDepartment);
  }

  private runNotTurningOnWorkflow(input: CustomerInput, generation: number): void {
    this.processNode('K', 'Initial symptom consistency check', generation, () => {
          this.askFromNode(
            'K',
            'When you press Power, what do you observe?',
            ['No lights or sounds', 'Lights or beeps', 'It now responds', 'Not sure'],
            generation,
            (response) => {
              if (response === 'It now responds') {
                this.confirmResolution(generation, () => this.screenSafetyAndBreaker(input, generation));
                return;
              }
              if (response === 'Lights or beeps') {
                this.conversation.note(
                  'Contradiction Check',
                  'Some response is present, so this is not treated as a completely dead unit.'
                );
              }
              this.screenSafetyAndBreaker(input, generation);
            }
          );
    });
  }

  private runLoudNoiseWorkflow(input: CustomerInput, generation: number): void {
    this.processNode('B', 'Customer-reported loud noise recorded; no cause inferred', generation, () => {
      this.askFromNode(
        'B',
        'Which description best matches the sound?',
        ['Rattling or clattering', 'Grinding or scraping', 'Humming or buzzing', 'Thumping or banging', 'Other or not sure'],
        generation,
        (sound) => {
          this.askFromNode(
            'B',
            'When do you notice the noise?',
            ['At startup or filling', 'During the wash', 'During draining', 'Throughout the cycle', 'Only occasionally or not sure'],
            generation,
            (timing) => {
              this.processNode(
                'K',
                `Noise description recorded: ${sound}; timing: ${timing}`,
                generation,
                () => this.screenNoiseSafety(input, generation)
              );
            }
          );
        }
      );
    });
  }

  private runAdditionalSymptomWorkflow(
    interview: SymptomInterview,
    input: CustomerInput,
    generation: number
  ): void {
    const nodeId = interview.nodeId;
    const continueInterview = (): void => {
      this.processNode(
        'K',
        `${interview.code}. ${interview.clarification} captured; no fault inferred.`,
        generation,
        () => {
          this.askFromNode(
            nodeId,
            interview.clarification,
            interview.choices,
            generation,
            (clarification) => {
              this.processNode(
                'K',
                `Customer detail recorded: ${clarification}`,
                generation,
                () => {
                  this.askFromNode(
                    nodeId,
                    interview.followUp,
                    interview.followUpChoices,
                    generation,
                    (followUp) => {
                      if (interview.code === 'J' || interview.code === 'K') {
                        const concernObserved = followUp === 'Yes'
                          || followUp === 'Not sure'
                          || (interview.code === 'K' && clarification === 'More than once');
                        if (concernObserved) {
                          this.endWithTechnician(
                            generation,
                            interview.code === 'J'
                              ? 'Stop using the dishwasher. Do not open it or investigate the source of the smell. Contact a qualified technician; if there is smoke or active fire, leave the area and contact emergency services.'
                              : 'Do not reset or repeatedly operate the breaker. Contact a qualified technician or electrician to assess the reported trip.',
                            false
                          );
                          return;
                        }
                        this.reviewAdditionalSymptom(
                          interview,
                          input,
                          generation,
                          clarification,
                          followUp
                        );
                        return;
                      }
                      this.screenAdditionalSymptomSafety(interview, input, generation, clarification, followUp);
                    }
                  );
                }
              );
            }
          );
        }
      );
    };

    if (interview.code === 'J' || interview.code === 'K') {
      this.askFromNode(
        'E',
        interview.safetyQuestion,
        ['Yes', 'No', 'Not sure'],
        generation,
        (response) => {
          if (response !== 'No') {
            this.endWithTechnician(
              generation,
              interview.code === 'J'
                ? 'Stop using the dishwasher. Do not open it or investigate the source of the smell. Contact a qualified technician; if there is smoke or active fire, leave the area and contact emergency services.'
                : 'Do not reset or repeatedly operate the breaker. Contact a qualified technician or electrician to assess the repeated trip.',
              false
            );
            return;
          }
          continueInterview();
        }
      );
      return;
    }

    continueInterview();
  }

  private screenAdditionalSymptomSafety(
    interview: SymptomInterview,
    input: CustomerInput,
    generation: number,
    clarification: string,
    followUp: string
  ): void {
    const safetySensitive = interview.code === 'E' || interview.code === 'G';
    const safetyNode: 'D' | 'E' = safetySensitive ? 'E' : 'D';
    this.processNode(safetyNode, 'Symptom-specific safety review started', generation, () => {
      this.askFromNode(
        'E',
        interview.safetyQuestion,
        ['No', 'Yes', 'Not sure'],
        generation,
        (safetyResponse) => {
          const uncertainOrUnsafe = safetyResponse !== 'No';
          const activeLeak = interview.code === 'E' &&
            (clarification === 'Water is leaking now' || safetyResponse === 'Yes');
          const unstableUnit = interview.code === 'G' &&
            clarification === 'Shifts or rocks noticeably';
          if (uncertainOrUnsafe || activeLeak || unstableUnit) {
            this.endWithTechnician(
              generation,
              activeLeak
                ? 'Water is reported to be leaking now or presenting a safety concern. Avoid the wet area and do not touch the appliance or nearby electrical equipment. Contact a qualified technician.'
                : unstableUnit
                  ? 'Stop using the dishwasher if it is shifting or rocking noticeably. Do not try to move or adjust it; contact a qualified technician.'
                  : 'A safety concern was reported or could not be ruled out. Stop using the dishwasher and do not open it. Contact a qualified technician.',
              false
            );
            return;
          }
          this.reviewAdditionalSymptom(
            interview,
            input,
            generation,
            clarification,
            followUp
          );
        }
      );
    });
  }

  private reviewAdditionalSymptom(
    interview: SymptomInterview,
    input: CustomerInput,
    generation: number,
    clarification: string,
    followUp: string
  ): void {
    this.processNode(
      'B',
      `${interview.code} symptom details reviewed; possible causes remain unconfirmed.`,
      generation,
      () => {
        this.processNode(
          'C',
          'No model-verified manufacturer instructions or code interpretation are available in this demo.',
          generation,
          () => {
            this.processNode(
              'D',
              'Only customer-observable details were reviewed; no internal repair procedure was selected.',
              generation,
              () => {
                if (interview.code === 'H') {
                  this.conversation.note(
                    'Expert Knowledge',
                    `The reported display text was recorded (“${clarification}”). This demo cannot safely interpret it without verified manufacturer documentation.`
                  );
                }
                this.askFromNode(
                  'K',
                  `Is “${interview.code}. ${this.symptomLabel(interview.code)}” still happening?`,
                  ['Yes', 'No, it has stopped', 'Not sure'],
                  generation,
                  (status) => {
                    if (status === 'No, it has stopped') {
                      this.conversation.note(
                        'Expert Guidance',
                        `The observation (${clarification}; ${followUp}) and customer-reported status were recorded. No component diagnosis was made.`
                      );
                      this.finishCurrentSymptom(
                        'resolved',
                        'The customer reports that the symptom is no longer occurring. This does not establish a cause or confirm a repair.'
                      );
                      return;
                    }
                    if (input.insuranceWarranty) {
                      this.reviewCoverage(generation);
                      return;
                    }
                    this.endWithTechnician(
                      generation,
                      'The reported symptom remains unresolved or uncertain after the safe information review. Contact a qualified technician; this demo does not identify a failed part or provide internal repair steps.'
                    );
                  }
                );
              }
            );
          }
        );
      }
    );
  }

  private symptomLabel(code: string): string {
    return {
      D: 'Not cooling',
      E: 'Leaking water',
      F: 'Not draining',
      G: 'Vibrating excessively',
      H: 'Error code on display',
      I: 'Door not sealing',
      J: 'Burning smell',
      K: 'Tripping breaker',
      L: 'Not spinning'
    }[code] ?? 'Reported symptom';
  }

  private screenNoiseSafety(input: CustomerInput, generation: number): void {
    this.processNode('E', 'Noise-related safety screen completed', generation, () => {
      this.askFromNode(
        'E',
        'Is the noise accompanied by smoke, a burning smell, visible damage, water escaping, or a breaker that trips?',
        ['No', 'Yes', 'Not sure'],
        generation,
        (response) => {
          if (response !== 'No') {
            this.endWithTechnician(
              generation,
              'Stop the dishwasher and do not open or inspect its internal components. Contact a qualified technician to assess the reported concern.',
              false
            );
            return;
          }
          this.inspectNoiseExternally(input, generation);
        }
      );
    });
  }

  private inspectNoiseExternally(input: CustomerInput, generation: number): void {
    this.askFromNode(
      'D',
      'Without removing panels or reaching into the machine, can you see an item in the load protruding or visibly contacting the door?',
      ['Yes', 'No', 'Not sure'],
      generation,
      (response) => {
        if (response !== 'Yes') {
          this.reviewNoiseDepartments(input, generation);
          return;
        }
        this.askFromNode(
          'D',
          'Would you be comfortable stopping the cycle and correcting only the visible loading issue using the dishwasher’s normal user access?',
          ['Yes', 'No, or not sure'],
          generation,
          (willing) => {
            if (willing !== 'Yes') {
              this.reviewNoiseDepartments(input, generation);
              return;
            }
            this.askFromNode(
              'D',
              'After correcting the visible loading issue and trying the dishwasher again, what happened to the noise?',
              ['It stopped', 'It is still present', 'I have not checked'],
              generation,
              (result) => {
                if (result === 'It stopped') {
                  this.conversation.note(
                    'Expert Guidance',
                    'The customer-reported noise change was recorded. If it returns or another concern appears, stop and request a new review.'
                  );
                  this.finishCurrentSymptom(
                    'resolved',
                    'The customer reports the noise stopped after correcting a visible loading issue. This does not establish an internal fault or prove the cause.'
                  );
                  return;
                }
                this.reviewNoiseDepartments(input, generation);
              }
            );
          }
        );
      }
    );
  }

  private reviewNoiseDepartments(input: CustomerInput, generation: number): void {
    this.processNode(
      'B',
      'Possible causes remain unconfirmed; symptom details alone are insufficient to identify a fault.',
      generation,
      () => {
        this.processNode(
          'C',
          'No model-verified manufacturer guidance is available in this demo.',
          generation,
          () => {
            this.processNode(
              'D',
              'No internal or energized testing is offered; only customer-observable details were reviewed.',
              generation,
              () => {
                if (input.insuranceWarranty) {
                  this.reviewCoverage(generation);
                  return;
                }
                this.endWithTechnician(
                  generation,
                  'The noise remains unexplained after safe external checks. Contact a qualified technician; this demo does not identify a failed part or provide internal repair steps.'
                );
              }
            );
          }
        );
      }
    );
  }

  private collectIdentificationDetails(
    input: CustomerInput,
    generation: number,
    complete: () => void
  ): void {
    if (!input.appliance) {
      this.askFromNode(
        'A',
        'What appliance are you reporting? This interactive demo currently supports dishwasher workflows.',
        undefined,
        generation,
        (response) => {
          if (!/dishwasher/i.test(response)) {
            this.conversation.note(
              'Expert Guidance',
              'This demo cannot yet route another appliance type. No diagnosis or repair path was selected.'
            );
            this.dispatch({ type: 'SESSION_ENDED' });
            return;
          }
          this.collectModelAndAge(input, generation, complete);
        }
      );
      return;
    }

    this.collectModelAndAge(input, generation, complete);
  }

  private collectModelAndAge(
    input: CustomerInput,
    generation: number,
    complete: () => void
  ): void {
    if (input.model) {
      this.collectAge(input, generation, complete);
      return;
    }

    this.askFromNode(
      'A',
      'Please type the brand and model from the appliance identification label. If you cannot find it, enter “not sure”.',
      undefined,
      generation,
      (response) => {
        const modelIsKnown = !/^(not sure|unknown|cannot find|can.t find)$/i.test(response.trim());
        this.processNode(
          'A',
          modelIsKnown ? 'Customer supplied identification details' : 'Model remains unconfirmed',
          generation,
          () => this.collectAge(input, generation, complete)
        );
      }
    );
  }

  private collectAge(input: CustomerInput, generation: number, complete: () => void): void {
    if (input.age) {
      this.processNode('A', 'Available appliance details reviewed', generation, complete);
      return;
    }

    this.askFromNode(
      'A',
      'About how old is the appliance? An estimate is fine; enter “not sure” if unknown.',
      undefined,
      generation,
      (response) => {
        this.processNode(
          'A',
          response.toLowerCase() === 'not sure' ? 'Age remains unknown' : 'Approximate age recorded',
          generation,
          complete
        );
      }
    );
  }

  private checkBreakerObservation(
    generation: number,
    complete: (response: string) => void
  ): void {
    this.askFromNode(
      'D',
      'What do you know about the dishwasher’s circuit breaker?',
      ['It is on and stays on', 'It tripped once but now stays on', 'It trips again or will not stay on', 'I do not know'],
      generation,
      complete
    );
  }

  private screenSafetyAndBreaker(input: CustomerInput, generation: number): void {
    this.processNode('E', 'Initial safety screen completed', generation, () => {
      this.askFromNode(
        'E',
        'Have you noticed a burning smell, smoke, visible scorching, or a breaker that trips repeatedly?',
        ['No', 'Yes', 'Not sure'],
        generation,
        (safetyResponse) => {
          if (safetyResponse !== 'No') {
            this.endWithTechnician(
              generation,
              'Stop using the dishwasher and do not open it. A qualified technician should assess the reported safety concern.',
              false
            );
            return;
          }
          this.checkBreakerObservation(generation, (breakerResponse) => {
            if (breakerResponse === 'It trips again or will not stay on') {
              this.endWithTechnician(
                generation,
                'Do not keep resetting a breaker that trips or will not stay on. Contact a qualified technician.',
                false
              );
              return;
            }
            if (breakerResponse === 'It tripped once but now stays on') {
              this.confirmResolution(generation, () => this.reviewDepartments(input, generation));
              return;
            }
            this.reviewDepartments(input, generation);
          });
        }
      );
    });
  }

  private confirmResolution(generation: number, ifNotResolved: () => void): void {
    this.askFromNode(
      'K',
      'Has the original no-response problem gone away and is the dishwasher responding normally now?',
      ['Yes, it is responding normally', 'No, it is still not responding'],
      generation,
      (response) => {
        if (response === 'Yes, it is responding normally') {
          this.conversation.note('Expert Guidance', 'The customer reports that normal response has returned. No component fault was identified.');
          this.finishCurrentSymptom(
            'resolved',
            'The customer reports that normal response has returned. This demo does not identify a component fault.'
          );
          return;
        }
        ifNotResolved();
      }
    );
  }

  private reviewDepartments(input: CustomerInput, generation: number): void {
    const departments = [
      ['B', 'Possible causes reviewed; no cause is confirmed by this simulation.'],
      ['C', 'Manufacturer-specific guidance is unavailable unless model documentation is supplied.'],
      ['D', 'Only customer-observable, non-invasive checks are considered.']
    ] as const;
    const runNext = (index: number): void => {
      if (index >= departments.length) {
        if (input.insuranceWarranty) {
          this.reviewCoverage(generation);
          return;
        }
        this.endWithTechnician(
          generation,
          'No safe, externally verifiable resolution was confirmed. Contact a qualified technician; this demo does not provide internal electrical repair instructions.'
        );
        return;
      }
      const [nodeId, summary] = departments[index];
      this.processNode(nodeId, summary, generation, () => runNext(index + 1));
    };
    runNext(0);
  }

  private reviewCoverage(generation: number): void {
    this.processNode('F', 'Warranty review requested', generation, () => {
      this.processNode('G', 'Insurance review requested', generation, () => {
        this.askFromNode(
          'F',
          'What is the coverage status?',
          ['Active', 'Expired or not covered', 'Not sure'],
          generation,
          (coverage) => {
            if (coverage === 'Expired or not covered') {
              this.askFromNode(
                'J',
                'Since coverage is unavailable, would you like to explore a DIY path limited to safe, external checks?',
                ['Yes, explore safe external checks', 'No, contact a technician'],
                generation,
                (preference) => {
                  if (preference.startsWith('Yes')) {
                    this.processNode('H', 'Customer is interested in a limited non-invasive path', generation, () => {
                      this.endWithTechnician(
                        generation,
                        'DIY interest was recorded, but no model-verified safe procedure is available in this demo. Contact a qualified technician before opening the appliance.'
                      );
                    });
                    return;
                  }
                  this.endWithTechnician(generation, 'Contact a qualified technician for the next step.');
                }
              );
              return;
            }
            this.endWithTechnician(
              generation,
              coverage === 'Active'
                ? 'Coverage was reported as active. Contact the coverage provider before authorizing repair; a qualified technician may be needed.'
                : 'Coverage could not be verified. Contact the provider or a qualified technician before authorizing repair.'
            );
          }
        );
      });
    });
  }

  private askFromNode(
    nodeId: InteractiveNodeId,
    question: string,
    choices: readonly string[] | undefined,
    generation: number,
    onReply: (reply: string) => void
  ): void {
    this.dispatch({ type: 'NODE_ACTIVATED', nodeId });
    this.schedule(generation, 300, () => {
      this.dispatch({ type: 'FINDINGS_SENT_TO_ENGINE', nodeIds: [nodeId] });
      this.dispatch({ type: 'ENGINE_SYNTHESIS_STARTED' });
      this.schedule(generation, 250, () => {
        this.dispatch({ type: 'ENGINE_SYNTHESIS_COMPLETED' });
        const messageId = `a-${this.caseNumber}-${nodeId}-${Date.now()}`;
        this.dispatch({ type: 'GUIDANCE_MESSAGE', messageId, text: question });
        this.conversation.ask(question, choices, (reply) => {
          this.dispatch({ type: 'CUSTOMER_RESPONSE', messageId, text: reply });
          this.stage.routeCustomerReply(nodeId, () => {
            if (generation !== this.workflowGeneration) {
              return;
            }
            this.dispatch({ type: 'REEVALUATION_STARTED', nodeIds: [nodeId] });
            this.schedule(generation, 300, () => {
              this.dispatch({
                type: 'NODE_COMPLETED',
                nodeId,
                summary: 'Customer response reviewed'
              });
              onReply(reply);
            });
          });
        });
      });
    });
  }

  private processNode(
    nodeId: InteractiveNodeId,
    summary: string,
    generation: number,
    complete: () => void
  ): void {
    this.dispatch({ type: 'NODE_ACTIVATED', nodeId });
    this.schedule(generation, 360, () => {
      this.dispatch({ type: 'NODE_COMPLETED', nodeId, summary });
      this.dispatch({ type: 'FINDINGS_SENT_TO_ENGINE', nodeIds: [nodeId] });
      this.dispatch({ type: 'ENGINE_SYNTHESIS_STARTED' });
      this.schedule(generation, 260, () => {
        this.dispatch({ type: 'ENGINE_SYNTHESIS_COMPLETED' });
        complete();
      });
    });
  }

  private endWithTechnician(
    generation: number,
    message: string,
    reviewRepairOptions = true,
    stopSequence = !reviewRepairOptions
  ): void {
    const finish = (): void => {
      this.conversation.note('Expert Guidance', message);
      this.finishCurrentSymptom('technician', message, stopSequence);
    };
    if (reviewRepairOptions) {
      this.processNode('J', 'Repair options reviewed; no repair is authorized by this demo.', generation, finish);
    } else {
      finish();
    }
  }

  private schedule(generation: number, delay: number, action: () => void): void {
    this.timerId = window.setTimeout(() => {
      this.timerId = undefined;
      if (generation === this.workflowGeneration) {
        action();
      }
    }, delay);
  }

  private dispatch(event: DiagnosticAnimationEvent): void {
    this.adapter.dispatch(event);
  }

  public destroy(): void {
    this.workflowGeneration += 1;
    if (this.timerId !== undefined) {
      window.clearTimeout(this.timerId);
    }
    this.stage.destroy();
  }
}

const root = document.getElementById('app');
if (!root) {
  throw new Error('Application root #app was not found');
}

const app = new DiagnosticAnimationApp(root);
window.addEventListener('beforeunload', () => app.destroy());
