## Description

Gnome-shell extension to implement some i3-like keybindings.

I don't really tile windows that often, I mainly use tiling for my terminals. I could use tmux for that, but runinng tmux locally inside a terminal emulator on top of a window manager is just too much abstraction. tmux is great software though, I just prefer 'native' terminal emulators. i3 is great too, but I really want a desktop environment and not just a window manager with scripts.

This extension tries to emulate the i3 'focus left/right/up/down' command. After using i3 for a while I can't do without this kind of spatial window navigation.

## Keybindings

### focus

Since gnome-shell is not tiled, there seems to be no way to lookup the window 'to the left' of this other window. Currently this extension will grab the top-left coordinate of all windows and will find the closest one in relation to the current focus window.

* <Super>Left, <Super>h   -  focus left
* <Super>Right, <Super>l  -  focus right
* <Super>Up, <Super>k     -  focus up
* <Super>Down, <Super>j   -  focus down

This works fine if windows don't overlap. Since window coordinates are absolute, this works across several screens.

### removes keybindings

It will overwrite gnome-shell keybindings which I interrupt my workflow, like <Super>Left to tile a  window on the left side of the screen. I use that maybe once a week, after rebooting.

* <Super>Left   - toggle tiled left
* <Super>Right  - toggle tiled right
* <Super>Up     - maximize
* <Super>Down   - unmaximize
* <Super>h      - hides window?
* <Super>j
* <Super>k
* <Super>l

## TODO

* Improve window search
* Emulate i3 'move workspace to output'.

