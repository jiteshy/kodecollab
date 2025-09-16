import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { ValidationService } from '@collabx/shared';
import { LandingContent } from './landing-content';

// List of known search engine bots and crawlers
const BOT_USER_AGENTS = [
  'googlebot',
  'bingbot',
  'slurp', // Yahoo
  'duckduckbot',
  'baiduspider',
  'yandexbot',
  'facebookexternalhit',
  'twitterbot',
  'rogerbot', // Moz
  'linkedinbot',
  'embedly',
  'quora link preview',
  'showyoubot',
  'outbrain',
  'pinterest',
  'slackbot',
  'vkshare',
  'w3c_validator',
  'redditbot',
  'applebot',
  'whatsapp',
  'skypeuripreview',
  'microsoftpreview',
  'developers.google.com/+/web/snippet'
];

export default async function Home() {
  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || '';
  
  // Check if the request is from a search engine bot or crawler
  const isBot = BOT_USER_AGENTS.some(bot => 
    userAgent.toLowerCase().includes(bot.toLowerCase())
  );
  
  // Additional check for headless browsers that might be crawlers
  const isHeadless = userAgent.toLowerCase().includes('headless');
  
  if (!isBot && !isHeadless) {
    // Real users get redirect to a new session after brief engagement tracking
    const sessionId = ValidationService.generateValidSessionId(12);

    // Add a small delay to improve engagement metrics and allow page load tracking
    await new Promise(resolve => setTimeout(resolve, 1500));

    redirect(`/${sessionId}`);
  }
  
  // Search engine bots and crawlers see the static landing content
  return <LandingContent />;
}
