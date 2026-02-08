/**
 * @module DOM Extractor Tests
 * @description TDD tests for DOM content extraction. Extracts text,
 * forms, links, images, and brand signals from page DOM for phishing
 * analysis by the inference pipeline.
 */
import { describe, it, expect } from "vitest";
import {
    extractPageContent,
    extractTextContent,
    extractForms,
    extractLinks,
    extractBrandSignals,
} from "./dom-extractor";

/**
 * Create a minimal mock document for testing.
 * Vitest runs in Node, not a browser, so we use JSDOM-like patterns.
 */
function createMockElement(
    tag: string,
    attrs: Record<string, string> = {},
    text = "",
    children: Element[] = [],
): Element {
    return {
        tagName: tag.toUpperCase(),
        textContent: text,
        innerText: text,
        getAttribute: (name: string) => attrs[name] ?? null,
        hasAttribute: (name: string) => name in attrs,
        querySelectorAll: (selector: string) => {
            // Simple selector matching for tests
            return children.filter((child) => {
                if (selector.startsWith(".")) {
                    return (child.getAttribute("class") ?? "").includes(
                        selector.slice(1),
                    );
                }
                return child.tagName === selector.toUpperCase();
            });
        },
        querySelector: (selector: string) => {
            const results = children.filter((child) => {
                if (selector.startsWith(".")) {
                    return (child.getAttribute("class") ?? "").includes(
                        selector.slice(1),
                    );
                }
                return child.tagName === selector.toUpperCase();
            });
            return results[0] ?? null;
        },
        children,
        getElementsByTagName: (tag: string) =>
            children.filter((c) => c.tagName === tag.toUpperCase()),
    } as unknown as Element;
}

describe("DOM Extractor", () => {
    /* ── extractTextContent ── */

    describe("extractTextContent", () => {
        it("extracts visible text from a page body", () => {
            const body = createMockElement(
                "body",
                {},
                "Welcome to your account. Please verify your identity.",
            );
            const result = extractTextContent(body);
            expect(result).toContain("Welcome to your account");
            expect(result.length).toBeGreaterThan(0);
        });

        it("truncates extremely long text to a maximum length", () => {
            const longText = "A".repeat(20000);
            const body = createMockElement("body", {}, longText);
            const result = extractTextContent(body);
            expect(result.length).toBeLessThanOrEqual(10000);
        });

        it("returns empty string for empty body", () => {
            const body = createMockElement("body", {}, "");
            const result = extractTextContent(body);
            expect(result).toBe("");
        });
    });

    /* ── extractForms ── */

    describe("extractForms", () => {
        it("extracts form action and method", () => {
            const input = createMockElement("input", {
                type: "password",
                name: "password",
            });
            const form = createMockElement(
                "form",
                { action: "https://evil.com/steal", method: "POST" },
                "",
                [input],
            );
            const container = createMockElement("div", {}, "", [form]);
            const result = extractForms(container);
            expect(result).toHaveLength(1);
            expect(result[0]?.action).toBe("https://evil.com/steal");
            expect(result[0]?.method).toBe("POST");
        });

        it("detects password fields in forms", () => {
            const input = createMockElement("input", {
                type: "password",
                name: "pass",
            });
            const form = createMockElement("form", { action: "/login" }, "", [input]);
            const container = createMockElement("div", {}, "", [form]);
            const result = extractForms(container);
            expect(result[0]?.hasPasswordField).toBe(true);
        });

        it("detects credit card fields", () => {
            const input = createMockElement("input", {
                type: "text",
                name: "card-number",
                autocomplete: "cc-number",
            });
            const form = createMockElement("form", { action: "/checkout" }, "", [
                input,
            ]);
            const container = createMockElement("div", {}, "", [form]);
            const result = extractForms(container);
            expect(result[0]?.hasCreditCardField).toBe(true);
        });

        it("returns empty array when no forms exist", () => {
            const container = createMockElement("div");
            const result = extractForms(container);
            expect(result).toEqual([]);
        });
    });

    /* ── extractLinks ── */

    describe("extractLinks", () => {
        it("extracts href and text from anchor elements", () => {
            const link = createMockElement(
                "a",
                { href: "https://example.com" },
                "Click here",
            );
            const container = createMockElement("div", {}, "", [link]);
            const result = extractLinks(container);
            expect(result).toHaveLength(1);
            expect(result[0]?.href).toBe("https://example.com");
            expect(result[0]?.text).toBe("Click here");
        });

        it("flags links where displayed text doesn't match href domain", () => {
            const link = createMockElement(
                "a",
                { href: "https://evil.com/phish" },
                "https://google.com",
            );
            const container = createMockElement("div", {}, "", [link]);
            const result = extractLinks(container);
            expect(result[0]?.mismatch).toBe(true);
        });

        it("returns empty array when no links exist", () => {
            const container = createMockElement("div");
            const result = extractLinks(container);
            expect(result).toEqual([]);
        });
    });

    /* ── extractBrandSignals ── */

    describe("extractBrandSignals", () => {
        it("detects brand names in page title", () => {
            const result = extractBrandSignals(
                "Sign in to your Microsoft Account",
                "https://login-microsoft.evil.com",
            );
            expect(result.detectedBrands).toContain("microsoft");
        });

        it("returns empty brands for generic pages", () => {
            const result = extractBrandSignals(
                "Welcome to my blog",
                "https://myblog.com",
            );
            expect(result.detectedBrands).toHaveLength(0);
        });

        it("detects multiple brands", () => {
            const result = extractBrandSignals(
                "Login to your Google or Microsoft account",
                "https://example.com",
            );
            expect(result.detectedBrands.length).toBeGreaterThanOrEqual(2);
        });

        it("flags brand-in-title-but-not-domain mismatch", () => {
            const result = extractBrandSignals(
                "PayPal Login - Secure Your Account",
                "https://paypai-secure.com/login",
            );
            expect(result.brandDomainMismatch).toBe(true);
        });

        it("does not flag brand mismatch on legitimate sites", () => {
            const result = extractBrandSignals(
                "Google Account",
                "https://accounts.google.com",
            );
            expect(result.brandDomainMismatch).toBe(false);
        });
    });

    /* ── extractPageContent (integration) ── */

    describe("extractPageContent", () => {
        it("returns a complete PageContent object", () => {
            const body = createMockElement("body", {}, "Test page content");
            const result = extractPageContent(
                body,
                "Test Page Title",
                "https://example.com",
            );
            expect(result).toHaveProperty("text");
            expect(result).toHaveProperty("forms");
            expect(result).toHaveProperty("links");
            expect(result).toHaveProperty("brandSignals");
            expect(result).toHaveProperty("url");
            expect(result).toHaveProperty("title");
        });

        it("preserves the source URL and title", () => {
            const body = createMockElement("body");
            const result = extractPageContent(
                body,
                "My Title",
                "https://example.com/page",
            );
            expect(result.url).toBe("https://example.com/page");
            expect(result.title).toBe("My Title");
        });
    });
});
