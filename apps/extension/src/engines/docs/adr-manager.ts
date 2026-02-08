/**
 * @module ADR Manager
 * @description Architecture Decision Record management.
 * Sequential numbering, status tracking, and superseding.
 */

/* ── Types ── */

export enum AdrStatus {
  PROPOSED = "proposed",
  ACCEPTED = "accepted",
  DEPRECATED = "deprecated",
  SUPERSEDED = "superseded",
}

export interface Adr {
  number: number;
  title: string;
  context: string;
  decision: string;
  consequences: string;
  status: AdrStatus;
  createdAt: number;
  supersededBy?: number;
}

/* ── Manager ── */

let adrSeq = 0;

/**
 * ADR manager with sequential numbering.
 */
export class AdrManager {
  private readonly adrs = new Map<number, Adr>();

  /** Create a new ADR. */
  create(input: {
    title: string;
    context: string;
    decision: string;
    consequences: string;
  }): Adr {
    adrSeq++;
    const adr: Adr = {
      number: adrSeq,
      ...input,
      status: AdrStatus.PROPOSED,
      createdAt: Date.now(),
    };
    this.adrs.set(adr.number, adr);
    return { ...adr };
  }

  /** Get an ADR by number. */
  get(number: number): Adr | undefined {
    const adr = this.adrs.get(number);
    return adr ? { ...adr } : undefined;
  }

  /** List all ADRs. */
  list(): Adr[] {
    return [...this.adrs.values()].map((a) => ({ ...a }));
  }

  /** Update ADR status. */
  updateStatus(number: number, status: AdrStatus): void {
    const adr = this.adrs.get(number);
    if (!adr) throw new Error(`ADR #${number} not found`);
    adr.status = status;
  }

  /** Mark an ADR as superseded by another. */
  supersede(oldNumber: number, newNumber: number): void {
    const old = this.adrs.get(oldNumber);
    if (!old) throw new Error(`ADR #${oldNumber} not found`);
    old.status = AdrStatus.SUPERSEDED;
    old.supersededBy = newNumber;
  }
}
