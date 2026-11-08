import type { NodeId } from '../integration/animation-events';

export const SYMPTOMS = [
  { code: 'A', label: 'Not turning on', departments: ['A', 'B', 'C', 'D', 'E', 'H', 'J', 'K'] },
  { code: 'B', label: 'Making loud noise', departments: ['A', 'B', 'C', 'D', 'E', 'H', 'I', 'J', 'K'] },
  { code: 'C', label: 'Not heating', departments: ['A', 'B', 'C', 'D', 'E', 'H', 'I', 'J', 'K'] },
  { code: 'D', label: 'Not cooling', departments: ['A', 'B', 'C', 'D', 'E', 'H', 'I', 'J', 'K'] },
  { code: 'E', label: 'Leaking water', departments: ['A', 'B', 'C', 'D', 'E', 'H', 'I', 'J', 'K'] },
  { code: 'F', label: 'Not draining', departments: ['A', 'B', 'C', 'D', 'E', 'H', 'I', 'J', 'K'] },
  { code: 'G', label: 'Vibrating excessively', departments: ['A', 'B', 'C', 'D', 'E', 'H', 'I', 'J', 'K'] },
  { code: 'H', label: 'Error code on display', departments: ['A', 'B', 'C', 'D', 'E', 'H', 'I', 'J', 'K'] },
  { code: 'I', label: 'Door not sealing', departments: ['A', 'B', 'C', 'D', 'E', 'H', 'I', 'J', 'K'] },
  { code: 'J', label: 'Burning smell', departments: ['A', 'B', 'C', 'D', 'E', 'H', 'J', 'K'] },
  { code: 'K', label: 'Tripping breaker', departments: ['A', 'B', 'C', 'D', 'E', 'H', 'J', 'K'] },
  { code: 'L', label: 'Not spinning', departments: ['A', 'B', 'C', 'D', 'E', 'H', 'I', 'J', 'K'] }
] as const satisfies readonly {
  code: string;
  label: string;
  departments: readonly NodeId[];
}[];

const DEPARTMENT_ORDER: NodeId[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'];

export interface CustomerInput {
  appliance: boolean;
  model: boolean;
  age: boolean;
  insuranceWarranty: boolean;
  symptoms: string[];
}

export function resolveSymptomWorkflow(input: CustomerInput): {
  symptoms: typeof SYMPTOMS[number][];
  departments: NodeId[];
} {
  const selectedSymptoms = SYMPTOMS.filter((symptom) => input.symptoms.includes(symptom.code));
  const selectedDepartments = new Set<NodeId>();

  for (const symptom of selectedSymptoms) {
    for (const department of symptom.departments) {
      selectedDepartments.add(department);
    }
  }

  if (input.insuranceWarranty) {
    selectedDepartments.add('F');
    selectedDepartments.add('G');
  }

  return {
    symptoms: selectedSymptoms,
    departments: DEPARTMENT_ORDER.filter((department) => selectedDepartments.has(department))
  };
}
