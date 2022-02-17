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
  game.settings.register(MODULE_ID, 'keybinding-modifiers', {
    name: `Modifier Keys`,
    hint: `Choose modifier keys required for the highlight to trigger on a middle-click (default Ctrl).`,
    scope: 'client',
    config: true,
    type: String,
    default: '["Control"]',
    choices: {
      '["Control"]': 'Control',
      '["Control","Shift"]': 'Control + Shift',
      '["Shift"]': 'Shift',
    },
  })
})

Hooks.on('ready', () => {
  hookRemoteHighlight(game.settings.get(MODULE_ID, 'enable-for-this-user'))
})
