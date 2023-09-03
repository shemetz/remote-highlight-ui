import {
  additionalPlayerListContextOptions,
  addRemoteHighlightListener,
  removeRemoteHighlightListener,
  onRenderPlayerList,
  removeHighlight,
} from './remote-highlight-ui.js'
import { MODULE_ID, registerSettings, SECOND } from './settings.js'

Hooks.on('init', () => {
  registerSettings()
  registerConstantLibWrapperWraps()
})

Hooks.on('ready', () => {
  hookRemoteHighlight(game.settings.get(MODULE_ID, 'enable-for-this-user'))
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
      removeHighlight()
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
