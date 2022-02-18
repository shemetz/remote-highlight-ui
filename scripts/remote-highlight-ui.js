import { generateUniqueSelector } from './generate-unique-selector.js'

export const MODULE_ID = 'remote-highlight-ui'
const SECOND = 1000
const HIGHLIGHT_DURATION = 3 * SECOND
const EXTRA_HIGHLIGHT_FREQUENCY = 5

const shouldPreventThisParentElementFromHidingOverflow = (elem) => {
  return elem.matches('.main-controls')
    || elem.matches('.directory-item h3')
    || elem.matches('.directory-item h4')
    || elem.matches('.window-app .window-header')
    || elem.matches('.crb-style aside .sidebar') // pf2e char sheet sidebar
    || elem.matches('.crb-style .sheet-body .sheet-content .inventory .inventory-list, .crb-style .sheet-body .sheet-content .inventory .inventory .inventory-list, .crb-style .sheet-body .sheet-content .inventory>.tab:not(.inventory), .crb-style .sheet-body .sheet-content>.tab:not(.inventory)') // pf2e char sheet sidebar
    || elem.matches('#combat li.combatant .token-name') // combat tab
    || elem.matches('.pf2e.sheet .sheet-body') // pf2e item sheet and such
    || elem.matches('.pf2e.item.sheet form>article') // same
    || elem.matches('.dice-tooltip .dice-rolls') // dice roll (pf2e/dnd5e)
    || elem.matches('.dnd5e.sheet .items-list .item-name') // dnd5e inventory
    || elem.matches('.tidy5e.sheet.actor .items-list .item .item-name') // tidy5e
    || elem.matches('.tidy5e.sheet.actor .sheet-body') // same
    || elem.matches('.tidy5e.sheet.actor .portrait') // same
    || elem.matches('.tidy5e.sheet.actor #item-info-container') // same
    || elem.matches('.tidy5e.sheet.actor .exhaustion-wrap') // same
}

let $currHighlitElement = null
let flipExtraHighlightTimeout = null

const addHighlight = ($element) => {
  if ($currHighlitElement) {
    // in case another highlight is already active
    removeHighlight()
  }
  $currHighlitElement = $element
  $currHighlitElement.addClass('rhi-highlighted')
  if ($currHighlitElement.css('position') !== 'absolute') {
    $currHighlitElement.addClass('rhi-highlighted-position-relative')
  }
  $currHighlitElement.parents().each((i, elem) => {
    const $elem = $(elem)
    $elem.addClass('rhi-highlighted-parent-front')
    if (shouldPreventThisParentElementFromHidingOverflow(elem)) {
      $elem.addClass('rhi-highlighted-parent-hidden')
    }
  })
  // switch to that tab if needed
  const parentTab = $currHighlitElement.parents()
    .filter((i, e) => e.matches('.tab.sidebar-tab'))[0]
  if (parentTab) {
    const currentlyActiveTab = $('.tab.sidebar-tab.active')[0]
    if (currentlyActiveTab.id !== parentTab.id) {
      ui.sidebar.tabs[parentTab.id].activate();
    }
  }
  // scroll into view
  $currHighlitElement[0].scrollIntoViewIfNeeded()

  // basic animation
  const flipExtraHighlight = () => {
    if (!$currHighlitElement) return
    $currHighlitElement.toggleClass('rhi-highlighted-extra')
    flipExtraHighlightTimeout = setTimeout(flipExtraHighlight, HIGHLIGHT_DURATION / EXTRA_HIGHLIGHT_FREQUENCY)
  }
  flipExtraHighlight()
}

const removeHighlight = () => {
  if ($currHighlitElement) {
    $currHighlitElement.removeClass('rhi-highlighted')
    $currHighlitElement.removeClass('rhi-highlighted-position-relative')
    $currHighlitElement.removeClass('rhi-highlighted-extra')
    $currHighlitElement.parents().each((i, elem) => {
      const $elem = $(elem)
      $elem.removeClass('rhi-highlighted-parent-hidden')
      $elem.removeClass('rhi-highlighted-parent-front')
    })
    clearTimeout(flipExtraHighlightTimeout)
    flipExtraHighlightTimeout = null
    $currHighlitElement = null
  }
}

