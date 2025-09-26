import { invoke } from '@tauri-apps/api/core';
import { useState } from 'react';

interface OcrResult {
    screen_type: string;
    title_data : Record<string, string>;
    data: Record<string, string>;
    debug_info?: Record<string, string>;
}

const UploadPage = () => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [result, setResult] = useState<OcrResult | null>(null);
    const [error, setError] = useState<string>('');

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setResult(null);
            setError('');
        }
    };
    const handleSubmit = async () => {
        if (!selectedFile) return;

        setIsLoading(true);
        setError('');
        setResult(null);

        try {
            const arrayBuffer = await selectedFile.arrayBuffer();
            const imageBytes = Array.from(new Uint8Array(arrayBuffer));

            const ocrResult: OcrResult = await invoke('ocr_and_match_song', { 
                imageBytes: imageBytes 
            });

            console.log(ocrResult)

            setResult(ocrResult);

        } catch (err) {
            setError(JSON.stringify(err, null, 2));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className='p-5'>
            <h1>OCR 테스트</h1>
            <p>1980x1080 해상도의 IMG를 입력하십시오.</p>
            
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
                <div className='bg-red-500'>
                    <h2>오류 발생</h2>
                    <pre className='bg-red-50 p-2.5 rounded-lg'>
                        {error}
                    </pre>
                </div>
            )}

            {result && (
                <div>
                    <h2>완료!</h2>
                    <p><strong>인식된 화면:</strong> {result.screen_type}</p>
                    
                    {result.screen_type === 'unknown' && result.debug_info && (
                        <div style={{ marginTop: '20px', background: '#fffbe6', border: '1px solid #ffe58f', padding: '10px', borderRadius: '5px' }}>
                            <h3>DEBUG RESULT</h3>
                            <p>Anchor 영역에서 읽은 텍스트</p>
                            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                                <thead>
                                    <tr>
                                        <th style={{ border: '1px solid #ccc', padding: '8px', background: '#fafafa' }}>화면 이름</th>
                                        <th style={{ border: '1px solid #ccc', padding: '8px', background: '#fafafa' }}>OCR 인식 결과</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(result.debug_info).map(([key, value]) => (
                                        <tr key={key}>
                                            <td style={{ border: '1px solid #ccc', padding: '8px', fontWeight: 'bold' }}>{key.replace('_anchor_text', '')}</td>
                                            <td style={{ border: '1px solid #ccc', padding: '8px', fontFamily: 'monospace' }}>{value || "(아무것도 인식되지 않음)"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {Object.keys(result.data).length > 0 && (
                        <div style={{ background: '#f0f0f0', padding: '10px', borderRadius: '5px' }}>
                            <h3>데이터:</h3>
                            <table style={{ borderCollapse: 'collapse', width: '300px' }}>
                                <tbody>
                                    {Object.entries(result.title_data).map(([key, value]) => (
                                        <tr key={key}>
                                            <td style={{ border: '1px solid #ccc', padding: '8px', fontWeight: 'bold' }}>{key}</td>
                                            <td style={{ border: '1px solid #ccc', padding: '8px' }}>{value}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tbody>
                                    {Object.entries(result.data).map(([key, value]) => (
                                        <tr key={key}>
                                            <td style={{ border: '1px solid #ccc', padding: '8px', fontWeight: 'bold' }}>{key}</td>
                                            <td style={{ border: '1px solid #ccc', padding: '8px' }}>{value}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {result.screen_type !== 'result' && result.screen_type !== 'unknown' && (
                        <p>데이터 규칙 없음???</p>
                    )}

                     {result.screen_type === 'unknown' && (
                        <p style={{ color: 'orange' }}>화면 식별 못함!!</p>
                    )}
                </div>
            )}
        </div>
    );
}

export default UploadPage;