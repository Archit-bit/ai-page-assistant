const MENU_ITEMS = [
  {
    id: "page-assistant-summarize",
    title: "AI Page Assistant: TL;DR",
    contexts: ["page"]
  },
  {
    id: "page-assistant-key-takeaways",
    title: "AI Page Assistant: Key Takeaways",
    contexts: ["page"]
  },
  {
    id: "page-assistant-action-items",
    title: "AI Page Assistant: Extract Action Items",
    contexts: ["page"]
  },
  {
    id: "page-assistant-dates",
    title: "AI Page Assistant: Extract Dates & Deadlines",
    contexts: ["page"]
  },
  {
    id: "page-assistant-explain-selection",
    title: "AI Page Assistant: Explain Selection",
    contexts: ["selection"]
  }
];

const COMMAND_MAP = {
  "summarize-page": { workflow: "tldr", scope: "whole" },
  "explain-selection": { workflow: "explain_selection", scope: "selection" },
  "extract-action-items": { workflow: "action_items", scope: "relevant" }
};

async function createMenus() {
  if (!browser.contextMenus) {
    return;
  }

  try {
    await browser.contextMenus.removeAll();
    for (const item of MENU_ITEMS) {
      await browser.contextMenus.create(item);
    }
  } catch (error) {
    console.error("Failed to create context menus", error);
  }
}

async function queueWorkflow(tab, workflow, scope, question = "") {
  if (!tab || typeof tab.id !== "number") {
    return;
  }

  const pendingAction = {
    workflow,
    scope,
    question,
    tabId: tab.id,
    url: tab.url || "",
    createdAt: new Date().toISOString()
  };

  await browser.storage.local.set({ pendingAction });
}

async function openAssistantPopup() {
  if (!browser.action || typeof browser.action.openPopup !== "function") {
    return;
  }

  try {
    await browser.action.openPopup();
  } catch (error) {
    console.warn("Could not open the popup automatically", error);
  }
}

async function launchWorkflow(tab, workflow, scope, question = "") {
  await queueWorkflow(tab, workflow, scope, question);
  await openAssistantPopup();
}

browser.runtime.onInstalled.addListener(() => {
  createMenus();
});

browser.runtime.onStartup.addListener(() => {
  createMenus();
});

browser.contextMenus.onClicked.addListener(async (info, tab) => {
  switch (info.menuItemId) {
    case "page-assistant-summarize":
      await launchWorkflow(tab, "tldr", "whole");
      break;
    case "page-assistant-key-takeaways":
      await launchWorkflow(tab, "key_takeaways", "whole");
      break;
    case "page-assistant-action-items":
      await launchWorkflow(tab, "action_items", "relevant");
      break;
    case "page-assistant-dates":
      await launchWorkflow(tab, "dates_deadlines", "relevant");
      break;
    case "page-assistant-explain-selection":
      await launchWorkflow(tab, "explain_selection", "selection");
      break;
    default:
      break;
  }
});

browser.commands.onCommand.addListener(async (command) => {
  const workflow = COMMAND_MAP[command];
  if (!workflow) {
    return;
  }

  try {
    const [activeTab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (!activeTab) {
      return;
    }

    await launchWorkflow(activeTab, workflow.workflow, workflow.scope);
  } catch (error) {
    console.error("Failed to queue shortcut workflow", error);
  }
});

console.log("AI Page Assistant background script loaded.");
