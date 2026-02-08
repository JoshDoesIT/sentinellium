/**
 * @module Component Storybook
 * @description Interactive component storybook.
 * Registers components with variants for documentation and testing.
 */

/* ── Types ── */

export interface ComponentVariant {
  name: string;
  props: Record<string, unknown>;
}

export interface ComponentEntry {
  id: string;
  name: string;
  description: string;
  variants: ComponentVariant[];
}

export interface Catalog {
  totalComponents: number;
  components: ComponentEntry[];
}

/* ── Storybook ── */

/**
 * Component storybook for interactive documentation.
 */
export class ComponentStorybook {
  private readonly components = new Map<string, ComponentEntry>();

  /** Register a component. */
  registerComponent(entry: ComponentEntry): void {
    this.components.set(entry.id, entry);
  }

  /** Get all components. */
  getComponents(): ComponentEntry[] {
    return [...this.components.values()];
  }

  /** Get a component by ID. */
  getComponent(id: string): ComponentEntry | undefined {
    const entry = this.components.get(id);
    return entry ? { ...entry } : undefined;
  }

  /** Get variants for a component. */
  getVariants(id: string): ComponentVariant[] {
    return this.components.get(id)?.variants ?? [];
  }

  /** Search components by name. */
  search(query: string): ComponentEntry[] {
    const lq = query.toLowerCase();
    return this.getComponents().filter(
      (c) =>
        c.name.toLowerCase().includes(lq) ||
        c.description.toLowerCase().includes(lq),
    );
  }

  /** Generate a catalog. */
  getCatalog(): Catalog {
    return {
      totalComponents: this.components.size,
      components: this.getComponents(),
    };
  }
}
