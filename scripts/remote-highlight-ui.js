import { generateUniqueSelector } from './generate-unique-selector.js'
import {
  EXTRA_HIGHLIGHT_FREQUENCY,
  FAILED_HIGHLIGHT_DURATION,
  HIGHLIGHT_DURATION,
  HIGHLIGHT_PADDING,
  MODULE_ID,
} from './settings.js'

let userIdToOnlyHighlightFor = null

let $currHighlitElement = null
let flipExtraHighlightTimeout = null
let darkOverlayWithHoleElement = null

const getFoundryTabOf = ($element) => {
  return $element?.parents().filter((i, e) => e.matches('.tab.sidebar-tab'))[0]?.dataset.tab
}

const getPf2eTabOf = ($element) => {
  return $element?.parents().filter((i, e) => e.matches('.sheet-content .tab'))[0]?.dataset.tab
}

const addHighlight = ($element) => {
  if ($currHighlitElement) {
    // in case another highlight is already active
    removeHighlight(true)
  }
  $currHighlitElement = $element

  // switch to that tab if needed
  // foundry tab
  const foundryTab = getFoundryTabOf($currHighlitElement)
  if (foundryTab) {
    const currentlyActiveTab = $('.tab.sidebar-tab.active')[0]?.dataset.tab
    // normal ID doesn't work because of a core foundry bug, chat tab missing its id - so gotta use data-tab instead
    if (currentlyActiveTab !== foundryTab) {
      ui.sidebar.activateTab(foundryTab)
    }
  }
  // pf2e tab
  const pf2eTab = getPf2eTabOf($currHighlitElement)
  if (pf2eTab) {
    const sheetId = $currHighlitElement.parents().filter((i, e) => e.matches('.app.sheet'))[0]?.id
    const actorId = sheetId.substring(sheetId.lastIndexOf('-') + 1)
    const sheet = game.actors.get(actorId).sheet
    const currentlyActiveTab = $('.sheet-navigation .active')[0]?.dataset.tab
    if (currentlyActiveTab !== pf2eTab) {
      sheet.activateTab(pf2eTab)
    }
  }

  // scroll into view (center element vertically)
  $currHighlitElement[0].scrollIntoView({ block: 'center' })
  startHighlight()
}

const startHighlight = () => {
  // Fade out rest of screen
  const targetElement = $currHighlitElement[0]
  const targetBoundingRect = targetElement.getBoundingClientRect()
  darkOverlayWithHoleElement = document.createElement('div')
  darkOverlayWithHoleElement.classList.add('rhi-highlight-hole')
  darkOverlayWithHoleElement.style.width = `${targetBoundingRect.width + HIGHLIGHT_PADDING}px`
  darkOverlayWithHoleElement.style.height = `${targetBoundingRect.height + HIGHLIGHT_PADDING}px`
  darkOverlayWithHoleElement.style.top = `${targetBoundingRect.top - (HIGHLIGHT_PADDING / 2)}px`
  darkOverlayWithHoleElement.style.left = `${targetBoundingRect.left - (HIGHLIGHT_PADDING / 2)}px`
  document.body.appendChild(darkOverlayWithHoleElement)

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
  const boundingRect = $element[0]?.getBoundingClientRect()
  const foundryTab = getFoundryTabOf($element)
  const pf2eTab = getPf2eTabOf($element)
  const isRenderedSomewhere = boundingRect?.width > 0 || boundingRect?.height > 0 || !!foundryTab || !!pf2eTab
  if ($element && $element[0] && isRenderedSomewhere) {
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
      },
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
      },
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
    ...message,
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
const onAuxClick = (event) => {
  if (event.button === 2 && !game.settings.get(MODULE_ID, 'allow-when-right-clicking')) return
  const heldModifiers = KeyboardManager.getKeyboardEventContext(event).modifiers
  if (!areKeybindingModifierKeysFitting(heldModifiers)) return

  // ohmygosh this line makes things so much easier
  // the element under the cursor is found based on the cursor's screen position
  // - if no element, return.
  // - if multiple elements, this will pick the "topmost", probably.
  const elem = document.elementFromPoint(event.x, event.y)
  if (elem === null || elem === undefined) return

  event.stopPropagation()
  event.preventDefault()
  debounceEmitHighlight(elem)
}

export const addRemoteHighlightListener = () => {
  document.body.addEventListener('auxclick', onAuxClick)
}
export const removeRemoteHighlightListener = () => {
  document.body.removeEventListener('auxclick', onAuxClick)
}