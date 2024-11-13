import { HNParser } from './hn';
import { RedditParser } from './reddit';

// Map of hostnames to parser classes
export const COMMUNITY_PARSERS = {
    'news.ycombinator.com': HNParser,
    'www.reddit.com': RedditParser,
    'old.reddit.com': RedditParser,
    // Add more Reddit domains if needed
    'reddit.com': RedditParser,
    'np.reddit.com': RedditParser
};

// Get appropriate parser for current site
export function getParser() {
    const hostname = window.location.hostname.replace(/^(www\.|old\.|np\.)/, '');
    const ParserClass = COMMUNITY_PARSERS[hostname] || COMMUNITY_PARSERS[`www.${hostname}`];
    
    if (!ParserClass) {
        throw new Error(`No parser available for ${hostname}`);
    }
    
    return new ParserClass();
}

// Check if site is supported
export function isSupportedSite() {
    const hostname = window.location.hostname;
    return Object.keys(COMMUNITY_PARSERS).some(domain => 
        hostname === domain || 
        hostname.endsWith(`.${domain}`)
    );
}