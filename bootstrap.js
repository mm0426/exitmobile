const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

var menuId;

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");

XPCOMUtils.defineLazyModuleGetter(this, "Sanitizer", "resource://gre/modules/Sanitizer.jsm");

function exitMobileRun(window) {

	// read preferences
	var prefs= Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService).getBranch("extensions.exitmobile.");
	
	var clearCookies = prefs.getBoolPref("clearcookies");
	var clearHistory = prefs.getBoolPref("clearhistory");


// found code to clear cookies and history from here --- http://mxr.mozilla.org/mozilla-central/source/mobile/android/chrome/content/browser.js
	
	if (clearCookies==true) {
		// delete cookies
		// will need to replace this command with a loop that steps through the list to check for exceptions in a future version
		Sanitizer.clearItem("cookies");
	}
	
	if (clearHistory==true) {
		// delete history
		Sanitizer.clearItem("history");					 
	}

	// close firefox window
	window.BrowserApp.quit();
}

// copied code template below from https://developer.mozilla.org/en-US/Add-ons/Firefox_for_Android/Initialization_and_Cleanup#template_code

function loadIntoWindow(window) {
  if (!window)
    return;
  menuId = window.NativeWindow.menu.add("Exit FF", null, function() { exitMobileRun(window); });
}

function unloadFromWindow(window) {
  if (!window)
    return;
  menuId = window.NativeWindow.menu.remove(menuId);
}

var windowListener = {
  onOpenWindow: function(aWindow) {
    // Wait for the window to finish loading
    let domWindow = aWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowInternal || Ci.nsIDOMWindow);
    domWindow.addEventListener("load", function onLoad() {
      domWindow.removeEventListener("load", onLoad, false);
      loadIntoWindow(domWindow);
    }, false);
  },
 
  onCloseWindow: function(aWindow) {},
  onWindowTitleChange: function(aWindow, aTitle) {}
};

function startup(aData, aReason) {
  let wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);

  // Load into any existing windows
  let windows = wm.getEnumerator("navigator:browser");
  while (windows.hasMoreElements()) {
    let domWindow = windows.getNext().QueryInterface(Ci.nsIDOMWindow);
    loadIntoWindow(domWindow);
  }

  // Load into any new windows
  wm.addListener(windowListener);
}

function shutdown(aData, aReason) {
  // When the application is shutting down we normally don't have to clean
  // up any UI changes made
  if (aReason == APP_SHUTDOWN)
    return;

  let wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);

  // Stop listening for new windows
  wm.removeListener(windowListener);

  // Unload from any existing windows
  let windows = wm.getEnumerator("navigator:browser");
  while (windows.hasMoreElements()) {
    let domWindow = windows.getNext().QueryInterface(Ci.nsIDOMWindow);
    unloadFromWindow(domWindow);
  }
}

function install(aData, aReason) {}
function uninstall(aData, aReason) {}