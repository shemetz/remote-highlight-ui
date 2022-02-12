import { MODULE_ID, onSocketMessageHighlightSomething } from './remote-highlight-ui.js'

Hooks.on('ready', () => {
  game.socket.on(`module.${MODULE_ID}`, onSocketMessage)
})

export const onSocketMessage = (receivedMessage) => {
  if (receivedMessage.type === 'HIGHLIGHT_ELEMENT') {
    onSocketMessageHighlightSomething(receivedMessage)
  }
}
