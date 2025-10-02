import {
  initOverlay,
  additionalPlayerListContextOptions,
  addRemoteHighlightListener,
  removeRemoteHighlightListener,
  onRenderPlayerList,
  stopHighlight, toggleHighlightTool,
} from './remote-highlight-ui.js'
import { MODULE_ID, registerSettings } from './settings.js'

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
     
  const tokenControls = controls.tokens;
  console.log(`[${MODULE_ID}] controls.tokens:`, tokenControls);
     
  if (!tokenControls?.tools) {
    console.warn(`[${MODULE_ID}] Token controls not found or malformed`);
    return;
  }
     
  const permissionLevel = game.settings.get(MODULE_ID, 'permission-level');
  const enableHighlighting = game.settings.get(MODULE_ID, 'enable-highlighting-for-others');
     
  const canSeeButton = () => {
  	const user = game.user;
  	switch (permissionLevel) {
  	  case 'gm': return user.isGM;
  	  case 'trusted': return user.isTrusted || user.isGM;
  	  case 'player': return true;
  	  default: return false;
  	}
  };
     
  const visible = enableHighlighting && canSeeButton();
     
  const keybinding = game.keybindings.bindings.get(`${MODULE_ID}.activate-highlighter-tool`)?.[0]?.key;
  const instantKeybinding = game.keybindings.bindings.get(`${MODULE_ID}.instant-highlight-keybind`)?.[0]?.key;
  const key1 = keybinding?.replace('Key', '') ?? null;
  const key2 = instantKeybinding?.replace('Key', '') ?? null;
  const titleSuffix = (key1 && key2) ? ` (${key1} / ${key2})` : (key1 || key2) ? ` (${key1 || key2})` : '';
     
  tokenControls.tools.remoteHighlight = {
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
     
  // Safe visibility toggle for Foundry V13
  const tokenControls = ui.controls?.controls?.token;
  const highlightTool = tokenControls?.tools?.find(t => t.name === 'RemoteHighlight');
     
  if (highlightTool) {
  	const permissionLevel = game.settings.get(MODULE_ID, 'permission-level');
  	const canSeeButton = () => {
  	  const user = game.user;
  	  switch (permissionLevel) {
  	    case 'gm': return user.isGM;
  	    case 'trusted': return user.isTrusted || user.isGM;
  	    case 'player': return true;
  	    default: return false;
  	  }
  	};
     
  	highlightTool.visible = enabled && canSeeButton();
  	ui.controls.render();
  }
};
