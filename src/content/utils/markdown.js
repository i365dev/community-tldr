// Simple markdown renderer
export const renderMarkdown = (text) => {
    return text
        // Headers
        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
        // Lists
        .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
        .replace(/^\* (.*$)/gm, '<li>$1</li>')
        // Paragraphs
        .split('\n')
        .map(line => line.trim() ? `<p>${line}</p>` : '')
        .join('\n');
};