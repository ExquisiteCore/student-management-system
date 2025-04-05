use tauri_plugin_log::{Target, TargetKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::new()
                        .targets([
                            Target::new(TargetKind::Stdout),
                            Target::new(TargetKind::LogDir { file_name: None }),
                            Target::new(TargetKind::Webview),
                        ])
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            log::info!("应用程序正在初始化...");
            Ok(())
        })
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_upload::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
