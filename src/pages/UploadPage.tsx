import { useState } from 'react';
import { OcrResult, processImageWithRust } from '../ocr/processor';

const UploadPage = () => {
    // 1. 상태 관리: 선택된 파일, 로딩, 결과, 에러를 추적합니다.
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [result, setResult] = useState<OcrResult | null>(null);
    const [error, setError] = useState<string>('');

    // 2. 파일 입력이 변경될 때 호출될 함수
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            // 파일 선택 시 이전 결과/에러 초기화
            setResult(null);
            setError('');
        }
    };

    // 3. '분석 시작' 버튼을 클릭할 때 호출될 메인 함수
    const handleSubmit = async () => {
        if (!selectedFile) {
            alert("먼저 이미지 파일을 선택해주세요.");
            return;
        }

        setIsLoading(true);
        setError('');
        setResult(null);

        try {
            const ocrResult = await processImageWithRust(selectedFile);
            setResult(ocrResult);
        } catch (err: any) {
            setError(err.message || 'WEE');
        } finally {
            setIsLoading(false);
        }
    };

    // 4. 화면에 표시될 UI
    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
            <h1>OCR 테스트</h1>
            <p>16:9 비율의 DJMAX 스크린샷을 선택하고 '분석 시작' 버튼을 누르세요.</p>
            
            <hr />

            <div>
                <input 
                    type="file" 
                    accept="image/png, image/jpeg" 
                    onChange={handleFileChange}
                    disabled={isLoading}
                />
                <button onClick={handleSubmit} disabled={!selectedFile || isLoading}>
                    {isLoading ? '분석 중...' : '분석 시작'}
                </button>
            </div>

            <hr />

            {isLoading && (
                <div>
                    <h2>처리 중...</h2>
                </div>
            )}

            {error && (
                <div style={{ color: 'red' }}>
                    <h2>오류 발생!</h2>
                    <pre style={{ whiteSpace: 'pre-wrap', background: '#ffeeee', padding: '10px', borderRadius: '5px' }}>
                        {error}
                    </pre>
                </div>
            )}

            {result && (
                <div>
                    <h2>분석 성공!</h2>
                    <pre style={{ background: '#f0f0f0', padding: '10px', borderRadius: '5px' }}>
                        {JSON.stringify(result, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}

export default UploadPage;