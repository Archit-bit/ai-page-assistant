# AI Page Assistant

A Firefox browser extension that acts as a page-aware AI assistant for the current webpage. It can ask and answer page-grounded questions, summarize long pages, explain selected text, extract dates or action items, keep page-specific chat history, and save notes using the Google Gemini API.

## Architecture Overview

This project is a standalone **"Bring Your Own Key" (BYOK)** frontend extension. 

There is no backend server. All processing is done locally in your browser. The extension extracts structured webpage context (title, URL, selection, visible text, headings, and content chunks) and sends it directly to the Google Gemini API endpoint.

**Security Note regarding client-side keys:** Your Gemini API Key is saved locally in your browser using Firefox's `browser.storage.local` API. This storage is sandbox-isolated per extension, meaning standard websites or other extensions cannot read your API key. Since all communication happens between your browser and Google directly, this is perfectly safe for personal use or public distribution using the BYOK model.

## File Structure

```
ai-page-assistant/
├── extension/
│   ├── manifest.json      # Firefox extension manifest
│   ├── background.js      # Extension background script
│   ├── content.js         # Injected script to read page text
│   ├── popup.html         # Extension popup UI
│   ├── popup.css          # Extension popup styling
│   └── popup.js           # Extension popup logic
└── README.md              # Project documentation
```

## Setup Instructions

### 1. Get a Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Create a new API key.

### 2. Loading the Extension in Firefox (Temporary)

To load the extension into Firefox for development:

1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`.
2. Click the **"Load Temporary Add-on..."** button.
3. Select any file (like `manifest.json`) inside the `ai-page-assistant/extension` folder.
4. The extension "AI Page Assistant" will appear in your list of Temporary Extensions and its icon will appear in your toolbar (usually the puzzle piece menu).

### 3. Add your API Key to the Extension

1. Click on the extension icon in your browser toolbar to open the popup.
2. The Settings panel will open automatically asking for an API key (you can also click the gear ⚙️ icon to open it).
3. Paste your Gemini API key and click **Save**.

## How to Use & Example Requests

1. **Ask about the current page:**
   - Go to a webpage such as documentation, a news article, or a long blog post.
   - Click the AI Page Assistant icon in the toolbar.
   - Choose the workflow `Ask Page`, type a question, and click **Ask Page**.

2. **Use preset workflows:**
   - Use quick actions such as `TL;DR`, `Key Takeaways`, `Action Items`, `Dates & Deadlines`, `Compare Options`, or `Turn Into Notes`.
   - Change the scope to `Relevant chunks`, `Visible area`, `Whole page`, or `Selection only` depending on what you want the model to use.

3. **Explain selected text:**
   - Highlight a sentence or paragraph on the webpage.
   - Open the extension popup and run **Explain Selection**.
   - The assistant will use the selected text plus nearby page context.

4. **Keep page-aware history and notes:**
   - Follow-up questions are stored per page using local extension storage.
   - Click **Save Note** to keep the latest answer for the current page.
   - Click **Export Markdown** to export the page conversation and notes.

5. **Use context menu and keyboard shortcuts:**
   - Right-click on the page or on selected text to trigger quick actions.
   - Keyboard shortcuts are available for summary, explain selection, and action-item extraction.

## Basic Troubleshooting

- **"API Error: API Key is missing"**: You need to click the gear icon in the top right of the popup and save your Google Gemini API key.
- **"Could not extract page text..."**: The extension might not have permission to read the current page. Try reloading the webpage, clicking the popup's **Refresh** button, or testing on a standard website (extensions cannot run on `about:` or `addons.mozilla.org` pages).
- **Selected text not detected**: Make sure you highlight the text *before* opening the popup or using the selection workflow.
- **Queued shortcut or context-menu action did not run**: Click the extension icon on the same tab. The action is stored locally and will run from the popup when the tab matches.

## Notes on Production Readiness

For publishing to the Firefox Add-ons store, this BYOK (Bring Your Own Key) architecture is fine for an indie extension. If you later decide to monetize the product or share usage limits across users, you would need a backend, authentication, rate limiting, and server-side key management.
