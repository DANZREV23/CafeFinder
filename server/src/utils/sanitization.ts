import sanitizeHtml from 'sanitize-html';

export const sanitizeContent = (content: string): string => {
  return sanitizeHtml(content, {
    allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    allowedAttributes: {
      'a': ['href', 'target', 'rel']
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      'a': sanitizeHtml.simpleTransform('a', { rel: 'nofollow noreferrer noopener', target: '_blank' })
    }
  });
};

export const sanitizePlain = (content: string): string => {
  return sanitizeHtml(content, {
    allowedTags: [],
    allowedAttributes: {}
  });
};
