import { invoke } from "@tauri-apps/api/core";

export interface OcrResult {
    preset_type: string;
    button_type: string;
    data: { [key: string]: string };
}

/**
 * 이미지 파일을 Rust 백엔드에서 OCR 처리하는 비동기 함수.
 * @param imageFile 사용자가 업로드한 이미지 파일
 * @returns {Promise<OcrResult>} Rust로부터 받은 분석 결과 객체
 */
export const processImageWithRust = async (imageFile: File): Promise<OcrResult> => {
    const arrayBuffer = await imageFile.arrayBuffer();
    const imageBuffer = new Uint8Array(arrayBuffer);

    try {
        console.log("Requesting OCR Processing...");
        
        const result = await invoke<OcrResult>('ocr_process', { imageBuffer });
        
        console.log("Result!:", result);
        return result;
    } catch (error) {
        console.error("Rust Command Error:", error);
        throw new Error(error as string);
    }
};