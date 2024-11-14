import { RedditSummarizer } from './platforms/RedditSummarizer';
import { HNSummarizer } from './platforms/HNSummarizer';

const PLATFORM_HANDLERS = {
    'news.ycombinator.com': HNSummarizer,
    'reddit.com': RedditSummarizer,
    'www.reddit.com': RedditSummarizer
};

function initializeSummarizer() {
    const hostname = window.location.hostname;
    const SummarizerClass = Object.entries(PLATFORM_HANDLERS).find(([domain]) => 
        hostname.includes(domain)
    )?.[1];

    if (!SummarizerClass) {
        console.log('Site not supported');
        return;
    }

    const summarizer = new SummarizerClass();
    summarizer.init();
}

initializeSummarizer();