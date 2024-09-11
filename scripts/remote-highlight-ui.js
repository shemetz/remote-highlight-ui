import { generateUniqueSelector } from './generate-unique-selector.js'
import {
  EXTRA_HIGHLIGHT_FREQUENCY,
  FAILED_HIGHLIGHT_DURATION,
  TRANSITION_DURATION,
  HIGHLIGHT_DURATION,
  HIGHLIGHT_PADDING,
  MODULE_ID,
} from './settings.js'

let redBoxHighlightOverlayElement // after init, will always be defined
let userIdToOnlyHighlightFor = null
let $currHighlitElement = null
let orangeBoxPreviewOverlayElement = null // after init, will always be defined

let flipExtraHighlightTimeout = null
let stopHighlightTimeout = null
let resetOverlayTimeout = null

let isHighlightToolActive = false

export const initOverlay = () => {
  redBoxHighlightOverlayElement = document.createElement('div')
  redBoxHighlightOverlayElement.classList.add('rhui-overlay')
  document.body.appendChild(redBoxHighlightOverlayElement)

  orangeBoxPreviewOverlayElement = document.createElement('div')
  orangeBoxPreviewOverlayElement.classList.add('rhui-overlay')
  document.body.appendChild(orangeBoxPreviewOverlayElement)
}

export const toggleHighlightTool = () => {
  isHighlightToolActive = !isHighlightToolActive
  if (isHighlightToolActive) {
    orangeBoxPreviewOverlayElement.classList.add('rhui-preview')
  } else {
    orangeBoxPreviewOverlayElement.classList.remove('rhui-preview')
  }
}

const getFoundryTabOf = ($element) => {
  return $element?.parents().filter((i, e) => e.matches('.tab.sidebar-tab'))[0]?.dataset.tab
}

const getPf2eSheetTabOf = ($element) => {
  return $element?.parents().filter((i, e) => e.matches('.sheet-content .tab'))[0]?.dataset.tab
}

const addHighlight = ($element) => {
  if ($currHighlitElement) {
    // in case another highlight is already active
    stopHighlight(true)
  }
  $currHighlitElement = $element
  $(redBoxHighlightOverlayElement).removeClass('rhui-highlight-hole-failed')
  $(redBoxHighlightOverlayElement).removeClass('rhui-highlight-hole-extra')

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
  // pf2e sheet tab
  const pf2eSheetTab = getPf2eSheetTabOf($currHighlitElement)
  if (pf2eSheetTab) {
    const sheetId = $currHighlitElement.parents().filter((i, e) => e.matches('.app.sheet'))[0]?.id
    const actorId = sheetId.substring(sheetId.lastIndexOf('-') + 1)
    const sheet = game.actors.get(actorId).sheet
    const currentlyActiveTab = $('.sheet-navigation .active')[0]?.dataset.tab
    if (currentlyActiveTab !== pf2eSheetTab) {
      sheet.activateTab(pf2eSheetTab)
    }
  }

  // scroll into view (center element vertically), and when that's done, start highlight
  const scrollableParent = getScrollParent($currHighlitElement[0])
  if (!scrollableParent || scrollableParent === document.body || scrollableParent === document.documentElement) {
    // doesn't need any scrolling
    startHighlight()
  } else if ('onscrollend' in window && scrollableParent) {
    // scroll smoothly, and when done, start highlight.

    let didStartScrolling = false
    let noScrollTimeout
    const onScrollStart = () => {
      didStartScrolling = true
      clearTimeout(noScrollTimeout)
    }
    const onScrollEnd = () => startHighlight()
    scrollableParent.addEventListener('scroll', onScrollStart, { once: true })
    scrollableParent.addEventListener('scrollend', onScrollEnd, { once: true })
    // edge case:  if scrolling is not needed, this event will never fire, so we need a fallback
    noScrollTimeout = setTimeout(() => {
      if (!didStartScrolling) {
        startHighlight()
        scrollableParent.removeEventListener('scroll', onScrollStart)
        scrollableParent.removeEventListener('scrollend', onScrollEnd)
      }
    }, 50) // needs to be >31ms at least

    $currHighlitElement[0].scrollIntoView({ block: 'center', behavior: 'smooth' })
  } else {
    // fallback behavior:  scroll instantly and start highlight
    $currHighlitElement[0].scrollIntoView({ block: 'center', behavior: 'instant' })
    startHighlight()
  }
}

