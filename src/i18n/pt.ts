const pt = {
  // Header
  'header.apiKeyWarning': 'API Key não configurada',
  'header.darkModeOn': 'Modo claro',
  'header.darkModeOff': 'Modo escuro',
  'header.ariaLightMode': 'Ativar modo claro',
  'header.ariaDarkMode': 'Ativar modo escuro',
  'header.configureAI': 'Configurar IA',
  'header.processing': 'IA processando...',

  // Footer
  'footer.newBlock': '+ Novo bloco',
  'footer.copy': 'Copiar',
  'footer.open': 'Abrir .md',
  'footer.save': 'Salvar',
  'footer.exportMd': 'Exportar .md',
  'footer.exportHtml': 'Exportar .html',
  'footer.blockCount': { one: ' bloco', other: ' blocos' },
  'footer.openTools': 'Abrir ferramentas',

  // Bridge
  'bridge.link': 'Ligar blocos',
  'bridge.cancel': 'Cancelar',

  // Block
  'block.placeholder': 'Escreva seu texto aqui...',
  'block.correct': 'Corrigir',
  'block.rewrite': 'Reescrever',
  'block.rewritePlaceholder': 'Ex: torne mais formal...',
  'block.ok': 'Ok',
  'block.cancel': 'Cancelar',
  'block.ariaLabel': 'Bloco',
  'block.drag': 'Arrastar',
  'block.moveUp': 'Mover para cima',
  'block.moveDown': 'Mover para baixo',
  'block.selectForBridge': 'Selecionar para ligar',
  'block.delete': 'Excluir bloco',

  // Toolbar
  'toolbar.bold': 'Negrito',
  'toolbar.italic': 'Itálico',
  'toolbar.strikethrough': 'Tachado',
  'toolbar.heading': 'Cabeçalho',
  'toolbar.blockquote': 'Citação',
  'toolbar.bulletList': 'Lista com marcadores',
  'toolbar.numberedList': 'Lista numerada',
  'toolbar.headingLevel': ' Título',

  // Settings
  'settings.title': 'Configuração da IA',
  'settings.provider': 'Provedor',
  'settings.apiKey': 'API Key',
  'settings.apiKeyPlaceholder': 'sk-...',
  'settings.apiKeyHelp': 'Sua chave fica armazenada apenas no navegador (localStorage).',
  'settings.cancel': 'Cancelar',
  'settings.save': 'Salvar',

  // Toasts - Success
  'toast.bridgeSuccess': 'Texto de transição gerado com sucesso!',
  'toast.correctSuccess': 'Bloco corrigido com sucesso!',
  'toast.rewriteSuccess': 'Bloco reescrito com sucesso!',
  'toast.copySuccess': 'Texto copiado com formatação!',
  'toast.htmlSuccess': 'Arquivo .html exportado com sucesso!',
  'toast.mdSuccess': 'Arquivo .md exportado com sucesso!',
  'toast.saveSuccess': 'Documento salvo com sucesso!',
  'toast.openSuccess': 'Documento aberto com sucesso!',

  // Toasts - Error
  'toast.bridgeError': 'Erro ao comunicar com a IA.',
  'toast.apiKeyRequired': 'Configure a API Key da IA para usar esta função.',
  'toast.correctError': 'Erro ao comunicar com a IA.',
  'toast.rewriteError': 'Erro ao comunicar com a IA.',
  'toast.copyError': 'Erro ao copiar.',
  'toast.saveError': 'Erro ao salvar o documento.',
  'toast.openError': 'Não foi possível abrir o arquivo.',
  'toast.invalidFile': 'Apenas arquivos .md são aceitos.',

  // AI Errors
  'ai.timeout': 'A requisição excedeu o tempo limite. Tente novamente.',
  'ai.network': 'Erro de conexão. Verifique se a API Key está correta (sem espaços extras) e se o provedor suporta CORS.',
  'ai.auth': 'API Key inválida ou expirada. Verifique suas configurações.',
  'ai.rateLimit': 'Limite de requisições excedido. Aguarde um momento e tente novamente.',
  'ai.serverError': 'Erro no servidor do provedor. Tente novamente mais tarde.',
  'ai.unexpected': 'Erro inesperado ({status}). Tente novamente.',

  // IO
  'io.markdownDesc': 'Markdown',
  'io.defaultFilename': 'documento.md',
  'io.defaultHtmlFilename': 'documento.html',
  'io.htmlLang': 'pt-BR',
} as const

export default pt
