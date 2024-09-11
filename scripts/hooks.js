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
  registerConstantLibWrapperWraps()
  initOverlay()
})

Hooks.on('ready', () => {
  enableHighlighting(game.settings.get(MODULE_ID, 'enable-highlighting-for-others'))
})

Hooks.on('renderPlayerList', () => {
  onRenderPlayerList()
})

Hooks.on('getSceneControlButtons', controls => {
  const keybinding = game.keybindings.bindings.get('remote-highlight-ui.activate-highlighter-tool')[0].key
  const keybindShort = keybinding.replace("Key", "")
  const tokenToolbar = controls.find(c => c.name === 'token').tools
  tokenToolbar.splice(tokenToolbar.length - 1, 0, {
    name: 'RemoteHighlight',
    title: `Remote Highlight (${keybindShort})`,
    icon: 'fas fa-highlighter',
    button: true,
    toggle: true,
    visible: game.settings.get(MODULE_ID, 'enable-highlighting-for-others'),
    active: false,
    onClick: toggleHighlightTool,
  })
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

  ui.controls.controls.find(c => c.name === "token").tools.find(t => t.name === "RemoteHighlight").visible = enabled
  ui.controls.render()
}

const registerConstantLibWrapperWraps = () => {
  libWrapper.register(MODULE_ID, 'PlayerList.prototype._getUserContextOptions', (wrapped, ...args) => {
    return wrapped(...args).concat(additionalPlayerListContextOptions())
  }, 'WRAPPER')
}
