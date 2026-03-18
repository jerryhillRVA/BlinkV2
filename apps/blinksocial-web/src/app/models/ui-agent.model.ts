export class UIAgent {
  readonly id: number;
  readonly name: string;
  readonly role: string;
  readonly responsibilities: string;
  readonly outputs: string;

  constructor(data: {
    id: number;
    name: string;
    role: string;
    responsibilities: string;
    outputs: string;
  }) {
    this.id = data.id;
    this.name = data.name;
    this.role = data.role;
    this.responsibilities = data.responsibilities;
    this.outputs = data.outputs;
  }
}
