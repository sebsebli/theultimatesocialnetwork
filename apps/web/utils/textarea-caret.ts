/**
 * The properties that we copy into a mirrored div.
 * Note that some of these are explicitly overwritten by the CSS.
 */
const properties = [
  'direction',
  'boxSizing',
  'width',
  'height',
  'overflowX',
  'overflowY',
  'borderTopWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'borderStyle',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'fontStyle',
  'fontVariant',
  'fontWeight',
  'fontStretch',
  'fontSize',
  'fontSizeAdjust',
  'lineHeight',
  'fontFamily',
  'textAlign',
  'textTransform',
  'textIndent',
  'textDecoration',
  'letterSpacing',
  'wordSpacing',
  'tabSize',
  'MozTabSize',
] as const;

export interface Coordinates {
  top: number;
  left: number;
  height: number;
}

/**
 * Returns the coordinates of the caret in a textarea or input.
 * 
 * @param element The HTMLTextAreaElement or HTMLInputElement
 * @param position The index of the character to get the coordinates for
 */
export function getCaretCoordinates(element: HTMLTextAreaElement | HTMLInputElement, position: number): Coordinates {
  const isFirefox = typeof window !== 'undefined' && (window as Window & { mozInnerScreenX?: number }).mozInnerScreenX != null;

  // The mirror div will replicate the textarea's style
  const div = document.createElement('div');
  div.id = 'input-textarea-caret-position-mirror-div';
  document.body.appendChild(div);

  const style = div.style;
  const computed = window.getComputedStyle(element);

  // Default textarea styles
  style.whiteSpace = 'pre-wrap';
  style.wordWrap = 'break-word'; 
  style.position = 'absolute';  // required to return coordinates properly
  style.visibility = 'hidden';  // not 'display: none' because we need rendering

  // Transfer the element's properties to the div
  properties.forEach((prop) => {
    // Type assertion needed because CSSStyleDeclaration doesn't have index signature
    const styleRecord = style as CSSStyleDeclaration & Record<string, string>;
    const computedRecord = computed as CSSStyleDeclaration & Record<string, string>;
    styleRecord[prop] = computedRecord[prop];
  });

  if (isFirefox) {
    // Firefox lies about the overflow property for textareas: https://bugzilla.mozilla.org/show_bug.cgi?id=984275
    const computedHeight = computed.height;
    if (element.scrollHeight > parseInt(computedHeight))
      style.overflowY = 'scroll';
  } else {
    style.overflow = 'hidden';  // for Chrome to not render a scrollbar; IE keeps overflowY = 'scroll'
  }

  div.textContent = element.value.substring(0, position);
  
  // The second special handling for input type="text" vs textarea:
  // spaces need to be replaced with non-breaking spaces - http://stackoverflow.com/a/13402035/1269037
  if (element.nodeName === 'INPUT') {
    div.textContent = div.textContent.replace(/\s/g, '\u00a0');
  }

  const span = document.createElement('span');
  // Wrapping must be replicated *exactly*, including when a long word gets
  // onto the next line, with whitespace at the end of the line before that 
  // word.  So  we need to use the text content from the textarea up to the 
  // cursor, and then add a span to get the position.
  span.textContent = element.value.substring(position) || '.';  // || '.' because the span needs to have at least some text
  div.appendChild(span);

  const coordinates = {
    top: span.offsetTop + parseInt(computed.borderTopWidth),
    left: span.offsetLeft + parseInt(computed.borderLeftWidth),
    height: parseInt(computed.lineHeight)
  };

  document.body.removeChild(div);

  return coordinates;
}
