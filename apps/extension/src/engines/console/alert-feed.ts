/**
 * @module Alert Feed
 * @description Filtering, search, and pagination for the alert feed.
 * Supports severity tier filtering, source filtering,
 * text search across titles and domains, and pagination.
 */
import {
  type UnifiedAlert,
  AlertSeverity,
  type AlertSource,
} from "./alert-aggregator";

/* ── Types ── */

/** Filter criteria. */
export interface AlertFilter {
  source?: AlertSource;
  minSeverity?: AlertSeverity;
  search?: string;
}

/** Pagination options. */
export interface PaginationOptions {
  page: number;
  pageSize: number;
}

/** Paginated result. */
export interface PaginatedResult<T> {
  items: T[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

/* ── Constants ── */

const SEVERITY_ORDER: Record<AlertSeverity, number> = {
  [AlertSeverity.CRITICAL]: 0,
  [AlertSeverity.HIGH]: 1,
  [AlertSeverity.MEDIUM]: 2,
  [AlertSeverity.LOW]: 3,
  [AlertSeverity.INFO]: 4,
};

/* ── Feed ── */

/**
 * Provides filtering, search, and pagination for the unified alert feed.
 */
export class AlertFeed {
  /**
   * Filter alerts by criteria.
   *
   * @param alerts - The alert list to filter
   * @param filter - Filter criteria
   * @returns Filtered alerts
   */
  filter(alerts: readonly UnifiedAlert[], filter: AlertFilter): UnifiedAlert[] {
    let result = [...alerts];

    if (filter.source) {
      result = result.filter((a) => a.source === filter.source);
    }

    if (filter.minSeverity) {
      const minOrder = SEVERITY_ORDER[filter.minSeverity];
      result = result.filter((a) => SEVERITY_ORDER[a.severity] <= minOrder);
    }

    if (filter.search) {
      const query = filter.search.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(query) ||
          a.domain.toLowerCase().includes(query) ||
          a.url.toLowerCase().includes(query),
      );
    }

    return result;
  }

  /**
   * Paginate alert results.
   *
   * @param alerts - The full list
   * @param options - Page number and size
   * @returns Paginated result with metadata
   */
  paginate(
    alerts: readonly UnifiedAlert[],
    options: PaginationOptions,
  ): PaginatedResult<UnifiedAlert> {
    const totalItems = alerts.length;
    const totalPages = Math.ceil(totalItems / options.pageSize);
    const start = (options.page - 1) * options.pageSize;
    const items = alerts.slice(start, start + options.pageSize);

    return {
      items,
      currentPage: options.page,
      totalPages,
      totalItems,
    };
  }
}
