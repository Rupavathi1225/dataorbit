import { supabase } from "@/integrations/supabase/client";

// Generate or get session ID
export const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('dataorbit_session_id');
  if (!sessionId) {
    sessionId = 'SID-' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    sessionStorage.setItem('dataorbit_session_id', sessionId);
  }
  return sessionId;
};

// Get device info
export const getDeviceInfo = () => {
  const ua = navigator.userAgent;
  let device = 'Desktop';
  if (/mobile/i.test(ua)) device = 'Mobile';
  else if (/tablet/i.test(ua)) device = 'Tablet';
  
  let browser = 'Unknown';
  if (/chrome/i.test(ua)) browser = 'Chrome';
  else if (/firefox/i.test(ua)) browser = 'Firefox';
  else if (/safari/i.test(ua)) browser = 'Safari';
  else if (/edge/i.test(ua)) browser = 'Edge';
  
  return { device, browser };
};

// Get IP address
export const getIpAddress = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch {
    return 'unknown';
  }
};

// Get country from IP
export const getCountry = async (ip: string): Promise<string> => {
  try {
    const response = await fetch(`https://ipapi.co/${ip}/country_name/`);
    const country = await response.text();
    return country || 'Unknown';
  } catch {
    return 'Unknown';
  }
};

// Initialize session
export const initSession = async () => {
  const sessionId = getSessionId();
  const { device, browser } = getDeviceInfo();
  const ip = await getIpAddress();
  const country = await getCountry(ip);
  const source = new URLSearchParams(window.location.search).get('utm_source') || 'direct';
  
  // Check if session already exists
  const { data: existingSession } = await supabase
    .from('tracking_sessions')
    .select('id')
    .eq('session_id', sessionId)
    .maybeSingle();
  
  if (!existingSession) {
    await supabase.from('tracking_sessions').insert({
      session_id: sessionId,
      ip_address: ip,
      device,
      browser,
      country,
      source
    });
  }
  
  return { sessionId, ip, device, country, source };
};

// Track event
export const trackEvent = async (
  eventType: string,
  options: {
    blogId?: string;
    relatedSearchId?: string;
    webResultId?: string;
    pageUrl?: string;
  } = {}
) => {
  const sessionId = getSessionId();
  const { device } = getDeviceInfo();
  const ip = await getIpAddress();
  const country = await getCountry(ip);
  const source = new URLSearchParams(window.location.search).get('utm_source') || 'direct';
  
  await supabase.from('tracking_events').insert({
    session_id: sessionId,
    event_type: eventType,
    blog_id: options.blogId || null,
    related_search_id: options.relatedSearchId || null,
    web_result_id: options.webResultId || null,
    ip_address: ip,
    device,
    country,
    source,
    page_url: options.pageUrl || window.location.pathname
  });
};
