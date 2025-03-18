import {
  initOverlay,
  additionalPlayerListContextOptions,
  addRemoteHighlightListener,
  removeRemoteHighlightListener,
  onRenderPlayerList,
  stopHighlight, toggleHighlightTool,
} from './remote-highlight-ui.js'
import { MODULE_ID, registerSettings } from './settings.js'

Hooks.on('init', () => {
  registerSettings()
  initOverlay()
})

Hooks.on('ready', () => {
  enableHighlighting(game.settings.get(MODULE_ID, 'enable-highlighting-for-others'))
})

Hooks.on('renderPlayerList', () => {
  onRenderPlayerList()
})
Hooks.on('getUserContextOptions', (_players, contextOptions) => {
  contextOptions.push(...additionalPlayerListContextOptions())
})

Hooks.on('getSceneControlButtons', controls => {
  const keybinding = game.keybindings.bindings.get('remote-highlight-ui.activate-highlighter-tool')[0]?.key
  const instantKeybinding = game.keybindings.bindings.get('remote-highlight-ui.instant-highlight-keybind')[0]?.key
  const keybindParentheses1 = keybinding ? keybinding.replace('Key', '') : null
  const keybindParentheses2 = instantKeybinding ? instantKeybinding.replace('Key', '') : null
  const titleSuffix = (keybindParentheses1 && keybindParentheses2)
    ? ` (${keybindParentheses1} / ${keybindParentheses2})`
    : (keybindParentheses1 || keybindParentheses2)
      ? ` (${keybindParentheses1 || keybindParentheses2})`
      : ''
  const tokenToolbar = controls.tokens.tools
  tokenToolbar.remoteHighlight = {
    name: 'remoteHighlight',
    title: game.i18n.localize(`${MODULE_ID}.tokenToolbar.title`) + `${titleSuffix}`,
    icon: 'fas fa-highlighter',
    toggle: true,
    visible: game.settings.get(MODULE_ID, 'enable-highlighting-for-others'),
    active: false,
    onChange: toggleHighlightTool,
  }
})

let didLibWrapperRegister = false
export const enableHighlighting = (enabled) => {
  if (enabled) addRemoteHighlightListener()
  else removeRemoteHighlightListener()

  if (enabled && !didLibWrapperRegister) {
    libWrapper.register(MODULE_ID, 'FormApplication.prototype._render', (wrapped, ...args) => {
      stopHighlight()
      return wrapped(...args)
    }, 'WRAPPER')
    didLibWrapperRegister = true
  } else if (didLibWrapperRegister) {
    libWrapper.unregister(MODULE_ID, 'FormApplication.prototype._render')
    didLibWrapperRegister = false
  }

  ui.controls.controls.tokens.tools.remoteHighlight.visible = enabled
  ui.controls.render()
}
