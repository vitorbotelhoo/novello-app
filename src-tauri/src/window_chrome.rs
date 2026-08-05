// Custom macOS window chrome for novello.
//
// Uses only public AppKit APIs (no `transparent: true` / macOSPrivateApi, which
// are unreliable and break native window management). Technique adapted from
// cloudworxx/tauri-plugin-mac-rounded-corners (MIT):
// keep the window `titled` (so drag + Fill/Center/Tile keep working), make the
// title bar transparent and the title hidden, extend content under it, round the
// content layer, and reposition the traffic lights.
#![allow(unexpected_cfgs)]
#![allow(deprecated)]

use tauri::{Runtime, WebviewWindow};

#[cfg(target_os = "macos")]
use cocoa::{
    appkit::{NSWindow, NSWindowStyleMask, NSWindowTitleVisibility},
    base::{id, NO, YES},
    foundation::{NSPoint, NSRect},
};
#[cfg(target_os = "macos")]
use objc::{msg_send, sel, sel_impl};

#[tauri::command]
pub fn apply_window_chrome<R: Runtime>(
    window: WebviewWindow<R>,
    corner_radius: Option<f64>,
    offset_x: Option<f64>,
    offset_y: Option<f64>,
) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        let radius = corner_radius.unwrap_or(18.0);
        let off_x = offset_x.unwrap_or(0.0);
        let off_y = offset_y.unwrap_or(0.0);

        window
            .with_webview(move |webview| unsafe {
                let ns_window = webview.ns_window() as id;

                let mut style_mask = ns_window.styleMask();
                style_mask |= NSWindowStyleMask::NSFullSizeContentViewWindowMask;
                style_mask |= NSWindowStyleMask::NSTitledWindowMask;
                style_mask |= NSWindowStyleMask::NSClosableWindowMask;
                style_mask |= NSWindowStyleMask::NSMiniaturizableWindowMask;
                style_mask |= NSWindowStyleMask::NSResizableWindowMask;
                ns_window.setStyleMask_(style_mask);

                ns_window.setTitlebarAppearsTransparent_(YES);
                ns_window.setTitleVisibility_(NSWindowTitleVisibility::NSWindowTitleHidden);
                ns_window.setHasShadow_(YES);
                ns_window.setOpaque_(NO);

                let content_view = ns_window.contentView();
                let _: () = msg_send![content_view, setWantsLayer: YES];
                let layer: id = msg_send![content_view, layer];
                if !layer.is_null() {
                    let _: () = msg_send![layer, setCornerRadius: radius];
                    let _: () = msg_send![layer, setMasksToBounds: YES];
                }

                position_traffic_lights(ns_window, off_x, off_y);
            })
            .map_err(|e| e.to_string())?;

        Ok(())
    }

    #[cfg(not(target_os = "macos"))]
    {
        let _ = (window, corner_radius, offset_x, offset_y);
        Ok(())
    }
}

/// Re-applies only the traffic-light position. macOS resets it to the default
/// on resize/fullscreen, so the frontend calls this on every resize event.
#[tauri::command]
pub fn reposition_traffic_lights<R: Runtime>(
    window: WebviewWindow<R>,
    offset_x: Option<f64>,
    offset_y: Option<f64>,
) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        let off_x = offset_x.unwrap_or(0.0);
        let off_y = offset_y.unwrap_or(0.0);
        window
            .with_webview(move |webview| unsafe {
                let ns_window = webview.ns_window() as id;
                position_traffic_lights(ns_window, off_x, off_y);
            })
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    #[cfg(not(target_os = "macos"))]
    {
        let _ = (window, offset_x, offset_y);
        Ok(())
    }
}

#[cfg(target_os = "macos")]
unsafe fn position_traffic_lights(ns_window: id, offset_x: f64, offset_y: f64) {
    let base_x = 20.0 + offset_x;
    let base_y = 0.0 - offset_y;

    // 0 = close, 1 = miniaturize, 2 = zoom, laid out left-to-right 20px apart.
    for (i, kind) in [0u64, 1u64, 2u64].iter().enumerate() {
        let button: id = msg_send![ns_window, standardWindowButton: *kind];
        if button.is_null() {
            continue;
        }
        let frame: NSRect = msg_send![button, frame];
        let new_frame = NSRect::new(
            NSPoint::new(base_x + (i as f64) * 20.0, base_y),
            frame.size,
        );
        let _: () = msg_send![button, setFrame: new_frame];
    }
}
