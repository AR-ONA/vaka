interface SongData {
    data: Song[];
}

interface Song {
    title: string;
    name: string;
    composer: string;
    dlcCode: string;
    dlc: string;
    patterns: Patterns;
}

interface Patterns {
    "4B"?: PatternModes;
    "5B"?: PatternModes;
    "6B"?: PatternModes;
    "8B"?: PatternModes;
}

interface PatternModes {
    HD?: Pattern;
    NM?: Pattern;
    SC?: Pattern;
    MX?: Pattern;
}

interface Pattern {
    level: number;
    floor?: number;
    rating?: number;
}

interface RatingData {
    data: Rating[];
}

interface Rating {
    rating: number;
    name: string;
    code: string;
}