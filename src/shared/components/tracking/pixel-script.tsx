'use client';

import Script from 'next/script';

interface PixelScriptProps {
  pixelId?: string;
}

/**
 * Meta Pixel Script Component
 *
 * Injects Facebook/Meta Pixel tracking code.
 * Only renders if NEXT_PUBLIC_META_PIXEL_ID is set.
 */
export function PixelScript({ pixelId }: PixelScriptProps) {
  const id = pixelId || process.env.NEXT_PUBLIC_META_PIXEL_ID;

  if (!id) {
    return null;
  }

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${id}');
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${id}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}

// Declare fbq on window for TypeScript
declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/**
 * Track a custom event with Meta Pixel
 *
 * @example
 * trackPixelEvent('Lead', { content_name: 'Webinar Registro' });
 * trackPixelEvent('CompleteRegistration');
 */
export function trackPixelEvent(eventName: string, params?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', eventName, params);
  }
}

/**
 * Track a custom (non-standard) event with Meta Pixel
 *
 * @example
 * trackPixelCustomEvent('WebinarRegistration', { webinar_title: 'Logosofia 101' });
 */
export function trackPixelCustomEvent(eventName: string, params?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('trackCustom', eventName, params);
  }
}
