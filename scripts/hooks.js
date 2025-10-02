import {
  initOverlay,
  additionalPlayerListContextOptions,
  addRemoteHighlightListener,
  removeRemoteHighlightListener,
  onRenderPlayerList,
  stopHighlight, toggleHighlightTool,
} from './remote-highlight-ui.js'
import { MODULE_ID, registerSettings } from './settings.js'

const canSeeButton = () => {
  const user = game.user;
  const permissionLevel = game.settings.get(MODULE_ID, 'permission-level');

  switch (permissionLevel) {
    case 'gm': return user.isGM;
    case 'trusted': return user.isTrusted || user.isGM;
    case 'player': return true;
    default: return true;
  }
};

Hooks.on('init', () => {
  registerSettings()
  initOverlay()
})

Hooks.on('ready', () => {
  enableHighlighting(game.settings.get(MODULE_ID, 'enable-highlighting-for-others'))
})

Hooks.on('renderPlayerList', () => {
  onRenderPlayerList()
})
Hooks.on('getUserContextOptions', (_players, contextOptions) => {
  contextOptions.push(...additionalPlayerListContextOptions())
})

Hooks.on('getSceneControlButtons', controls => {
  if (!controls.tokens?.tools) {
    console.warn(`[${MODULE_ID}] Token controls not found or malformed`);
    return;
  }
  const enableHighlighting = game.settings.get(MODULE_ID, 'enable-highlighting-for-others');
  const visible = enableHighlighting && canSeeButton();
  const keybinding = game.keybindings.bindings.get(`${MODULE_ID}.activate-highlighter-tool`)?.[0]?.key;
  const instantKeybinding = game.keybindings.bindings.get(`${MODULE_ID}.instant-highlight-keybind`)?.[0]?.key;
  const key1 = keybinding?.replace('Key', '') ?? null;
  const key2 = instantKeybinding?.replace('Key', '') ?? null;
  const titleSuffix = (key1 && key2) ? ` (${key1} / ${key2})` : (key1 || key2) ? ` (${key1 || key2})` : '';

  controls.tokens.tools.remoteHighlight = {
    name: 'remoteHighlight',
    title: game.i18n.localize(`${MODULE_ID}.tokenToolbar.title`) + titleSuffix,
    icon: 'fas fa-highlighter',
    toggle: true,
    visible,
    active: false,
    onChange: toggleHighlightTool
  };

  console.log(`[${MODULE_ID}] Added remoteHighlight button | visible: ${visible}`);
});

let didLibWrapperRegister = false
export const enableHighlighting = (enabled) => {
  if (enabled) addRemoteHighlightListener();
  else removeRemoteHighlightListener();

  if (enabled && !didLibWrapperRegister) {
  	libWrapper.register(
  	  MODULE_ID,
  	  'FormApplication.prototype._render',
  	  (wrapped, ...args) => {
  	    stopHighlight();
  	    return wrapped(...args);
  	  },
  	  'WRAPPER'
  	);
  	didLibWrapperRegister = true;
  } else if (!enabled && didLibWrapperRegister) {
    libWrapper.unregister(MODULE_ID, 'FormApplication.prototype._render');
    didLibWrapperRegister = false;
  }

  const highlightTool = ui.controls?.controls?.tokens?.tools.remoteHighlight
  if (highlightTool) {
  	highlightTool.visible = enabled && canSeeButton();
  	ui.controls.render();
  }
};
