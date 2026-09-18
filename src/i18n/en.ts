const en = {
  // Header
  'header.apiKeyWarning': 'API Key not configured',
  'header.darkModeOn': 'Light mode',
  'header.darkModeOff': 'Dark mode',
  'header.ariaLightMode': 'Enable light mode',
  'header.ariaDarkMode': 'Enable dark mode',
  'header.configureAI': 'Configure AI',
  'header.processing': 'AI processing...',

  // Footer
  'footer.newBlock': '+ New block',
  'footer.copy': 'Copy',
  'footer.open': 'Open .md',
  'footer.save': 'Save',
  'footer.exportMd': 'Export .md',
  'footer.exportHtml': 'Export .html',
  'footer.blockCount': { one: ' block', other: ' blocks' },
  'footer.openTools': 'Open tools',

  // Bridge
  'bridge.link': 'Link blocks',
  'bridge.cancel': 'Cancel',

  // Block
  'block.placeholder': 'Write your text here...',
  'block.correct': 'Correct',
  'block.rewrite': 'Rewrite',
  'block.rewritePlaceholder': 'e.g. make it more formal...',
  'block.ok': 'Ok',
  'block.cancel': 'Cancel',
  'block.ariaLabel': 'Block',
  'block.drag': 'Drag',
  'block.moveUp': 'Move up',
  'block.moveDown': 'Move down',
  'block.selectForBridge': 'Select to link',
  'block.delete': 'Delete block',

  // Toolbar
  'toolbar.bold': 'Bold',
  'toolbar.italic': 'Italic',
  'toolbar.strikethrough': 'Strikethrough',
  'toolbar.heading': 'Heading',
  'toolbar.blockquote': 'Quote',
  'toolbar.bulletList': 'Bullet list',
  'toolbar.numberedList': 'Numbered list',
  'toolbar.headingLevel': ' Title',

  // Settings
  'settings.title': 'AI Settings',
  'settings.provider': 'Provider',
  'settings.apiKey': 'API Key',
  'settings.apiKeyPlaceholder': 'sk-...',
  'settings.apiKeyHelp': 'Your key is stored only in the browser (localStorage).',
  'settings.cancel': 'Cancel',
  'settings.save': 'Save',

  // Toasts - Success
  'toast.bridgeSuccess': 'Transition text generated successfully!',
  'toast.correctSuccess': 'Block corrected successfully!',
  'toast.rewriteSuccess': 'Block rewritten successfully!',
  'toast.copySuccess': 'Text copied with formatting!',
  'toast.htmlSuccess': 'HTML file exported successfully!',
  'toast.mdSuccess': 'Markdown file exported successfully!',
  'toast.saveSuccess': 'Document saved successfully!',
  'toast.openSuccess': 'Document opened successfully!',

  // Toasts - Error
  'toast.bridgeError': 'Error communicating with AI.',
  'toast.apiKeyRequired': 'Configure the AI API Key to use this feature.',
  'toast.correctError': 'Error communicating with AI.',
  'toast.rewriteError': 'Error communicating with AI.',
  'toast.copyError': 'Error copying text.',
  'toast.saveError': 'Error saving the document.',
  'toast.openError': 'Could not open the file.',
  'toast.invalidFile': 'Only .md files are accepted.',

  // AI Errors
  'ai.timeout': 'The request timed out. Try again.',
  'ai.network': 'Connection error. Check that your API Key is correct (no extra spaces) and that the provider supports CORS.',
  'ai.auth': 'Invalid or expired API Key. Check your settings.',
  'ai.rateLimit': 'Rate limit exceeded. Wait a moment and try again.',
  'ai.serverError': 'Provider server error. Try again later.',
  'ai.unexpected': 'Unexpected error ({status}). Try again.',

  // IO
  'io.markdownDesc': 'Markdown',
  'io.defaultFilename': 'document.md',
  'io.defaultHtmlFilename': 'document.html',
  'io.htmlLang': 'en',
} as const

export default en
