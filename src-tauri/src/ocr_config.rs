pub struct Region {
    pub left: u32,
    pub top: u32,
    pub width: u32,
    pub height: u32,
}

pub struct Identifier<'a> {
    pub name: &'a str,
    pub anchor: Region,
    pub keywords: &'a [&'a str],
}

pub struct ExtractionRule<'a> {
    pub button_region: Region,
    pub data_regions: &'a [(&'a str, Region)],
}

// 화면 식별 규칙
pub const DJMAX_PRESET_IDENTIFIERS: [Identifier; 4] = [
    Identifier {
        name: "result", // DJMAX RESPECT V - 결과 화면
        anchor: Region { left: 100, top: 236, width: 230, height: 24 },
        keywords: &["JUDGEMENT", "DETAILS", "DETAIL", "JUDGE", "JUDGEMENT DETAILS"],
    },
    Identifier {
        name: "versus", // DJMAX RESPECT V - Versus 화면
        anchor: Region { left: 748, top: 45, width: 151, height: 106 },
        keywords: &["RE"], // 'READY' 또는 다른 'RE'로 시작하는 단어 식별용
    },
    Identifier {
        name: "open3", // DJMAX RESPECT V - Open Match (3인 이상)
        anchor: Region { left: 236, top: 724, width: 78, height: 24 },
        keywords: &["SCORE", "ORE"],
    },
    Identifier {
        name: "open2", // DJMAX RESPECT V - Open Match (2인)
        anchor: Region { left: 335, top: 723, width: 80, height: 26 },
        keywords: &["SCORE", "ORE"],
    },
];

// 결과창 데이터 추출 규칙
pub const RESULT_SCREEN_RULES: ExtractionRule = ExtractionRule {
    button_region: Region { left: 40, top: 40, width: 40, height: 50 }, 
    data_regions: &[
        ("title", Region { left: 370, top: 35, width: 100, height: 40 }),
        ("score", Region { left: 630, top: 670, width: 320, height: 100 }),
        ("rate", Region { left: 720, top: 590, width: 140, height: 30 }),
        ("best_combo", Region { left: 780, top: 515, width: 100, height: 30 }),
    ],
};

// 곡 선택창 데이터 추출 규칙
pub const SONG_SELECTION_RULES: ExtractionRule = ExtractionRule {
    button_region: Region { left: 38, top: 110, width: 40, height: 50 },
    data_regions: &[
        ("title", Region { left: 40, top: 165, width: 420, height: 60 }),
        ("artist", Region { left: 44, top: 232, width: 200, height: 25 }),
        ("bpm", Region { left: 44, top: 258, width: 80, height: 25 }),
        ("score", Region { left: 140, top: 448, width: 130, height: 25 }),
        ("rate", Region { left: 140, top: 474, width: 130, height: 25 }),
        ("combo", Region { left: 140, top: 500, width: 100, height: 25 }),
        ("dj_power", Region { left: 140, top: 526, width: 110, height: 25 }),
    ],
};