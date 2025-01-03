import { enableHighlighting } from './hooks.js'
import { toggleHighlightTool, instantHighlight } from './remote-highlight-ui.js'

export const MODULE_ID = 'remote-highlight-ui'
export const SECOND = 1000
export const HIGHLIGHT_DURATION = 3 * SECOND
export const TRANSITION_DURATION = 0.3 * SECOND
export const FAILED_HIGHLIGHT_DURATION = 0.5 * SECOND
export const EXTRA_HIGHLIGHT_FREQUENCY = 5
export const HIGHLIGHT_PADDING = 10

export const registerSettings = () => {
  game.settings.register(MODULE_ID, 'enable-highlighting-for-others', {
    name: `Enable highlighting elements for other players`,
    hint: `When holding Control and middle-clicking / right-clicking / aux-clicking on a UI element, it will be highlighted for every other player.`,
    scope: 'client',
    config: true,
    type: Boolean,
    default: true,
    onChange: enableHighlighting
  })
  game.settings.register(MODULE_ID, 'enable-receiving-highlights', {
    name: `Enable receiving highlights from other players`,
    hint: `If you disable this, others won't be able to send highlights to you.`,
    scope: 'client',
    config: true,
    type: Boolean,
    default: true
  })
  game.settings.register(MODULE_ID, 'keybinding-modifiers', {
    name: `Modifier keys`,
    hint: `Choose modifier keys required for the highlight to trigger on a middle-click (default: Control).`,
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
  game.settings.register(MODULE_ID, 'allow-when-right-clicking', {
    name: `Allow when right-clicking`,
    hint: `Should this also trigger on e.g. Ctrl+Right-click?  (default false)`,
    scope: 'client',
    config: true,
    type: Boolean,
    default: false,
  })

  game.keybindings.register(MODULE_ID, 'activate-highlighter-tool', {
    name: "Activate highlighter tool",
    hint: "After activating, click on any UI element to highlight it for everyone.  Requires 'Enable highlighting' setting to be enabled.",
    editable: [],
    onDown: toggleHighlightTool,
  })
  game.keybindings.register(MODULE_ID, 'instant-highlight-keybind', {
    name: "Instant highlight keybind",
    hint: "Press this and the UI element under your cursor will be highlighted for everyone.  Requires 'Enable highlighting' setting to be enabled.",
    editable: [],
    onDown: instantHighlight,
  })
}
