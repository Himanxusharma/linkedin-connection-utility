'use client';

export type LinkOpenMode = 'companion' | 'reusable-tab' | 'new-tab';

export const DEFAULT_LINK_OPEN_MODE: LinkOpenMode = 'companion';

export interface LinkOpenOptions {
  mode?: LinkOpenMode;
  targetName?: string;
  companyName?: string;
}

// Global reference to the companion window to allow focusing and smooth steering
let activeCompanionWindow: Window | null = null;

/**
 * Gets the persisted user preference for link opening mode.
 */
export function getSavedLinkOpenMode(): LinkOpenMode {
  if (typeof window === 'undefined') return DEFAULT_LINK_OPEN_MODE;
  try {
    const saved = localStorage.getItem('linkbuilder_open_mode') as LinkOpenMode;
    if (saved === 'companion' || saved === 'reusable-tab' || saved === 'new-tab') {
      return saved;
    }
  } catch {
    // ignore
  }
  return DEFAULT_LINK_OPEN_MODE;
}

/**
 * Saves the link opening mode preference.
 */
export function saveLinkOpenMode(mode: LinkOpenMode): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('linkbuilder_open_mode', mode);
  } catch {
    // ignore
  }
}

/**
 * Opens an outbound URL using the selected mode without cluttering tabs.
 * - 'companion': Reuses a dedicated floating window positioned side-by-side.
 * - 'reusable-tab': Reuses a single browser tab named 'LinkBuilderWorkstation'.
 * - 'new-tab': Opens standard '_blank' new tab.
 */
export function openOutreachUrl(
  url: string,
  options?: LinkOpenOptions
): Window | null {
  if (typeof window === 'undefined') return null;

  const mode = options?.mode || getSavedLinkOpenMode();
  const targetName = options?.targetName || 'LinkBuilderCompanion';

  if (mode === 'companion') {
    // Calculate optimal split-screen size: right 55% of user's screen
    const screenWidth = window.screen.availWidth || window.innerWidth;
    const screenHeight = window.screen.availHeight || window.innerHeight;

    // Use minimum width of 850px for LinkedIn desktop layout
    const companionWidth = Math.max(880, Math.floor(screenWidth * 0.52));
    const companionHeight = Math.max(700, Math.floor(screenHeight * 0.94));
    const companionLeft = Math.max(0, screenWidth - companionWidth - 10);
    const companionTop = 30;

    const windowFeatures = [
      `width=${companionWidth}`,
      `height=${companionHeight}`,
      `left=${companionLeft}`,
      `top=${companionTop}`,
      'menubar=no',
      'toolbar=no',
      'location=yes',
      'status=no',
      'resizable=yes',
      'scrollbars=yes',
    ].join(',');

    try {
      // Re-use existing window reference or open named target
      if (activeCompanionWindow && !activeCompanionWindow.closed) {
        activeCompanionWindow.location.href = url;
        activeCompanionWindow.focus();
        return activeCompanionWindow;
      } else {
        activeCompanionWindow = window.open(url, targetName, windowFeatures);
        if (activeCompanionWindow) {
          activeCompanionWindow.focus();
        }
        return activeCompanionWindow;
      }
    } catch {
      // Fallback if popup was blocked
      return window.open(url, targetName);
    }
  } else if (mode === 'reusable-tab') {
    // Reusable single browser tab
    return window.open(url, 'LinkBuilderWorkstation');
  } else {
    // Classic new tab
    return window.open(url, '_blank');
  }
}

/**
 * Returns the HTML target attribute string for <a> tags when not using onClick.
 */
export function getLinkTargetAttribute(mode: LinkOpenMode): string {
  if (mode === 'companion') return 'LinkBuilderCompanion';
  if (mode === 'reusable-tab') return 'LinkBuilderWorkstation';
  return '_blank';
}
