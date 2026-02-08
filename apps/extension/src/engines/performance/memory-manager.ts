/**
 * @module Memory Manager
 * @description Memory management and model unloading.
 * LRU eviction policy to stay within memory budget.
 */

/* ── Types ── */

export interface ModelEntry {
  id: string;
  sizeMb: number;
  lastUsed: number;
}

export interface MemoryReport {
  maxMb: number;
  usedMb: number;
  availableMb: number;
  utilizationPercent: number;
  loadedModels: number;
}

/* ── Manager ── */

let touchSeq = 0;

/**
 * Memory manager with LRU eviction.
 */
export class MemoryManager {
  private readonly maxMemoryMb: number;
  private readonly models = new Map<string, ModelEntry>();

  constructor(config: { maxMemoryMb: number }) {
    this.maxMemoryMb = config.maxMemoryMb;
  }

  /** Load a model into memory. */
  loadModel(input: { id: string; sizeMb: number }): void {
    // Evict LRU if needed
    while (
      this.getUsedMemoryMb() + input.sizeMb > this.maxMemoryMb &&
      this.models.size > 0
    ) {
      this.evictLRU();
    }

    touchSeq++;
    this.models.set(input.id, {
      id: input.id,
      sizeMb: input.sizeMb,
      lastUsed: touchSeq,
    });
  }

  /** Unload a model. */
  unloadModel(id: string): void {
    this.models.delete(id);
  }

  /** Touch a model to update its LRU position. */
  touchModel(id: string): void {
    const model = this.models.get(id);
    if (model) {
      touchSeq++;
      model.lastUsed = touchSeq;
    }
  }

  /** Get loaded models. */
  getLoadedModels(): ModelEntry[] {
    return [...this.models.values()];
  }

  /** Get total used memory. */
  getUsedMemoryMb(): number {
    let total = 0;
    for (const model of this.models.values()) {
      total += model.sizeMb;
    }
    return total;
  }

  /** Get memory report. */
  getMemoryReport(): MemoryReport {
    const used = this.getUsedMemoryMb();
    return {
      maxMb: this.maxMemoryMb,
      usedMb: used,
      availableMb: this.maxMemoryMb - used,
      utilizationPercent: (used / this.maxMemoryMb) * 100,
      loadedModels: this.models.size,
    };
  }

  private evictLRU(): void {
    let oldest: ModelEntry | null = null;
    for (const model of this.models.values()) {
      if (!oldest || model.lastUsed < oldest.lastUsed) {
        oldest = model;
      }
    }
    if (oldest) this.models.delete(oldest.id);
  }
}
