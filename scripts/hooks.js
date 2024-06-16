import {
  initOverlay,
  additionalPlayerListContextOptions,
  addRemoteHighlightListener,
  removeRemoteHighlightListener,
  onRenderPlayerList,
  stopHighlight,
} from './remote-highlight-ui.js'
import { MODULE_ID, registerSettings } from './settings.js'

Hooks.on('init', () => {
  registerSettings()
  registerConstantLibWrapperWraps()
  initOverlay()
})

Hooks.on('ready', () => {
  hookRemoteHighlight(game.settings.get(MODULE_ID, 'enable-highlighting-for-others'))
})

Hooks.on('renderPlayerList', () => {
  onRenderPlayerList()
})

let didLibWrapperRegister = false
export const hookRemoteHighlight = (enabled) => {
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
}

const registerConstantLibWrapperWraps = () => {
  libWrapper.register(MODULE_ID, 'PlayerList.prototype._getUserContextOptions', (wrapped, ...args) => {
    return wrapped(...args).concat(additionalPlayerListContextOptions())
  }, 'WRAPPER')
}
