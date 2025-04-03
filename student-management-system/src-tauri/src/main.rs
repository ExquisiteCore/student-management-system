use std::path::Path;

use app_lib::config;

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#[cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
fn main() {
    app_lib::run();
    // 加载配置文件
    let config_path = Path::new("config.toml");
    let config = if config_path.exists() {
        log::info!("从配置文件加载配置: {:?}", config_path);
        config::Config::from_file(config_path).unwrap()
    } else {
        log::info!("使用默认配置");
        config::Config::default()
    };
    // 初始化全局配置
    config::init_config(config.clone());
}
