import { log } from './logger';

/**
 * Wait for an element's shadow root to be attached
 * @param {Element} element Element to wait for shadow root
 * @returns {Promise<ShadowRoot>}
 */
export const waitForShadowRoot = async (element) => {
    if (element.shadowRoot) {
        return element.shadowRoot;
    }

    return new Promise((resolve) => {
        element.addEventListener('shadowrootattached', () => {
            resolve(element.shadowRoot);
        });
    });
};

/**
 * Wait for an element matching the selector to appear in the DOM
 * @param {string} selector Element selector to wait for
 * @param {number} timeout Timeout in milliseconds
 * @returns {Promise<Element>}
 */
export const waitForElement = (selector, timeout = 30000) => {
    return new Promise((resolve, reject) => {
        const element = document.querySelector(selector);
        if (element) {
            resolve(element);
            return;
        }

        const observer = new MutationObserver((mutations, obs) => {
            const element = document.querySelector(selector);
            if (element) {
                obs.disconnect();
                resolve(element);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Set timeout
        setTimeout(() => {
            observer.disconnect();
            reject(new Error(`Timeout waiting for element: ${selector}`));
        }, timeout);
    });
};

/**
 * Query for an element within a shadow root
 * @param {Element} element Element containing the shadow root
 * @param {string} selector Selector to query for
 * @returns {Promise<Element>}
 */
export const queryShadowRoot = async (element, selector) => {
    try {
        const shadowRoot = await waitForShadowRoot(element);
        return shadowRoot.querySelector(selector);
    } catch (error) {
        log.error('Error querying shadow root:', error);
        return null;
    }
};

/**
 * Create a button element with standard styling
 * @param {string} text Button text content
 * @param {Function} onClick Click event handler
 * @param {Object} styles Additional styles to apply
 * @returns {HTMLButtonElement}
 */
export const createButton = (text, onClick, styles = {}) => {
    const button = document.createElement('button');
    button.textContent = text;
    button.onclick = onClick;
    
    // Apply default styles
    button.style.cssText = `
        font-size: 12px;
        font-weight: 500;
        color: var(--color-tone-1);
        background: none;
        border: none;
        padding: 4px 8px;
        cursor: pointer;
        margin-left: 8px;
        border-radius: 4px;
    `;
    
    // Apply custom styles
    Object.assign(button.style, styles);
    
    return button;
};

/**
 * Safely insert an element into a shadow root
 * @param {Element} container Element containing the shadow root
 * @param {string} selector Selector for the target element to append to
 * @param {Element} element Element to insert
 * @returns {Promise<boolean>} Success status
 */
export const insertIntoShadowRoot = async (container, selector, element) => {
    try {
        const shadowRoot = await waitForShadowRoot(container);
        const target = shadowRoot.querySelector(selector);
        
        if (target) {
            target.appendChild(element);
            return true;
        }
        
        return false;
    } catch (error) {
        log.error('Error inserting into shadow root:', error);
        return false;
    }
};

/**
 * Check if an element is currently visible in the viewport
 * @param {Element} element Element to check
 * @returns {boolean}
 */
export const isInViewport = (element) => {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
};

/**
 * Scroll to a specific comment and highlight it
 * @param {string} commentId ID of the comment to scroll to
 * @returns {Promise<void>}
 */
export const scrollToComment = async (commentId) => {
    const comment = document.querySelector(`shreddit-comment[comment-id="${commentId}"]`);
    if (!comment) return;

    // Scroll the comment into view
    comment.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Highlight the comment
    try {
        const shadowRoot = await waitForShadowRoot(comment);
        const commentBody = shadowRoot.querySelector('.comment-body');
        
        if (commentBody) {
            // Remove existing highlights
            document.querySelectorAll('shreddit-comment').forEach(async (c) => {
                const root = await waitForShadowRoot(c);
                root.querySelector('.comment-body')?.classList.remove('highlight');
            });

            // Add new highlight
            commentBody.classList.add('highlight');
            commentBody.style.backgroundColor = 'rgba(0, 121, 211, 0.05)';
            commentBody.style.borderLeft = '3px solid #0079d3';

            // Remove highlight after 3 seconds
            setTimeout(() => {
                commentBody.style.backgroundColor = '';
                commentBody.style.borderLeft = '';
            }, 3000);
        }
    } catch (error) {
        log.error('Error highlighting comment:', error);
    }
};

/**
 * Add global styles to the document
 * @param {string} css CSS string to add
 * @param {string} id Optional ID for the style tag
 */
export const addGlobalStyle = (css, id) => {
    // Don't add duplicate styles if ID is provided and already exists
    if (id && document.getElementById(id)) {
        return;
    }

    const style = document.createElement('style');
    if (id) {
        style.id = id;
    }
    style.textContent = css;
    document.head.appendChild(style);
};