const getScrollParent = (node) => {
  const parents = (_node, ps) => {
    if (_node.parentNode === null) { return ps }
    return parents(_node.parentNode, ps.concat([_node]))
  }
  const style = (_node, prop) => getComputedStyle(_node, null).getPropertyValue(prop)
  const overflow = _node => style(_node, 'overflow') + style(_node, 'overflow-y') + style(_node, 'overflow-x')
  const scroll = _node => /(auto|scroll)/.test(overflow(_node))

  const ps = parents(node.parentNode, [])
  for (let i = 0; i < ps.length; i += 1) {
    if (scroll(ps[i])) {
      return ps[i]
    }
  }
  return document.scrollingElement || document.documentElement
}

const centerHighlightOnElement = (overlayElement, targetElement) => {
  const targetBoundingRect = targetElement.getBoundingClientRect()
  overlayElement.style.width = `${targetBoundingRect.width + HIGHLIGHT_PADDING}px`
  overlayElement.style.height = `${targetBoundingRect.height + HIGHLIGHT_PADDING}px`
  overlayElement.style.top = `${targetBoundingRect.top - (HIGHLIGHT_PADDING / 2)}px`
  overlayElement.style.left = `${targetBoundingRect.left - (HIGHLIGHT_PADDING / 2)}px`
}

const startHighlight = () => {
  // Fade out rest of screen, except rectangle around target element
  centerHighlightOnElement(redBoxHighlightOverlayElement, $currHighlitElement[0])
  redBoxHighlightOverlayElement.classList.add('rhui-highlight-hole-active')
  orangeBoxPreviewOverlayElement.classList.remove('rhui-preview')

  // basic animation
  const flipExtraHighlight = () => {
    if (!$currHighlitElement) return
    $(redBoxHighlightOverlayElement).toggleClass('rhui-highlight-hole-extra')
    clearTimeout(flipExtraHighlightTimeout)
    flipExtraHighlightTimeout = setTimeout(flipExtraHighlight, HIGHLIGHT_DURATION / EXTRA_HIGHLIGHT_FREQUENCY)
  }
  flipExtraHighlight()
}

export const stopHighlight = (addingAnother) => {
  clearTimeout(flipExtraHighlightTimeout)
  $currHighlitElement = null
  if (redBoxHighlightOverlayElement && !addingAnother) {
    $(redBoxHighlightOverlayElement).removeClass('rhui-highlight-hole-active')
    $(redBoxHighlightOverlayElement).removeClass('rhui-highlight-hole-failed')
    $(redBoxHighlightOverlayElement).removeClass('rhui-highlight-hole-extra')
    resetOverlayTimeout = setTimeout(() => {
      centerHighlightOnElement(redBoxHighlightOverlayElement, document.body)
    }, TRANSITION_DURATION + 50)
  }
}

/**
 * Highlight the "End Turn" button for 1 second, for the current player
 */
export const onSocketMessageHighlightSomething = (message) => {
  if (!game.settings.get(MODULE_ID, 'enable-receiving-highlights')) {
    return
  }
  clearTimeout(stopHighlightTimeout)
  clearTimeout(resetOverlayTimeout)
  const $element = $(`${message.selector}`)
  const boundingRect = $element[0]?.getBoundingClientRect()
  const foundryTab = getFoundryTabOf($element)
  const pf2eSheetTab = getPf2eSheetTabOf($element)
  const isRenderedSomewhere = boundingRect?.width > 0 || boundingRect?.height > 0 || !!foundryTab || !!pf2eSheetTab
  if ($element && $element[0] && isRenderedSomewhere) {
    addHighlight($element)
    stopHighlightTimeout = setTimeout(() => {
      stopHighlight(false)
    }, HIGHLIGHT_DURATION)
  } else {
    stopHighlight(false)
    // failed to find selector!
    emitFailedHighlight()
  }
}

