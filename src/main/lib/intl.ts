import { app } from 'electron'
import { locale as localeMessages } from './locale'

// Supported locales
const locales = ['en', 'ja'] as const
export type SupportedLocales = (typeof locales)[number]

export const intl = {
  locale: 'en' as SupportedLocales,
  messages: {} as Record<string, string>,
  formatMessage: ({ id }: { id: string }): string => {
    return intl.messages[id] || id
  }
}

// Get the current locale
export const getLocale = (): SupportedLocales => {
  return intl.locale
}

// Set the current locale
export const setLocale = (locale: SupportedLocales): SupportedLocales => {
  initLocale(locale)
  return locale
}

// Get system locale from electron app
export const getSystemLocale = (): SupportedLocales => {
  try {
    const locale = app.getLocale().split('-')[0] // Extract language code from locale
    return locales.includes(locale as SupportedLocales) ? (locale as SupportedLocales) : 'en'
  } catch (error) {
    console.error('Failed to detect system locale:', error)
    return 'en' // Default to English if detection fails
  }
}

// Locale messages - combine locale messages from locale.ts with our internal messages
const locale = {
  en: {
    ...localeMessages.en,
    search: 'Search',
    searchMessages: 'Search messages',
    searchResultsCount: '{count} results',
    moreResults: '{count} more...',
    noSearchResults: 'No results found',
    loadingMessages: 'Loading messages...',
    noMessagesFound: 'No messages found',
    messageContext: 'Message Context',
    knowledge: 'Knowledge',
    knowledgeSaved: 'Knowledge saved',
    savingKnowledge: 'Saving knowledge...',
    knowledgeFound: 'Knowledge found',
    searchingKnowledge: 'Searching knowledge...',
    knowledgeIndexUpdated: 'Knowledge index updated',
    updatingKnowledgeIndex: 'Updating knowledge index...',
    memory: 'Memory',
    memorySaved: 'Memory saved',
    updatingMemory: 'Updating memory...',
    request: 'Request',
    response: 'Response',
    settings: 'Settings',
    askMeAnything: 'Ask me anything...',
    toolConfirmation: 'Allow {toolName} to run?',
    yes: 'Yes',
    no: 'No',
    newChat: 'New Chat',
    copyAll: 'Copy All',
    deleteMessage: 'Delete Message',
    stopAssistant: 'Stop Assistant'
  },
  ja: {
    ...localeMessages.ja,
    search: '検索',
    searchMessages: 'メッセージを検索',
    searchResultsCount: '{count}件の結果',
    moreResults: 'あと{count}件...',
    noSearchResults: '結果が見つかりませんでした',
    loadingMessages: 'メッセージを読み込み中...',
    noMessagesFound: 'メッセージが見つかりませんでした',
    messageContext: 'メッセージコンテキスト',
    knowledge: 'ナレッジ',
    knowledgeSaved: 'ナレッジが保存されました',
    savingKnowledge: 'ナレッジを保存中...',
    knowledgeFound: 'ナレッジが見つかりました',
    otherKnowledge: 'その他のナレッジ',
    relatedKnowledge: '関連ナレッジ',
    unrelatedKnowledge: '無関係ナレッジ',
    chronologicalKnowledge: '時間的近似ナレッジ',
    searchingKnowledge: 'ナレッジを検索中...',
    knowledgeIndexUpdated: 'ナレッジインデックスが更新されました',
    updatingKnowledgeIndex: 'ナレッジインデックスを更新中...',
    memory: 'メモリ',
    memorySaved: 'メモリが保存されました',
    updatingMemory: 'メモリを更新中...',
    request: 'リクエスト',
    response: 'レスポンス',
    settings: '設定',
    askMeAnything: '何でも聞いてください...',
    toolConfirmation: '{toolName}の実行を許可しますか？',
    yes: 'はい',
    no: 'いいえ',
    newChat: '新規チャット',
    copyAll: '全てコピー',
    deleteMessage: 'メッセージを削除',
    stopAssistant: 'アシスタントを停止'
  }
} as const

// Add more locales with their translations

// Create a lookup cache for each locale
const cache: Record<SupportedLocales, Record<string, string>> = {} as Record<
  SupportedLocales,
  Record<string, string>
>

// Helper to get stored locale preference or use system locale
export const getPreferredLocale = (): keyof typeof locale => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path')

    const userDataPath = app.getPath('userData')
    const localeFilePath = path.join(userDataPath, 'locale-preference.json')

    if (fs.existsSync(localeFilePath)) {
      const data = JSON.parse(fs.readFileSync(localeFilePath, 'utf8'))
      if (data && data.locale && locale[data.locale as keyof typeof locale]) {
        return data.locale as keyof typeof locale
      }
    }

    // Fall back to system locale
    return getSystemLocale()
  } catch (error) {
    console.error('Failed to get locale preference:', error)
    return 'en' // Default to English
  }
}

// Initialize with the preferred locale
export const initLocale = (localeKey: keyof typeof locale = getPreferredLocale()): void => {
  // 直接実行して同期的に初期化
  const selectedLocale = localeKey || getPreferredLocale()

  // Use cache if available
  if (!cache[selectedLocale]) {
    cache[selectedLocale] = {}
    // Populate cache for selected locale
    for (const [key, value] of Object.entries(locale[selectedLocale])) {
      cache[selectedLocale][key] = value
    }
  }

  const messages = cache[selectedLocale]

  // Update intl object immediately
  Object.assign(intl, { locale: selectedLocale, messages })

  console.log(`Locale initialized to: ${selectedLocale}`)

  // Store the selected locale in user preferences
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path')

    const userDataPath = app.getPath('userData')
    const localeFilePath = path.join(userDataPath, 'locale-preference.json')

    try {
      // Create directory if it doesn't exist (for testing purposes)
      const dirPath = path.dirname(localeFilePath)
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true })
      }
      fs.writeFileSync(localeFilePath, JSON.stringify({ locale: selectedLocale }), 'utf8')
    } catch (writeError) {
      // Silent failure in tests, log in production
      if (process.env.NODE_ENV !== 'test') {
        console.error('Failed to save locale preference:', writeError)
      }
    }
  } catch (error) {
    // Silent failure in tests, log in production
    if (process.env.NODE_ENV !== 'test') {
      console.error('Failed to save locale preference:', error)
    }
  }
}
