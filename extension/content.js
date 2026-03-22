const SECTION_SELECTOR = "h1,h2,h3,h4,h5,h6,p,li,blockquote,pre,code,table,figcaption,summary";
const MAX_SECTIONS = 180;

function normalizeWhitespace(text) {
  return (text || "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function clampText(text, maxLength) {
  if (!text || text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1).trim()}...`;
}

function isTextContainerUsable(element) {
  if (!element || !element.isConnected) {
    return false;
  }

  if (element.closest("script, style, noscript, nav, footer, aside, form, [aria-hidden='true']")) {
    return false;
  }

  const style = window.getComputedStyle(element);
  if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
    return false;
  }

  return true;
}

function isElementInViewport(element) {
  const rect = element.getBoundingClientRect();
  return rect.width > 0 &&
    rect.height > 0 &&
    rect.bottom >= 0 &&
    rect.top <= window.innerHeight &&
    rect.right >= 0 &&
    rect.left <= window.innerWidth;
}

function getHeadingLevel(tagName) {
  const match = /^H([1-6])$/.exec(tagName);
  return match ? Number(match[1]) : null;
}

function extractTableText(table) {
  const rows = Array.from(table.rows || []);

  return rows
    .map((row) => (
      Array.from(row.cells || [])
        .map((cell) => normalizeWhitespace(cell.innerText || cell.textContent || ""))
        .filter(Boolean)
        .join(" | ")
    ))
    .filter(Boolean)
    .join("\n");
}

function getElementText(element) {
  switch (element.tagName) {
    case "TABLE":
      return normalizeWhitespace(extractTableText(element));
    case "LI":
      return normalizeWhitespace(`- ${element.innerText || element.textContent || ""}`);
    default:
      return normalizeWhitespace(element.innerText || element.textContent || "");
  }
}

function getHeadingPathFromSection(element) {
  if (!element) {
    return [];
  }

  const container = element.closest("section, article, main, [role='main'], div");
  const localHeading = container ? container.querySelector("h1, h2, h3, h4") : document.querySelector("h1, h2");
  const headingText = normalizeWhitespace(localHeading ? localHeading.innerText || localHeading.textContent || "" : "");

  return headingText ? [headingText] : [];
}

function extractSelectionContext() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return {
      selection: "",
      selectionContext: "",
      selectionHeadingPath: []
    };
  }

  const selectionText = normalizeWhitespace(selection.toString());
  if (!selectionText) {
    return {
      selection: "",
      selectionContext: "",
      selectionHeadingPath: []
    };
  }

  const anchorNode = selection.anchorNode;
  const anchorElement = anchorNode
    ? (anchorNode.nodeType === Node.TEXT_NODE ? anchorNode.parentElement : anchorNode)
    : null;
  const contextContainer = anchorElement
    ? anchorElement.closest("p, li, blockquote, pre, code, td, th, article, section, main, div")
    : null;
  const contextText = normalizeWhitespace(
    contextContainer ? contextContainer.innerText || contextContainer.textContent || "" : ""
  );

  return {
    selection: clampText(selectionText, 900),
    selectionContext: contextText && contextText !== selectionText ? clampText(contextText, 1500) : "",
    selectionHeadingPath: getHeadingPathFromSection(anchorElement)
  };
}

function extractMetadata() {
  const readMeta = (selectors) => {
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      const value = normalizeWhitespace(element ? element.content || element.getAttribute("content") || "" : "");
      if (value) {
        return clampText(value, 400);
      }
    }

    return "";
  };

  return {
    description: readMeta([
      'meta[name="description"]',
      'meta[property="og:description"]',
      'meta[name="twitter:description"]'
    ]),
    author: readMeta([
      'meta[name="author"]',
      'meta[property="article:author"]'
    ]),
    keywords: readMeta([
      'meta[name="keywords"]'
    ])
  };
}

function collectSections() {
  const root = document.querySelector("article, main, [role='main']") || document.body;
  const elements = Array.from(root.querySelectorAll(SECTION_SELECTOR));
  const sections = [];
  const outline = [];
  const seenKeys = new Set();
  const headingPath = [];

  for (const element of elements) {
    if (!isTextContainerUsable(element)) {
      continue;
    }

    const tagName = element.tagName.toUpperCase();
    const headingLevel = getHeadingLevel(tagName);
    const rawText = getElementText(element);
    const minimumLength = tagName === "LI" ? 8 : headingLevel ? 3 : 25;

    if (rawText.length < minimumLength) {
      continue;
    }

    const text = clampText(rawText, tagName === "CODE" || tagName === "PRE" ? 900 : 1400);
    const dedupeKey = `${tagName}:${text.slice(0, 160).toLowerCase()}`;
    if (seenKeys.has(dedupeKey)) {
      continue;
    }

    seenKeys.add(dedupeKey);

    if (headingLevel) {
      headingPath.splice(headingLevel - 1);
      headingPath[headingLevel - 1] = text;
      const currentPath = headingPath.filter(Boolean);

      sections.push({
        id: `S${sections.length + 1}`,
        type: "heading",
        text,
        headingPath: currentPath,
        inViewport: isElementInViewport(element)
      });
      outline.push(text);
    } else {
      sections.push({
        id: `S${sections.length + 1}`,
        type: element.tagName.toLowerCase(),
        text,
        headingPath: headingPath.filter(Boolean),
        inViewport: isElementInViewport(element)
      });
    }

    if (sections.length >= MAX_SECTIONS) {
      break;
    }
  }

  if (sections.length === 0 && document.body) {
    sections.push({
      id: "S1",
      type: "paragraph",
      text: clampText(normalizeWhitespace(document.body.innerText || document.body.textContent || ""), 2000),
      headingPath: [],
      inViewport: true
    });
  }

  return {
    sections,
    outline: outline.slice(0, 40)
  };
}

function buildVisibleSummary(sections) {
  return sections
    .filter((section) => section.inViewport && section.type !== "heading")
    .slice(0, 8)
    .map((section) => section.text)
    .join("\n\n")
    .slice(0, 2500);
}

function buildPageContext() {
  const { sections, outline } = collectSections();
  const selectionState = extractSelectionContext();
  const visibleText = buildVisibleSummary(sections);
  const introText = sections
    .filter((section) => section.type !== "heading")
    .slice(0, 4)
    .map((section) => section.text)
    .join("\n\n")
    .slice(0, 2200);

  return {
    title: document.title || "",
    url: window.location.href,
    selection: selectionState.selection,
    selectionContext: selectionState.selectionContext,
    selectionHeadingPath: selectionState.selectionHeadingPath,
    metadata: extractMetadata(),
    outline,
    sections,
    visibleText,
    introText,
    stats: {
      sectionCount: sections.length,
      outlineCount: outline.length,
      visibleCount: sections.filter((section) => section.inViewport).length,
      extractedAt: new Date().toISOString()
    }
  };
}

browser.runtime.onMessage.addListener((request) => {
  if (request.action === "getPageContext") {
    return Promise.resolve(buildPageContext());
  }

  return undefined;
});

console.log("AI Page Assistant content script loaded.");