export const onSocketMessageFailedHighlight = () => {
  if ($currHighlitElement) {
    $(redBoxHighlightOverlayElement).removeClass('rhui-highlight-hole-extra')
    clearTimeout(flipExtraHighlightTimeout)
    clearTimeout(stopHighlightTimeout)
    $(redBoxHighlightOverlayElement).addClass('rhui-highlight-hole-failed')
    stopHighlightTimeout = setTimeout(() => {
      stopHighlight(false)
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
        return game.settings.get(MODULE_ID, 'enable-highlighting-for-others')
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
        return game.settings.get(MODULE_ID, 'enable-highlighting-for-others')
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
  $(`ol#player-list > li`).removeClass('rhui-only-highlight-for-this-user')
  // bold current
  if (userIdToOnlyHighlightFor) {
    $(`ol#player-list > li[data-user-id="${userIdToOnlyHighlightFor}"]`).addClass('rhui-only-highlight-for-this-user')
  }
}

Hooks.on('getSceneControlButtons', controls => {
  if (!game.settings.get(MODULE_ID, 'enable-highlighting-for-others')) return

  const tokenToolbar = controls.find(c => c.name === 'token').tools
  tokenToolbar.splice(tokenToolbar.length - 1, 0, {
    name: 'RemoteHighlight',
    title: 'Remote Highlight',
    icon: 'fas fa-highlighter',
    button: true,
    toggle: true,
    active: isHighlightToolActive,
    onClick: toggleHighlightTool,
  })
})

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
  clearTimeout(debounceEmitHighlightTimeout)
  debounceEmitHighlightTimeout = setTimeout(() => {
    debounceEmitHighlightTimeout = null
    const selector = generateUniqueSelector(elem)
    emitHighlight({ selector })
  }, 100)
}

/**
 * Emit remote-highlight-UI message, and also do it locally, and also refresh listeners for the future
 */
const onSuccessfulHighlightClick = (event) => {
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

const onAuxClick = (event) => {
  if (event.button === 2 && !game.settings.get(MODULE_ID, 'allow-when-right-clicking')) return
  const heldModifiers = KeyboardManager.getKeyboardEventContext(event).modifiers
  if (!areKeybindingModifierKeysFitting(heldModifiers)) return

  onSuccessfulHighlightClick(event)
}

const onClick = (event) => {
  // 0 = left click
  if (event.button !== 0) return
  if (!isHighlightToolActive) return

  toggleHighlightTool()
  const highlightTool = ui.controls.controls.find(c => c.name === 'token').tools.find(t => t.name === 'RemoteHighlight')
  highlightTool.active = false
  ui.controls.render()

  onSuccessfulHighlightClick(event)
}

/** Draw highlighter preview over hovered element */
const onMouseMove = (event) => {
  if (!isHighlightToolActive) return

  const elem = document.elementFromPoint(event.x, event.y)
  if (elem === null || elem === undefined) return

  // note that stopPropagation doesn't seem to help here, not even if I capture
  centerHighlightOnElement(orangeBoxPreviewOverlayElement, elem)
}

export const addRemoteHighlightListener = () => {
  document.body.addEventListener('auxclick', onAuxClick)
  document.body.addEventListener('click', onClick, { capture: true })
  document.body.addEventListener('mousemove', onMouseMove)
}
export const removeRemoteHighlightListener = () => {
  document.body.removeEventListener('auxclick', onAuxClick)
  document.body.removeEventListener('click', onClick, { capture: true })
}