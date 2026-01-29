import { describe, it, expect } from '@jest/globals';

// Mocks to simulate Mobile environment logic
const mockSelection = { start: 5, end: 5 };
const mockBody = 'Hello World';

const insertText = (
  text: string,
  selection: { start: number; end: number },
  body: string,
) => {
  const { start, end } = selection;
  const newBody = body.substring(0, start) + text + body.substring(end);
  const newPos = start + text.length;
  return { body: newBody, selection: { start: newPos, end: newPos } };
};

const addLink = (
  linkUrl: string,
  linkText: string | undefined,
  selection: { start: number; end: number },
  body: string,
) => {
  const { start, end } = selection;
  const textToDisplay =
    linkText || (start !== end ? body.substring(start, end) : linkUrl);

  const newText = `[${textToDisplay}](${linkUrl})`;
  const newBody = body.substring(0, start) + newText + body.substring(end);
  const newPos = start + newText.length;
  return { body: newBody, selection: { start: newPos, end: newPos } };
};

describe('Compose Logic (Mobile)', () => {
  it('should insert text at cursor position', () => {
    const res = insertText(' Test', mockSelection, mockBody);
    expect(res.body).toBe('Hello Test World');
    expect(res.selection.start).toBe(10);
  });

  it('should wrap selected text with link', () => {
    const selection = { start: 0, end: 5 }; // "Hello"
    const res = addLink('https://example.com', undefined, selection, mockBody);
    expect(res.body).toBe('[Hello](https://example.com) World');
  });

  it('should insert link at cursor if no selection', () => {
    const selection = { start: 6, end: 6 }; // after "Hello "
    const res = addLink('https://example.com', 'Link', selection, mockBody);
    expect(res.body).toBe('Hello [Link](https://example.com)World');
  });
});

describe('Search Trigger Logic', () => {
  // Logic from ComposeScreen.tsx
  const checkTriggers = (text: string, cursorIndex: number) => {
    const beforeCursor = text.slice(0, cursorIndex);

    // Topic Check
    const lastBracket = beforeCursor.lastIndexOf('[[');
    if (lastBracket !== -1) {
      const query = beforeCursor.slice(lastBracket + 2);
      if (!query.includes(']]') && !query.includes('\n')) {
        return { type: 'topic', query };
      }
    }
    return { type: 'none' };
  };

  it('should trigger topic search inside [[', () => {
    const text = 'Hello [[Top';
    const res = checkTriggers(text, text.length);
    expect(res.type).toBe('topic');
    expect(res.query).toBe('Top');
  });

  it('should not trigger topic search if closed', () => {
    const text = 'Hello [[Top]] ';
    const res = checkTriggers(text, text.length);
    expect(res.type).toBe('none');
  });

  it('should update query on every keystroke', () => {
    let text = 'Hello [[';
    let res = checkTriggers(text, text.length);
    expect(res.type).toBe('topic');
    expect(res.query).toBe('');

    text += 'T';
    res = checkTriggers(text, text.length);
    expect(res.query).toBe('T');

    text += 'o';
    res = checkTriggers(text, text.length);
    expect(res.query).toBe('To');
  });
});
