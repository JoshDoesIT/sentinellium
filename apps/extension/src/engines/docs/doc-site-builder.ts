/**
 * @module Doc Site Builder
 * @description Documentation site builder (Starlight-style).
 * Manages pages, categories, navigation, search, and site manifests.
 */

/* ── Types ── */

export interface DocPage {
  slug: string;
  title: string;
  content: string;
  category: string;
}

export interface DocCategory {
  id: string;
  label: string;
  order: number;
}

export interface NavSection {
  category: DocCategory;
  pages: DocPage[];
}

export interface SiteManifest {
  title: string;
  baseUrl: string;
  pages: DocPage[];
  categories: DocCategory[];
}

export interface SiteConfig {
  title: string;
  baseUrl: string;
}

/* ── Builder ── */

/**
 * Documentation site builder.
 */
export class DocSiteBuilder {
  private readonly config: SiteConfig;
  private readonly pages: DocPage[] = [];
  private readonly categories: DocCategory[] = [];

  constructor(config: SiteConfig) {
    this.config = config;
  }

  /** Add a page. */
  addPage(page: DocPage): void {
    this.pages.push(page);
  }

  /** Get all pages. */
  getPages(): DocPage[] {
    return [...this.pages];
  }

  /** Add a category. */
  addCategory(category: DocCategory): void {
    this.categories.push(category);
  }

  /** Get all categories. */
  getCategories(): DocCategory[] {
    return [...this.categories].sort((a, b) => a.order - b.order);
  }

  /** Build navigation tree. */
  getNavigation(): NavSection[] {
    return this.getCategories().map((cat) => ({
      category: cat,
      pages: this.pages.filter((p) => p.category === cat.id),
    }));
  }

  /** Search pages by content. */
  search(query: string): DocPage[] {
    const lq = query.toLowerCase();
    return this.pages.filter(
      (p) =>
        p.title.toLowerCase().includes(lq) ||
        p.content.toLowerCase().includes(lq),
    );
  }

  /** Build the site manifest. */
  build(): SiteManifest {
    return {
      title: this.config.title,
      baseUrl: this.config.baseUrl,
      pages: this.getPages(),
      categories: this.getCategories(),
    };
  }
}
