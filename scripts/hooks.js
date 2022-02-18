import {
  additionalPlayerListContextOptions,
  debounceRefreshHighlightListeners, onRenderPlayerList, removeHighlight,
  removeRemoteHighlightListeners
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
  if (enabled) debounceRefreshHighlightListeners()
  else removeRemoteHighlightListeners()

  if (enabled && !didLibWrapperRegister) {
    libWrapper.register(MODULE_ID, 'FormApplication.prototype._render', (wrapped, ...args) => {
      removeHighlight()
      return wrapped(...args)
    }, 'WRAPPER')
    libWrapper.register(MODULE_ID, 'Application.prototype._render', (wrapped, ...args) => {
      const returned = wrapped(...args)
      setTimeout(debounceRefreshHighlightListeners, 0.5 * SECOND)
      return returned
    }, 'WRAPPER')
    didLibWrapperRegister = true
  } else if (didLibWrapperRegister) {
    libWrapper.unregister(MODULE_ID, 'FormApplication.prototype._render')
    libWrapper.unregister(MODULE_ID, 'Application.prototype._render')
    didLibWrapperRegister = false
  }
}

const registerConstantLibWrapperWraps = () => {
  libWrapper.register(MODULE_ID, 'PlayerList.prototype._getUserContextOptions', (wrapped, ...args) => {
    return wrapped(...args).concat(additionalPlayerListContextOptions())
  }, 'WRAPPER')
}
