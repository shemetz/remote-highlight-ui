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
    name: `${MODULE_ID}.settings.enable-highlighting-for-others.name`,
    hint: `${MODULE_ID}.settings.enable-highlighting-for-others.hint`,
    scope: 'client',
    config: true,
    type: Boolean,
    default: true,
    onChange: enableHighlighting
  })
  game.settings.register(MODULE_ID, 'enable-receiving-highlights', {
    name: `${MODULE_ID}.settings.enable-receiving-highlights.name`,
    hint: `${MODULE_ID}.settings.enable-receiving-highlights.hint`,
    scope: 'client',
    config: true,
    type: Boolean,
    default: true
  })
  game.settings.register(MODULE_ID, 'keybinding-modifiers', {
    name: `${MODULE_ID}.settings.keybinding-modifiers.name`,
    hint: `${MODULE_ID}.settings.keybinding-modifiers.hint`,
    scope: 'client',
    config: true,
    type: String,
    default: '["Control"]',
    choices: {
      '["Control"]': `${MODULE_ID}.settings.keybinding-modifiers.choices.control`,
      '["Control","Shift"]': `${MODULE_ID}.settings.keybinding-modifiers.choices.control+shift`,
      '["Shift"]': `${MODULE_ID}.settings.keybinding-modifiers.choices.shift`,
    },
  })
  game.settings.register(MODULE_ID, 'allow-when-right-clicking', {
    name: `${MODULE_ID}.settings.allow-when-right-clicking.name`,
    hint: `${MODULE_ID}.settings.allow-when-right-clicking.hint`,
    scope: 'client',
    config: true,
    type: Boolean,
    default: false,
  })

  game.settings.register(MODULE_ID, 'permission-level', {
	name: `${MODULE_ID}.settings.permission-level.name`,
	hint: `${MODULE_ID}.settings.permission-level.hint`,
	scope: 'world',
	config: true,
	type: String,
	default: 'gm',
	choices: {
	  gm: `${MODULE_ID}.settings.permission-level.choices.gm`,
	  trusted: `${MODULE_ID}.settings.permission-level.choices.trusted`,
	  player: `${MODULE_ID}.settings.permission-level.choices.player`
	},
	requiresReload: true
  });

  game.keybindings.register(MODULE_ID, 'activate-highlighter-tool', {
    name: `${MODULE_ID}.settings.activate-highlighter-tool.name`,
    hint: `${MODULE_ID}.settings.activate-highlighter-tool.hint`,
    editable: [],
    onDown: toggleHighlightTool,
  })
  game.keybindings.register(MODULE_ID, 'instant-highlight-keybind', {
    name: `${MODULE_ID}.settings.instant-highlight-keybind.name`,
    hint: `${MODULE_ID}.settings.instant-highlight-keybind.hint`,
    editable: [],
    onDown: instantHighlight,
  })
}
