import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { Message, SearchMessagesParams } from '../main/lib/message'

export type Tool = {
  name: string
  description: string
}

export type ToolWithEnabled = Tool & {
  enabled: boolean
}

export type MessagesSearchResult = {
  success: boolean
  data: {
    messages: Array<Message>
    total: number
    totalPages: number
  } | null
  error: string | null
}

const api = {
  init: (): Promise<{ message: Array<Message>; title: string }> => ipcRenderer.invoke('init'),
  getTools: (): Promise<Array<Tool>> => ipcRenderer.invoke('get-tools'),
  getEnabledTools: (): Promise<Array<ToolWithEnabled>> => ipcRenderer.invoke('get-tools-enabled'),
  updateToolEnabled: (toolName: string, enabled: boolean): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('update-tool-enabled', toolName, enabled),
  getSearchGrounding: (): Promise<{ enabled: boolean }> =>
    ipcRenderer.invoke('get-search-grounding'),
  updateSearchGrounding: (enabled: boolean): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('update-search-grounding', enabled),
  link: (url: string): Promise<void> => ipcRenderer.invoke('link', url),
  interrupt: (): Promise<void> => ipcRenderer.invoke('interrupt'),
  send: (input: string, isRetry: boolean): Promise<void> =>
    ipcRenderer.invoke('send', input, isRetry),
  getConfig: (name: string): Promise<string> => ipcRenderer.invoke('get-config', name),
  setConfig: (name: string, input: unknown): Promise<void> =>
    ipcRenderer.invoke('set-config', name, input),
  restartApp: (): Promise<void> => ipcRenderer.invoke('restart-app'),
  deleteMessage: (messageId: string): Promise<void> =>
    ipcRenderer.invoke('delete-message', messageId),
  searchMessages: (params: SearchMessagesParams): Promise<MessagesSearchResult> =>
    ipcRenderer.invoke('search-messages', params),
  getMessageContext: (
    messageId: string,
    count?: number
  ): Promise<{
    success: boolean
    data: Array<Message> | null
    error: string | null
  }> => ipcRenderer.invoke('get-message-context', messageId, count),
  getLocale: (): Promise<string> => ipcRenderer.invoke('get-locale'),
  setLocale: (locale: string): Promise<string> => ipcRenderer.invoke('set-locale', locale),

  // アーティファクト関連API
  createKnowledge: (
    text: string,
    id?: string
  ): Promise<{ action: string; id: string; title: string }> =>
    ipcRenderer.invoke('create-knowledge', text, id),
  updateKnowledge: (
    text: string,
    id: string,
    targetId: string
  ): Promise<{ action: string; id: string; originalId: string }> =>
    ipcRenderer.invoke('update-knowledge', text, id, targetId),
  deleteKnowledge: (ids: string[]): Promise<{ deleted: string[]; action: string }> =>
    ipcRenderer.invoke('delete-knowledge', ids),
  searchKnowledge: (
    query: string,
    limit = 20
  ): Promise<{ results: Array<{ content: string; id: string; similarity: number }> }> =>
    ipcRenderer.invoke('search-knowledge', query, limit),
  reindexKnowledge: (): Promise<{ success: boolean; reindexedCount: number }> =>
    ipcRenderer.invoke('reindex-knowledge')
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}

// IPC Events
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send: (channel: string, ...args: unknown[]) => {
      const validChannels = [
        'search-threads',
        'show-message-context-menu',
        'show-thread-context-menu',
        'tool-approval'
      ]
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, ...args)
      }
    },
    on: (channel: string, callback: (...args: unknown[]) => void) => {
      const validChannels = [
        'stream',
        'tool-call',
        'step-finish',
        'finish',
        'error',
        'tool-result',
        'title',
        'search-threads-result',
        'search-result',
        'search-query',
        'start-search',
        'new-thread',
        'retry',
        'source',
        'message-deleted',
        'knowledge-saved',
        'memory-updated',
        'message-saved',
        'note-created',
        'knowledge-reindexed'
      ]
      if (validChannels.includes(channel)) {
        ipcRenderer.on(channel, (_, ...args) => callback(...args))
      }
    },
    removeAllListeners: (channel: string) => {
      const validChannels = [
        'stream',
        'tool-call',
        'step-finish',
        'finish',
        'error',
        'tool-result',
        'title',
        'search-threads-result',
        'search-result',
        'search-query',
        'start-search',
        'new-thread',
        'retry',
        'source',
        'message-deleted',
        'knowledge-saved',
        'memory-updated',
        'message-saved',
        'note-created',
        'knowledge-reindexed'
      ]
      if (validChannels.includes(channel)) {
        ipcRenderer.removeAllListeners(channel)
      }
    }
  }
})
