use std::sync::Mutex;
use paddle_ocr_rs::ocr_lite::OcrLite;
use rayon::iter::{IntoParallelRefIterator, ParallelIterator};
use serde_json::json;

use serde::{Deserialize, Serialize};
use strsim::jaro_winkler;

use crate::ocr_config::{DJMAX_PRESET_IDENTIFIERS, RESULT_SCREEN_RULES};

pub struct OcrEngineState(pub Mutex<OcrLite>);

impl OcrEngineState {
    pub fn new(det_path: &str, cls_path: &str, rec_path: &str, num_threads: i32) -> Self {
        let mut engine = OcrLite::new();
        engine.init_models(det_path, cls_path, rec_path, num_threads.try_into().unwrap())
            .expect("OCR 모델 초기화 실패");
        OcrEngineState(Mutex::new(engine))
    }
}

#[allow(non_snake_case)]
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Song {
    pub title: u32,
    pub name: String,
    pub composer: String,
    pub dlcCode: String,
    pub dlc: String,
}

lazy_static::lazy_static! {
    static ref SONGS: std::sync::Mutex<Vec<Song>> = std::sync::Mutex::new(vec![]);
}

#[tauri::command]
pub async fn init_songs(songs: Vec<Song>) -> Result<(), String> {
    let mut data = SONGS.lock().map_err(|e| e.to_string())?;
    *data = songs;
    Ok(())
}

#[tauri::command]
pub async fn ocr_and_match_song(
    image_bytes: Vec<u8>,
    ocr_engine: tauri::State<'_, OcrEngineState>,
) -> Result<serde_json::Value, String> {
    let songs: Vec<Song> = {
        let guard = SONGS.lock().map_err(|e| e.to_string())?;
        guard.clone()
    };

    let ocr_result = perform_ocr_from_bytes(image_bytes, ocr_engine).await?;
    let text = ocr_result["data"]["title"].as_str().unwrap_or_default();
    
    let matched = match_song(text, &songs);

    Ok(json!({
        "screen_type": ocr_result["screen_type"],
        "title_data": matched.map(|s| json!({
            "title": s.title,
            "name": s.name,
            "composer": s.composer,
            "dlcCode": s.dlcCode,
            "dlc": s.dlc
        })).unwrap_or_default(),
        "data": ocr_result["data"],
        "debug_info": ocr_result["debug_info"]
    }))
}

fn match_song(text: &str, songs: &Vec<Song>) -> Option<Song> {
    if text.is_empty() {
        return None;
    }

    songs.par_iter()
        .max_by(|a, b| {
            let score_a = jaro_winkler(&a.name, text);
            let score_b = jaro_winkler(&b.name, text);
            
            score_a.partial_cmp(&score_b).unwrap_or(std::cmp::Ordering::Equal)
        })
        .cloned()
}

#[tauri::command]
pub async fn perform_ocr_from_bytes(
    image_bytes: Vec<u8>,
    ocr_engine: tauri::State<'_, OcrEngineState>,
) -> Result<serde_json::Value, String> {
    let dynamic_image = image::load_from_memory(&image_bytes)
        .map_err(|e| format!("이미지 디코딩 실패: {}", e))?
        .to_rgb8();

    let mut engine = ocr_engine.0.lock().unwrap();

    let mut identified_screen = "unknown".to_string();
    let mut debug_info = serde_json::Map::new();

    for identifier in DJMAX_PRESET_IDENTIFIERS.iter() {
        let anchor = &identifier.anchor;
        let crop_img = image::imageops::crop_imm(
            &dynamic_image,
            anchor.left,
            anchor.top,
            anchor.width,
            anchor.height,
        ).to_image();

        let res = engine.detect(&crop_img, 50, 1024, 0.5, 0.3, 1.6, false, false)
            .map_err(|e| e.to_string())?;

        let processed_text = res.text_blocks.iter()
            .map(|b| b.text.to_uppercase().replace(" ", "").replace("\n", ""))
            .collect::<Vec<_>>()
            .join("");

        debug_info.insert(format!("{}_anchor_text", identifier.name), json!(processed_text));

        if identified_screen == "unknown" && identifier.keywords.iter().any(|k| processed_text.contains(k)) {
            identified_screen = identifier.name.to_string();
        }
    }

    // 데이터 추출
    let mut extracted_data = serde_json::Map::new();
    if identified_screen == "result" {
        for (name, region) in RESULT_SCREEN_RULES.data_regions.iter() {
            let crop_img = image::imageops::crop_imm(
                &dynamic_image,
                region.left,
                region.top,
                region.width,
                region.height,
            ).to_image();

            // let file_path = format!("./tmp/{}_crop.png", name);
            // fs::create_dir_all("./tmp").ok();
            // crop_img.save(&file_path).map_err(|e| e.to_string())?;

            let res = engine.detect(&crop_img, 50, 1024, 0.5, 0.3, 1.6, false, false)
                .map_err(|e| e.to_string())?;

            let text = res.text_blocks.iter()
                .map(|b| b.text.trim())
                .collect::<Vec<_>>()
                .join(" ");

            extracted_data.insert(name.to_string(), json!(text));
        }
    }

    Ok(json!({
        "screen_type": identified_screen,
        "data": extracted_data,
        "debug_info": debug_info
    }))
}
