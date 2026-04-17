'use client';

import Script from 'next/script';

interface GtmScriptProps {
  gtmId?: string;
}

/**
 * Google Tag Manager Script Component
 *
 * Injects GTM tracking code.
 * Only renders if NEXT_PUBLIC_GTM_ID is set.
 */
export function GtmScript({ gtmId }: GtmScriptProps) {
  const id = gtmId || process.env.NEXT_PUBLIC_GTM_ID;

  if (!id) {
    return null;
  }

  return (
    <Script id="gtm" strategy="afterInteractive">
      {`
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${id}');
      `}
    </Script>
  );
}

/**
 * GTM NoScript fallback (for body)
 */
export function GtmNoScript({ gtmId }: GtmScriptProps) {
  const id = gtmId || process.env.NEXT_PUBLIC_GTM_ID;

  if (!id) {
    return null;
  }

  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${id}`}
        height="0"
        width="0"
        style={{ display: 'none', visibility: 'hidden' }}
        title="GTM"
      />
    </noscript>
  );
}

// Declare dataLayer on window for TypeScript
declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

/**
 * Push an event to the GTM dataLayer
 *
 * @example
 * pushToDataLayer('webinar_registration', { webinar_title: 'Logosofia 101' });
 */
export function pushToDataLayer(event: string, data?: Record<string, unknown>) {
  if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event, ...data });
  }
}

/**
 * Push a page view event to dataLayer
 */
export function trackPageView(pagePath: string, pageTitle?: string) {
  pushToDataLayer('page_view', {
    page_path: pagePath,
    page_title: pageTitle,
  });
}

/**
 * Push a conversion event to dataLayer
 */
export function trackConversion(conversionId: string, value?: number, currency = 'BRL') {
  pushToDataLayer('conversion', {
    conversion_id: conversionId,
    value,
    currency,
  });
}
