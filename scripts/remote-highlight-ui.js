import { generateUniqueSelector } from './generate-unique-selector.js'
import {
  EXTRA_HIGHLIGHT_FREQUENCY,
  FAILED_HIGHLIGHT_DURATION,
  HIGHLIGHT_DURATION,
  HIGHLIGHT_PADDING,
  MODULE_ID
} from './settings.js'

let userIdToOnlyHighlightFor = null

let $currHighlitElement = null
let flipExtraHighlightTimeout = null
let darkOverlayWithHoleElement = null

const addHighlight = ($element) => {
  if ($currHighlitElement) {
    // in case another highlight is already active
    removeHighlight(true)
  }
  // Fade out rest of screen
  const targetElement = $element[0]
  const targetBoundingRect = targetElement.getBoundingClientRect()
  darkOverlayWithHoleElement = document.createElement('div')
  darkOverlayWithHoleElement.classList.add('rhi-highlight-hole')
  darkOverlayWithHoleElement.style.width = `${targetBoundingRect.width + HIGHLIGHT_PADDING}px`
  darkOverlayWithHoleElement.style.height = `${targetBoundingRect.height + HIGHLIGHT_PADDING}px`
  darkOverlayWithHoleElement.style.top = `${targetBoundingRect.top - (HIGHLIGHT_PADDING / 2)}px`
  darkOverlayWithHoleElement.style.left = `${targetBoundingRect.left - (HIGHLIGHT_PADDING / 2)}px`
  document.body.appendChild(darkOverlayWithHoleElement)

  $currHighlitElement = $element

  // switch to that tab if needed
  const parentTab = $currHighlitElement.parents()
    .filter((i, e) => e.matches('.tab.sidebar-tab'))[0]
  if (parentTab) {
    const currentlyActiveTab = $('.tab.sidebar-tab.active')[0]
    if (currentlyActiveTab.id !== parentTab.id) {
      ui.sidebar.tabs[parentTab.id].activate()
    }
  }
  // scroll into view
  $currHighlitElement[0].scrollIntoViewIfNeeded()

  // basic animation
  const flipExtraHighlight = () => {
    if (!$currHighlitElement) return
    $(darkOverlayWithHoleElement).toggleClass('rhi-highlight-hole-extra')
    flipExtraHighlightTimeout = setTimeout(flipExtraHighlight, HIGHLIGHT_DURATION / EXTRA_HIGHLIGHT_FREQUENCY)
  }
  flipExtraHighlight()
}

export const removeHighlight = (addingAnother) => {
  if ($currHighlitElement) {
    clearTimeout(flipExtraHighlightTimeout)
    flipExtraHighlightTimeout = null
    $currHighlitElement = null
  }
  if (darkOverlayWithHoleElement) {
    const elementToRemove = darkOverlayWithHoleElement
    darkOverlayWithHoleElement = null
    if (!addingAnother) {
      $(elementToRemove).toggleClass('rhi-highlight-hole-stop')
      setTimeout(() => {
        elementToRemove.remove()
      }, 500)
    } else {
      elementToRemove.remove()
    }
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
      removeHighlight(false)
    }, HIGHLIGHT_DURATION)
  } else {
    removeHighlight(true)
    // failed to find selector!
    emitFailedHighlight()
  }
}

export const onSocketMessageFailedHighlight = () => {
  if ($currHighlitElement) {
    $(darkOverlayWithHoleElement).toggleClass('rhi-highlight-hole-failed')
    clearTimeout(flipExtraHighlightTimeout)
    flipExtraHighlightTimeout = null
    clearTimeout(removeHighlightTimeout)
    removeHighlightTimeout = null
    removeHighlightTimeout = setTimeout(() => {
      removeHighlight(false)
    }, FAILED_HIGHLIGHT_DURATION)
  }
}

const areKeybindingModifierKeysFitting = (modifiers) => {
  const expectedModifiers = JSON.parse(game.settings.get(MODULE_ID, 'keybinding-modifiers'))
  return expectedModifiers.every((modifier) => modifiers.includes(modifier)) &&
    modifiers.length === expectedModifiers.length
}

export const additionalPlayerListContextOptions = () => {
  return [
    {
      name: 'Highlight UI only for this user',
      icon: '<i class="fas fa-bullseye"></i>',
      condition: li => {
        const thatUserId = li[0].dataset.userId
        return game.settings.get(MODULE_ID, 'enable-for-this-user')
          && userIdToOnlyHighlightFor !== thatUserId
          && thatUserId !== game.user.id
      },
      callback: li => {
        userIdToOnlyHighlightFor = li[0].dataset.userId
        onRenderPlayerList()
      }
    },
    {
      name: 'Stop highlighting only for this user',
      icon: '<i class="fas fa-ban"></i>',
      condition: li => {
        return game.settings.get(MODULE_ID, 'enable-for-this-user')
          && userIdToOnlyHighlightFor === li[0].dataset.userId
      },
      callback: () => {
        userIdToOnlyHighlightFor = null
        onRenderPlayerList()
      }
    }]
}

export const onRenderPlayerList = () => {
  // unbold previous
  $(`ol#player-list > li`)
    .removeClass('rhi-only-highlight-for-this-user')
  // bold current
  if (userIdToOnlyHighlightFor) {
    $(`ol#player-list > li[data-user-id="${userIdToOnlyHighlightFor}"]`)
      .addClass('rhi-only-highlight-for-this-user')
  }
}

/**
 * message should have a 'selector' field, and a potential 'playerId' field
 */
export const emitHighlight = (message) => {
  const msg = {
    type: 'HIGHLIGHT_ELEMENT',
    ...message
  }
  if (userIdToOnlyHighlightFor) {
    msg.playerId = userIdToOnlyHighlightFor
  }
  game.socket.emit(`module.${MODULE_ID}`, msg)
  onSocketMessageHighlightSomething(msg)
}

/**
 * message should have a 'selector' field, and a potential 'playerId' field
 */
export const emitFailedHighlight = () => {
  const msg = {
    type: 'FAILED_HIGHLIGHT',
  }
  game.socket.emit(`module.${MODULE_ID}`, msg)
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

export const removeRemoteHighlightListeners = () => {
  $('*').each((i, elem) => {
    if (['HTML', 'BODY', 'CANVAS', 'SECTION'].includes(elem.tagName)) return
    elem.removeEventListener('auxclick', onElementAuxClick)
  })
}

let debounceRefreshTimeout = null
export const debounceRefreshHighlightListeners = () => {
  if (debounceRefreshTimeout) {
    clearTimeout(debounceRefreshTimeout)
  }
  debounceRefreshTimeout = setTimeout(() => {
    debounceRefreshTimeout = null
    refreshRemoteHighlightListeners()
  }, 100)
}
