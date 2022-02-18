import { onSocketMessageHighlightSomething } from './remote-highlight-ui.js'
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
  }
}
