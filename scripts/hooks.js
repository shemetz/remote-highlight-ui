import { hookRemoteHighlight, MODULE_ID } from './remote-highlight-ui.js'

Hooks.on('init', () => {
  game.settings.register(MODULE_ID, 'enable-for-this-user', {
    name: `Enable for this user`,
    hint: `When holding Control and middle-clicking / right-clicking / aux-clicking on a UI element, it will be highlighted for every other player.`,
    scope: 'client',
    config: true,
    type: Boolean,
    default: false,
    onChange: hookRemoteHighlight
  })
})

Hooks.on('ready', () => {
  hookRemoteHighlight(game.settings.get(MODULE_ID, 'enable-for-this-user'))
})
