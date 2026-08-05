use tauri::menu::{Menu, SubmenuBuilder};
use tauri::Emitter;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let file_menu = SubmenuBuilder::new(app, "File")
                .text("menu-new", "New")
                .text("menu-open", "Open...")
                .separator()
                .text("menu-save", "Save")
                .text("menu-save-as", "Save As...")
                .build()?;

            let menu = Menu::default(app.handle())?;
            menu.append(&file_menu)?;
            app.set_menu(menu)?;

            let app_handle = app.handle().clone();
            app.on_menu_event(move |_app, event| {
                let _ = app_handle.emit("menu-action", event.id().0.clone());
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
