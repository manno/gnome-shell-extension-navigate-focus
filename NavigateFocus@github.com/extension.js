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
        let windowList = this._buildWindowList()
            .filter(Lang.bind(this, function(window) { return window.get_frame_rect().x < this._focusedWindowRect().x; }))
            .sort(this._sortWindowListLeftToRight.bind(this));
        this._focusWindow(windowList[0]);
    },

    focusRight: function() {
        let windowList = this._buildWindowList()
            .filter(Lang.bind(this, function(window) { return window.get_frame_rect().x > this._focusedWindowRect().x; }))
            .sort(this._sortWindowListRightToLeft.bind(this));
        this._focusWindow(windowList[0]);
    },

    focusUp: function() {
        let windowList = this._buildWindowList()
            .filter(Lang.bind(this, function(window) { return window.get_frame_rect().y < this._focusedWindowRect().y; }))
            .sort(this._sortWindowListTopToBottom.bind(this));
        this._focusWindow(windowList[0]);
    },

    focusDown: function() {
        let windowList = this._buildWindowList()
            .filter(Lang.bind(this, function(window) { return window.get_frame_rect().y > this._focusedWindowRect().y; }))
            .sort(this._sortWindowListBottomToTop.bind(this));
        this._focusWindow(windowList[0]);
    },

    _focusWindow: function(newWindow) {
        if (newWindow !== null && newWindow !== undefined) {
            // this._debugWindowChange(global.display.focus_window, newWindow);
            newWindow.activate(global.get_current_time());
        }
    },

    _focusedWindowRect: function() {
        return global.display.focus_window.get_frame_rect();
    },

    _weight_x: function(origin, point, weight) {
        let weighted = Math.abs(origin.x - point.x);
        if (weighted === 0) {
            weighted = 1;
        }
        return weighted * weight + Math.abs(origin.y - point.y);
    },

    _weight_y: function(origin, point, weight) {
        let weighted = Math.abs(origin.y - point.y);
        if (weighted === 0) {
            weighted = 1;
        }
        return Math.abs(origin.x - point.x) + weighted * weight;
    },

    _sortWindowListLeftToRight: function(a, b) {
        let _a = this._weight_y(a.get_frame_rect(), this._focusedWindowRect(), 10);
        let _b = this._weight_y(b.get_frame_rect(), this._focusedWindowRect(), 10);
        return _a - _b;
    },

    _sortWindowListRightToLeft: function(a, b) {
        let _a = this._weight_y(this._focusedWindowRect(), a.get_frame_rect(), 10);
        let _b = this._weight_y(this._focusedWindowRect(), b.get_frame_rect(), 10);
        return _a - _b;
    },

    _sortWindowListBottomToTop: function(a, b) {
        let _a = this._weight_x(this._focusedWindowRect(), a.get_frame_rect(), 20);
        let _b = this._weight_x(this._focusedWindowRect(), b.get_frame_rect(), 20);
        return _a - _b;
    },

    _sortWindowListTopToBottom: function(a, b) {
        let _a = this._weight_x(a.get_frame_rect(), this._focusedWindowRect(), 20);
        let _b = this._weight_x(b.get_frame_rect(), this._focusedWindowRect(), 20);
        return _a - _b;
    },

    _buildWindowList: function() {
        let focusWindow = global.display.focus_window;
        let monitor = Main.layoutManager.primaryMonitor;
        let workspace = global.screen.get_active_workspace();
        let windows = global.display.get_tab_list(Meta.TabList.NORMAL, workspace);
        return windows.filter(Lang.bind(this, function(window) {
            return !window.is_hidden() && focusWindow != window;
        }));
    },

    _debugWindowChange: function(from, to) {
        global.log("DEBUG: NavigateFocus change focus: ",
                   'from (',
                   from.get_frame_rect().x,
                   from.get_frame_rect().y,
                   ') to (',
                   to.get_frame_rect().x,
                   to.get_frame_rect().y,
                   ')'
                  );
    },

    // _debugWindow: function(window) {
    //     global.log("DEBUG: NavigateFocus window: ",
    //                window.get_frame_rect().x,
    //                window.get_frame_rect().y,
    //                window.is_hidden(),
    //                window.get_title()
    //               );
    // },

    // _debugRect: function(from, to) {
    //     global.log("DEBUG: filter rect: ",
    //                'from (',
    //                from.x,
    //                from.y,
    //                ') to (',
    //                to.x,
    //                to.y,
    //                ')'
    //               );
    // },

    // _debugWindowList: function(windowList) {
    //     for (let i = 0; i < windowList.length; i++) {
    //         let window = windowList[i];
    //         global.log(i,
    //             window.get_title(),
    //             window.get_frame_rect().x,
    //             window.get_frame_rect().y
    //         );
    //     }
    // },

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
        WmKeybindings.set_strv('unmaximize', []);           // <Super>Down
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
