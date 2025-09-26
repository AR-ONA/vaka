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
    pub data_regions: &'a [(&'a str, Region)],
}

// 화면 식별 규칙
pub const DJMAX_PRESET_IDENTIFIERS: [Identifier; 4] = [
    Identifier {
        name: "result", // DJMAX RESPECT V - 결과
        anchor: Region { left: 100, top: 236, width: 230, height: 24 },
        keywords: &["JUDGEMENT", "DETAILS", "DETAIL", "JUDGE", "JUDGEMENT DETAILS"],
    },
    Identifier {
        name: "versus", // DJMAX RESPECT V - Versus
        anchor: Region { left: 748, top: 45, width: 151, height: 106 },
        keywords: &["RE"], // 'READY' or 'RE~~'
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
    data_regions: &[
        ("button_type", Region { left: 70, top: 25, width: 60, height: 70 }), 
        ("title", Region { left: 775, top: 20, width: 500, height: 25 }),
        ("score", Region { left: 760, top: 710, width: 400, height: 90 }),
        ("rate", Region { left: 890, top: 605, width: 140, height: 35 }),
        ("best_combo", Region { left: 1100, top: 540, width: 130, height: 30 }),
    ],
};