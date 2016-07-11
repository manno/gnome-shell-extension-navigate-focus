// journalctl -f SYSLOG_IDENTIFIER=org.gnome.Shell.desktop
/* jshint esversion: 6 */
const ExtensionUtils = imports.misc.extensionUtils;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const Lang = imports.lang;
const Main = imports.ui.main;
const Meta = imports.gi.Meta;
const St = imports.gi.St;
const Wnck = imports.gi.Wnck;
const Shell = imports.gi.Shell;

function _showHello() {
  let monitor = Main.layoutManager.primaryMonitor;

  let focusWindow = global.display.focus_window;



  let aWindow = imports.gi.Wnck.Screen.get_default_screen().get_windows()[0];
  aWindow.get_stage.navigate_focus(null, Gtk.DirectionType.DOWN, false);
}

const Extension = new Lang.Class({
    Name: 'Extension',

    _init: function() {
        this._windowList = null;
        this._windowList = [];
        Main.layoutManager.connect('startup-complete',
                                   Lang.bind(this, this._setKeybinding));
    },

    enable: function() {
        global.log("NAVNAV inner enable");
    },

    focus_left: function() {
      // ./gnome-shell-extensions/extensions/screenshot-window-sizer/extension.js
        this._buildWindowList();
        let focusWindow = global.display.focus_window;
        // global.log(focus_window.title, focusWindow.get_frame_rect().x, focusWindow.get_frame_rect().y);
        // sort by x
        let windowList = this.sort_windowlist_by_x_asc();
        global.log(this._windowList);
        let cur = windowList.indexOf(focusWindow);
        if (cur - 1 < 0) {
            return;
        }
        let newWindow = windowList[cur - 1];
        global.log("NAVNAV found" + newWindow);
        if (newWindow !== null) {
            newWindow.activate(global.get_current_time());
        }
    },

    focus_right: function() {
    },

    focus_up: function() {
    },

    focus_down: function() {
    },

    sort_windowlist_by_x_asc: function() {
        return this._windowList.sort(function(a, b) { return a.get_frame_rect().x - b.get_frame_rect().x; });
    },

    sort_windowlist_by_x_desc: function() {
        return this._windowList.sort(function(b, a) { return a.get_frame_rect().x - b.get_frame_rect().x; });
    },

    sort_windowlist_by_y_asc: function() {
        return this._windowList.sort(function(a, b) { return a.get_frame_rect().y - b.get_frame_rect().y; });
    },

    sort_windowlist_by_y_desc: function() {
        return this._windowList.sort(function(b, a) { return a.get_frame_rect().y - b.get_frame_rect().y; });
    },

    _buildWindowList: function() {
        this._windowList = [];
        let monitor = Main.layoutManager.primaryMonitor;
        let workspace = global.screen.get_active_workspace();
        let windows = global.display.get_tab_list(Meta.TabList.NORMAL, workspace);
        this._windowList = windows.filter(Lang.bind(this, function(window) {
            return window.get_monitor() == monitor.index;
        }));

        // TODO multiple monitors, add x,y to individual windows x,y ?
        // TODO maybe there are absolute coords somewhere?
        // Main.layoutManager.monitors.forEach(Lang.bind(this, function(monitor) {
        //     if (monitor == Main.layoutManager.primaryMonitor) {
        //         this._windowList.push(window);
        //     }
        // }));
    },

    _setKeybinding: function() {
        Main.wm.setCustomKeybindingHandler("toggle-tiled-right",
                                           Shell.ActionMode.NORMAL,
                                           Lang.bind(this, function() {
                                               this.focus_right();
                                           }));
        Main.wm.setCustomKeybindingHandler("toggle-tiled-left",
                                           Shell.ActionMode.NORMAL,
                                           Lang.bind(this, function() {
                                               this.focus_left();
                                           }));
        Main.wm.setCustomKeybindingHandler("maximize",
                                           Shell.ActionMode.NORMAL,
                                           Lang.bind(this, function() {
                                               this.focus_up();
                                           }));
        Main.wm.setCustomKeybindingHandler("unmaximize",
                                           Shell.ActionMode.NORMAL,
                                           Lang.bind(this, function() {
                                               this.focus_down();
                                           }));
    },

    disable: function() {
        global.log("NAVNAV inner disable");
        if (!this._windowList)
            return;

        // TODO restore keybindings
        // Main.wm.setCustomKeybindingHandler('toggle-tiled-right',
                                           // Shell.ActionMode.NORMAL, {}
                                          // );

        this._windowList = null;
    }
});

function init() {
    global.log("NAVNAV loading");
    //return new Extension();
}

let _extension;

function enable() {
    _extension = new Extension();
}

function disable() {
    _extension.destroy();
    _extension = null;
}

