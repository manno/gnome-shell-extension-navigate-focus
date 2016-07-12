// journalctl -f SYSLOG_IDENTIFIER=org.gnome.Shell.desktop
//
// vim: ts=4 sw=4
// jshint esversion: 6
//
const ExtensionUtils = imports.misc.extensionUtils;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const Lang = imports.lang;
const Main = imports.ui.main;
const Meta = imports.gi.Meta;
const St = imports.gi.St;
const Wnck = imports.gi.Wnck;
const Shell = imports.gi.Shell;

const Extension = new Lang.Class({
    Name: 'Extension',

    _init: function() {
        global.log("DEBUG: NavigateFocus enabled");
        this._setKeybinding();
    },

    focusLeft: function() {
        this._focusWindow(this._sortedWindowListLeftToRight());
    },

    focusRight: function() {
        this._focusWindow(this._sortedWindowListRightToLeft());
    },

    focusUp: function() {
        this._focusWindow(this._sortedWindowListTopToBottom());
    },

    focusDown: function() {
        this._focusWindow(this._sortedWindowListBottomToTop());
    },

    _focusWindow: function(windowList) {
        let focusWindow = global.display.focus_window;
        let cur = windowList.indexOf(focusWindow);
        if (cur - 1 < 0) {
            return;
        }
        let newWindow = windowList[cur - 1];
        if (newWindow !== null) {
            global.log("DEBUG: NavigateFocus found window");
            this._debugWindow(newWindow);
            newWindow.activate(global.get_current_time());
        }
    },

    _sortedWindowListLeftToRight: function() {
        return this._buildWindowList().sort(function(a, b) {
            return a.get_frame_rect().x - b.get_frame_rect().x;
        });
    },

    _sortedWindowListRightToLeft: function() {
        return this._buildWindowList().sort(function(b, a) {
            return a.get_frame_rect().x - b.get_frame_rect().x;
        });
    },

    _sortedWindowListBottomToTop: function() {
        return this._buildWindowList().sort(function(b, a) {
            return a.get_frame_rect().y - b.get_frame_rect().y;
        });
    },

    _sortedWindowListTopToBottom: function() {
        return this._buildWindowList().sort(function(a, b) {
            return a.get_frame_rect().y - b.get_frame_rect().y;
        });
    },

    _buildWindowList: function() {
        let monitor = Main.layoutManager.primaryMonitor;
        let workspace = global.screen.get_active_workspace();
        let windows = global.display.get_tab_list(Meta.TabList.NORMAL, workspace);
        return windows.filter(Lang.bind(this, function(window) {
            //this._debugWindow(window);
            return !window.is_hidden();
        }));
    },

    _debugWindow: function(window) {
        global.log("DEBUG: NavigateFocus window: ",
                   window.get_frame_rect().x,
                   window.get_frame_rect().y,
                   window.is_hidden(),
                   window.get_title()
                  );
    },

    _setKeybinding: function() {
        Main.wm.setCustomKeybindingHandler("toggle-tiled-right",
                                           Shell.ActionMode.NORMAL,
                                           Lang.bind(this, function() {
                                               this.focusRight();
                                           }));
        Main.wm.setCustomKeybindingHandler("toggle-tiled-left",
                                           Shell.ActionMode.NORMAL,
                                           Lang.bind(this, function() {
                                               this.focusLeft();
                                           }));
        Main.wm.setCustomKeybindingHandler("maximize",
                                           Shell.ActionMode.NORMAL,
                                           Lang.bind(this, function() {
                                               this.focusUp();
                                           }));
        Main.wm.setCustomKeybindingHandler("unmaximize",
                                           Shell.ActionMode.NORMAL,
                                           Lang.bind(this, function() {
                                               this.focusDown();
                                           }));
    },

    destroy: function() {
        // restore keybindings?
        Main.wm.removeKeybinding('toggle-tiled-right');
        Main.wm.removeKeybinding('toggle-tiled-left');
        Main.wm.removeKeybinding('maximize');
        Main.wm.removeKeybinding('unmaximize');
        global.log("DEBUG: NavigateFocus destroyed");
    }
});

function init() {
}

let _extension;

function enable() {
    _extension = new Extension();
}

function disable() {
    _extension.destroy();
    _extension = null;
}