let removeHighlightTimeout = null

/**
 * Highlight the "End Turn" button for 1 second, for the current player
 */
export const onSocketMessageHighlightSomething = (message) => {
  if (removeHighlightTimeout) {
    clearTimeout(removeHighlightTimeout)
    removeHighlightTimeout = null
  }
  const $element = $(`${message.selector}`)
  if ($element && $element[0]) {
    addHighlight($element)
    removeHighlightTimeout = setTimeout(() => {
      removeHighlight()
    }, HIGHLIGHT_DURATION)
  } else {
    removeHighlight()
  }
}

const areKeybindingModifierKeysFitting = (modifiers) => {
  const expectedModifiers = JSON.parse(game.settings.get(MODULE_ID, 'keybinding-modifiers'))
  return expectedModifiers.every((modifier) => modifiers.includes(modifier)) &&
    modifiers.length === expectedModifiers.length
}

/**
 * message should have a 'selector' field, and a potential 'playerId' field
 */
export const emitHighlight = (message) => {
  const msg = {
    type: 'HIGHLIGHT_ELEMENT',
    ...message
  }
  game.socket.emit(`module.${MODULE_ID}`, msg)
  onSocketMessageHighlightSomething(msg)
}

let debounceEmitHighlightTimeout = null
const debounceEmitHighlight = (elem) => {
  if (debounceEmitHighlightTimeout) {
    clearTimeout(debounceEmitHighlightTimeout)
  }
  debounceEmitHighlightTimeout = setTimeout(() => {
    debounceEmitHighlightTimeout = null
    const selector = generateUniqueSelector(elem)
    emitHighlight({ selector })
  }, 100)
}

/**
 * On aux clicking an element while holding Control (but not right-clicking):
 *
 * Emit remote-highlight-UI message, and also do it locally, and also refresh listeners for the future
 */
const onElementAuxClick = (event) => {
  if (event.button === 2 && !game.settings.get(MODULE_ID, 'allow-when-right-clicking')) return
  const heldModifiers = KeyboardManager.getKeyboardEventContext(event).modifiers
  if (!areKeybindingModifierKeysFitting(heldModifiers)) return
  const elem = event.currentTarget
  event.stopPropagation()
  event.preventDefault()
  debounceEmitHighlight(elem)
  debounceRefreshHighlightListeners()
}

export const refreshRemoteHighlightListeners = () => {
  // EVERY element on the page can be highlighted (O_o) so we'll try to not call this function super often
  $('*').each((i, elem) => {
    // avoid if it's stuff that really shouldn't need highlighting
    if (['HTML', 'BODY', 'CANVAS', 'SECTION'].includes(elem.tagName)) return
    elem.removeEventListener('auxclick', onElementAuxClick)
    elem.addEventListener('auxclick', onElementAuxClick)
  })
}

let debounceRefreshTimeout = null
const debounceRefreshHighlightListeners = () => {
  if (debounceRefreshTimeout) {
    clearTimeout(debounceRefreshTimeout)
  }
  debounceRefreshTimeout = setTimeout(() => {
    debounceRefreshTimeout = null
    refreshRemoteHighlightListeners()
  }, 100)
}

let didLibwrapperRegister = false
export const hookRemoteHighlight = (enabled) => {
  if (enabled) Hooks.on('ready', debounceRefreshHighlightListeners)
  else Hooks.off('ready', debounceRefreshHighlightListeners)

  if (enabled) {
    libWrapper.register(MODULE_ID, 'FormApplication.prototype._render', (wrapped, ...args) => {
      removeHighlight()
      return wrapped(...args)
    }, 'WRAPPER')
    libWrapper.register(MODULE_ID, 'Application.prototype._render', (wrapped, ...args) => {
      const returned = wrapped(...args)
      setTimeout(debounceRefreshHighlightListeners, 0.5 * SECOND)
      return returned
    }, 'WRAPPER')
    didLibwrapperRegister = true
  } else if (didLibwrapperRegister) {
    libWrapper.unregister(MODULE_ID, 'FormApplication.prototype._render')
    libWrapper.unregister(MODULE_ID, 'Application.prototype._render')
    didLibwrapperRegister = false
  }
}
