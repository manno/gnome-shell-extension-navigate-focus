// journalctl -f SYSLOG_IDENTIFIER=org.gnome.Shell.desktop
//
// vim: ts=4 sw=4
// jshint esversion: 6
//
const Gio = imports.gi.Gio;
const Lang = imports.lang;
const Main = imports.ui.main;
const Meta = imports.gi.Meta;
const St = imports.gi.St;
const Shell = imports.gi.Shell;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const Schema = Me.imports.schema;
const CustomSettings = Schema.getSettings();
const WmKeybindings = new Gio.Settings({ schema: "org.gnome.desktop.wm.keybindings" });
const MutterKeybindings = new Gio.Settings({ schema: "org.gnome.mutter.keybindings" });

const Extension = new Lang.Class({
    Name: 'Extension',

    _init: function() {
        global.log("DEBUG: NavigateFocus enabled");
        this._storeSettings();
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

    _storeSettings: function() {
        this._wmBindings = {
            'switch-to-workspace-1': [],
            'switch-to-workspace-2': [],
            'switch-to-workspace-3': [],
            'switch-to-workspace-4': [],
            'switch-to-workspace-5': [],
            'minimize': [],
            'maximize': []
        };
        this._mutterBindings = {
            'toggle-tiled-right': [],
            'toggle-tiled-left': []
        };
        this._storeSettingsFor(WmKeybindings, this._wmBindings);
        this._storeSettingsFor(MutterKeybindings, this._mutterBindings);
    },

    _storeSettingsFor: function(settings, bindings) {
        for(let name in bindings) {
            bindings[name] = settings.get_strv(name);
        }
    },

    _restoreSettingsFor: function(settings, bindings) {
        for(let name in bindings) {
            settings.set_strv(name, bindings[name]);
        }
    },

    _setKeybinding: function() {
        WmKeybindings.set_strv('switch-to-workspace-1', ['<Super>1']);
        WmKeybindings.set_strv('switch-to-workspace-2', ['<Super>2']);
        WmKeybindings.set_strv('switch-to-workspace-3', ['<Super>3']);
        WmKeybindings.set_strv('switch-to-workspace-4', ['<Super>4']);
        WmKeybindings.set_strv('switch-to-workspace-5', ['<Super>5']);
        WmKeybindings.set_strv('minimize', []);           // <Super>h
        WmKeybindings.set_strv('maximize', []);           // <Super>Up
        MutterKeybindings.set_strv('toggle-tiled-right', []); // <Super>Right
        MutterKeybindings.set_strv('toggle-tiled-left', []);  // <Super>Left

        this._addKeybinding("focus-right",
                            Lang.bind(this, function() { this.focusRight(); }));
        this._addKeybinding("focus-left",
                            Lang.bind(this, function() { this.focusLeft(); }));
        this._addKeybinding("focus-up",
                            Lang.bind(this, function() { this.focusUp(); }));
        this._addKeybinding("focus-down",
                            Lang.bind(this, function() { this.focusDown(); }));
    },

    _addKeybinding: function(key, handler) {
        Main.wm.addKeybinding(key, CustomSettings, Meta.KeyBindingFlags.NONE, Shell.ActionMode.NORMAL, handler);
    },

    destroy: function() {
        this._restoreSettingsFor(WmKeybindings, this._wmBindings);
        this._restoreSettingsFor(MutterKeybindings, this._mutterBindings);
        Main.wm.removeKeybinding('focus-right');
        Main.wm.removeKeybinding('focus-left');
        Main.wm.removeKeybinding('focus-up');
        Main.wm.removeKeybinding('focus-down');
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
