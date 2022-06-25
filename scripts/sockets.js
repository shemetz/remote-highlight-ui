import { onSocketMessageHighlightSomething, onSocketMessageFailedHighlight } from './remote-highlight-ui.js'
import { MODULE_ID } from './settings.js'

Hooks.on('ready', () => {
  game.socket.on(`module.${MODULE_ID}`, onSocketMessage)
})

export const onSocketMessage = (receivedMessage) => {
  if (receivedMessage.playerId && receivedMessage.playerId !== game.user.id) {
    return
  }
  if (receivedMessage.type === 'HIGHLIGHT_ELEMENT') {
    console.log(`Remote Highlight UI | received:    ${receivedMessage.selector}`)
    onSocketMessageHighlightSomething(receivedMessage)
  } else if (receivedMessage.type === 'FAILED_HIGHLIGHT') {
    if (game.user.isGM) {
      console.log(`Remote Highlight UI | received "failed highlight", which means the highlighted element was not found on some player screens`)
      onSocketMessageFailedHighlight()
    }
  }
}
