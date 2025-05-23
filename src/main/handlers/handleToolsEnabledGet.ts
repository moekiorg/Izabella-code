import { tools } from '../lib/initializeMCP'
import { store } from '../lib/store'

export const handleToolsEnabledGet = (): {
  name: string
  description: string
  enabled: boolean
}[] => {
  const enabledTools = store.get('enabledTools') as string[] | undefined

  if (!enabledTools) {
    store.set('enabledTools', [])

    return Object.keys(tools).map((name) => ({
      name,
      description: tools[name].description,
      enabled: false
    }))
  }

  return Object.keys(tools).map((name) => ({
    name,
    description: tools[name].description,
    enabled: enabledTools.includes(name)
  }))
}
