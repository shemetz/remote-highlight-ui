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
  const tokenControls = controls.find(c => c.name === 'token');
  if (!tokenControls || !tokenControls.tools) {
  	console.warn(`[${MODULE_ID}] No token controls found`);
  	return;
  }
  
  const permissionLevel = game.settings.get(MODULE_ID, 'permission-level');
  const canSeeButton = () => {
	const user = game.user;
	switch (permissionLevel) {
	  case 'gm':
	    return user.isGM;
	  case 'trusted':
	    return user.isTrusted || user.isGM; // GM is always at the top
	  case 'player':
	    return true;
	  default:
	    return false;
	}
};
  
  const visible = canSeeButton() && game.settings.get(MODULE_ID, 'enable-highlighting-for-others');
  
  // 🐞 DEBUG LOGGING GOES HERE:
  console.log(`[${MODULE_ID}] permissionLevel: ${permissionLevel}`);
  console.log(`[${MODULE_ID}] isGM: ${game.user.isGM}, isTrusted: ${game.user.isTrusted}`);
  console.log(`[${MODULE_ID}] enable-highlighting-for-others: ${game.settings.get(MODULE_ID, 'enable-highlighting-for-others')}`);
  console.log(`[${MODULE_ID}] canSeeButton(): ${canSeeButton()}, final visible: ${visible}`);
  
  if (!visible) return;
  
  tokenControls.tools.push({
  	name: 'RemoteHighlight',
  	title: game.i18n.localize(`${MODULE_ID}.tokenToolbar.title`),
  	icon: 'fas fa-highlighter',
  	button: true,
  	toggle: true,
  	visible,
  	active: false,
  	onClick: toggleHighlightTool,
  });
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
  
  // ✅ SAFELY update tool visibility
  const tokenControls = ui.controls?.controls?.find(c => c.name === 'token');
  const highlightTool = tokenControls?.tools?.find(t => t.name === 'RemoteHighlight');
  if (highlightTool) {
  	highlightTool.visible = enabled;
  	ui.controls.render();
  }
};
