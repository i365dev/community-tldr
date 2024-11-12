import { HNParser } from './hn';

// Map of hostnames to parser classes
export const COMMUNITY_PARSERS = {
    'news.ycombinator.com': HNParser,
    // Add more parsers here
};

// Get appropriate parser for current site
export function getParser() {
    const hostname = window.location.hostname;
    const ParserClass = COMMUNITY_PARSERS[hostname];
    
    if (!ParserClass) {
        throw new Error(`No parser available for ${hostname}`);
    }
    
    return new ParserClass();
}

// Check if site is supported
export function isSupportedSite() {
    return COMMUNITY_PARSERS.hasOwnProperty(window.location.hostname);
}