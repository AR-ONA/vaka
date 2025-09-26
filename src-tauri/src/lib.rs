mod ocr;
mod ocr_config;

use tauri::{App, Manager};

use crate::ocr::OcrEngineState;

fn setup(app: &mut App) -> Result<(), Box<dyn std::error::Error>> {
    let det_path = "./models/ch_PP-OCRv2_mobile_slim_det.onnx";
    let rec_path = "./models/kr_PP-OCRv3_rec.onnx";
    let cls_path = "./models/ch_PP-OCRv2_mobile_cls.onnx";

    let ocr_state = OcrEngineState::new(det_path, cls_path, rec_path, 2);

    app.manage(ocr_state);

    Ok(())
}

pub fn run() {
    tauri::Builder::default()
        .setup(|app| setup(app))
        .plugin(tauri_plugin_http::init())
        .invoke_handler(tauri::generate_handler![ocr::perform_ocr_from_bytes, ocr::ocr_and_match_song, ocr::init_songs])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}