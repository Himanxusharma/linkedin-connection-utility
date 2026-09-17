'use client';

export type LinkOpenMode = 'split' | 'companion' | 'reusable-tab' | 'new-tab';

export const DEFAULT_LINK_OPEN_MODE: LinkOpenMode = 'split';
export const SPLIT_TAB_NAME = 'LinkedInWorkstation';

export interface LinkOpenOptions {
  mode?: LinkOpenMode;
  targetName?: string;
  companyName?: string;
  forceBrowser?: boolean; // bypass mobile app deep-link if requested
}

// Global reference to the companion window to allow focusing and smooth steering
let activeCompanionWindow: Window | null = null;

/**
 * Detects if the current user agent is a mobile device (iOS, Android, tablet).
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  // Also detect iPad on iPadOS 13+ which reports as Macintosh with touch points
  const isIPad = /Macintosh/i.test(ua) && (navigator.maxTouchPoints || 0) > 1;
  return isMobileUA || isIPad;
}

/**
 * Gets the persisted user preference for mobile LinkedIn App redirection.
 * Default is true on mobile.
 */
export function getSavedMobileAppRedirect(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const saved = localStorage.getItem('linkbuilder_mobile_app_redirect');
    if (saved !== null) {
      return saved === 'true';
    }
  } catch {
    // ignore
  }
  return true;
}

/**
 * Saves the user preference for mobile LinkedIn App redirection.
 */
export function saveMobileAppRedirect(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('linkbuilder_mobile_app_redirect', enabled ? 'true' : 'false');
  } catch {
    // ignore
  }
}

/**
 * Constructs deep links for native mobile LinkedIn app (Android Intent & iOS Scheme).
 */
export function getLinkedInMobileLink(webUrl: string): {
  appUrl: string;
  isAndroid: boolean;
  isIOS: boolean;
  isLinkedIn: boolean;
} {
  if (!webUrl) return { appUrl: '', isAndroid: false, isIOS: false, isLinkedIn: false };

  const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent || '');
  const isIOS = typeof navigator !== 'undefined' && (/iPhone|iPad|iPod/i.test(navigator.userAgent || '') || (/Macintosh/i.test(navigator.userAgent || '') && (navigator.maxTouchPoints || 0) > 1));
  const isLinkedIn = webUrl.includes('linkedin.com');

  if (!isLinkedIn) {
    return { appUrl: webUrl, isAndroid, isIOS, isLinkedIn: false };
  }

  // 1. Android Chrome Intent URI (intercepts directly into com.linkedin.android app with web fallback)
  if (isAndroid) {
    const cleanPath = webUrl.replace(/^https?:\/\//i, '');
    const intentUrl = `intent://${cleanPath}#Intent;scheme=https;package=com.linkedin.android;S.browser_fallback_url=${encodeURIComponent(webUrl)};end`;
    return { appUrl: intentUrl, isAndroid: true, isIOS: false, isLinkedIn: true };
  }

  // 2. iOS LinkedIn Scheme
  if (isIOS) {
    const companyMatch = webUrl.match(/linkedin\.com\/company\/([^\/?#]+)/i);
    if (companyMatch && companyMatch[1]) {
      const slug = companyMatch[1];
      return { appUrl: `linkedin://company/${slug}`, isAndroid: false, isIOS: true, isLinkedIn: true };
    }
    // Universal link fallback for other LinkedIn pages
    return { appUrl: webUrl, isAndroid: false, isIOS: true, isLinkedIn: true };
  }

  return { appUrl: webUrl, isAndroid: false, isIOS: false, isLinkedIn: true };
}

/**
 * Gets the persisted user preference for link opening mode.
 */
export function getSavedLinkOpenMode(): LinkOpenMode {
  if (typeof window === 'undefined') return DEFAULT_LINK_OPEN_MODE;
  try {
    const saved = localStorage.getItem('linkbuilder_open_mode') as LinkOpenMode;
    if (saved === 'split' || saved === 'companion' || saved === 'reusable-tab' || saved === 'new-tab') {
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
 * Launches or focuses the dedicated LinkedIn workstation tab for Chrome Split View.
 */
export function launchSplitScreenLinkedIn(): Window | null {
  if (typeof window === 'undefined') return null;
  return window.open('https://www.linkedin.com/feed/', SPLIT_TAB_NAME);
}

/**
 * Opens an outbound URL using the selected mode without cluttering tabs.
 * - 'split': Reuses a dedicated target tab (SPLIT_TAB_NAME) designed for Chrome Split View / Snap.
 * - 'companion': Reuses a floating popup window positioned on the right side of the screen.
 * - 'reusable-tab': Legacy alias for reusable target tab.
 * - 'new-tab': Opens standard '_blank' new tab.
 */
export function openOutreachUrl(
  url: string,
  options?: LinkOpenOptions
): Window | null {
  if (typeof window === 'undefined') return null;

  const isMobile = isMobileDevice();
  const mobileRedirect = getSavedMobileAppRedirect();

  // Mobile App Deep-Link Interception (Android Intent / iOS Scheme)
  if (isMobile && mobileRedirect && !options?.forceBrowser && url.includes('linkedin.com')) {
    const { appUrl, isAndroid, isIOS } = getLinkedInMobileLink(url);

    if (isAndroid) {
      // Chrome Intent automatically opens native LinkedIn app or falls back to web
      window.location.href = appUrl;
      return null;
    }

    if (isIOS) {
      const startTime = Date.now();
      window.location.href = appUrl;
      setTimeout(() => {
        // If app isn't installed and window remains active, fall back to web
        if (Date.now() - startTime < 1600) {
          window.location.href = url;
        }
      }, 1000);
      return null;
    }

    window.location.href = url;
    return null;
  }

  const mode = options?.mode || getSavedLinkOpenMode();
  const targetName = options?.targetName || (mode === 'companion' ? 'LinkBuilderCompanion' : SPLIT_TAB_NAME);

  if (mode === 'split' || mode === 'reusable-tab') {
    // Split Screen Target Tab: Opens clean browser tab without popup window features
    // Designed for Chrome Split View, Edge Split Screen, macOS Tile Window, and Windows Snap
    return window.open(url, SPLIT_TAB_NAME);
  }

  if (mode === 'companion') {
    // On mobile, companion popup windows are not supported well; use single tab/reusable window
    if (isMobile) {
      return window.open(url, SPLIT_TAB_NAME);
    }

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
  }

  // Classic new tab
  return window.open(url, '_blank');
}

/**
 * Returns the HTML target attribute string for <a> tags when not using onClick.
 */
export function getLinkTargetAttribute(mode: LinkOpenMode): string {
  if (typeof window !== 'undefined' && isMobileDevice() && getSavedMobileAppRedirect()) {
    // Direct navigation allows iOS Universal Links and Android App Links to open native app
    return '_self';
  }
  if (mode === 'split' || mode === 'reusable-tab') return SPLIT_TAB_NAME;
  if (mode === 'companion') return 'LinkBuilderCompanion';
  return '_blank';
}
