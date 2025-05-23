import { MCPConfiguration } from '@mastra/mcp'
import { messageSearch } from './messageSearchTool'
import { artifactCreate, artifactSearch, artifactUpdate, artifactGet } from './artifactTool'
import { store } from './store'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let tools: Record<string, any>
let mcp: MCPConfiguration

export const initializeMCP = async (): Promise<void> => {
  const mcpServers = store.get('mcpServers') as
    | Record<
        string,
        {
          command: string
          args: string[]
          env?: Record<string, string>
        }
      >
    | undefined

  if (!mcp) {
    mcp = new MCPConfiguration({
      servers: mcpServers || {}
    })
  }

  const messageTools = {
    search_message: messageSearch,
    create_note: artifactCreate,
    search_notes: artifactSearch,
    update_note: artifactUpdate,
    get_note: artifactGet
  }
  const mcpTools = await mcp.getTools()
  tools = { ...messageTools, ...mcpTools }
}

export { mcp, tools }
