/**
 * @module Guide Generator
 * @description User and admin guide generation.
 * Manages sections per guide type and produces ordered guides with TOC.
 */

/* ── Types ── */

export enum GuideType {
  USER = "user",
  ADMIN = "admin",
  CONTRIBUTOR = "contributor",
}

export interface GuideSection {
  guideType: GuideType;
  id: string;
  title: string;
  content: string;
  order: number;
}

export interface Guide {
  type: GuideType;
  sections: GuideSection[];
}

export interface TocEntry {
  id: string;
  title: string;
  order: number;
}

/* ── Generator ── */

/**
 * Guide content generator.
 */
export class GuideGenerator {
  private readonly sections: GuideSection[] = [];

  /** Add a section. */
  addSection(section: GuideSection): void {
    this.sections.push(section);
  }

  /** Get sections for a guide type. */
  getSections(type: GuideType): GuideSection[] {
    return this.sections
      .filter((s) => s.guideType === type)
      .sort((a, b) => a.order - b.order);
  }

  /** Generate a guide. */
  generate(type: GuideType): Guide {
    return { type, sections: this.getSections(type) };
  }

  /** Get table of contents. */
  getTableOfContents(type: GuideType): TocEntry[] {
    return this.getSections(type).map((s) => ({
      id: s.id,
      title: s.title,
      order: s.order,
    }));
  }
}
