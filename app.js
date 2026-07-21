// ==========================================
// 스티치 칭찬나라 JavaScript 핵심 기능 제어
// ==========================================

// 1. Supabase 연동 정보 설정 (Test_Sticker 전용 환경)
// Test_Sticker Supabase 프로젝트 연결 정보 설정 (미설정 시 안전한 독립 로컬 테스트 모드로 작동)
const SUPABASE_URL = ""; // Test_Sticker Supabase URL (예: https://your-test-sticker-project.supabase.co)
const SUPABASE_ANON_KEY = ""; // Test_Sticker Supabase Anon Key

let supabaseClient = null;
let isLocalMode = !SUPABASE_URL || !SUPABASE_ANON_KEY;

if (!isLocalMode) {
    try {
        if (!window.supabase) {
            throw new Error("Supabase CDN 라이브러리가 로드되지 않았습니다.");
        }
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("Supabase 연동이 정상 활성화되었습니다.");
    } catch (e) {
        console.error("Supabase 초기화 실패. 로컬 모드로 전환합니다.", e);
        isLocalMode = true;
    }
} else {
    console.log("Supabase 설정이 비어있어 '로컬 모드(기기 브라우저 저장)'로 구동됩니다.");
}

// 2. 앱 전역 상태 관리
let currentBoardId = localStorage.getItem("current_board_id") || "TEST-COSMIC-BOARD";
let currentBoard = null;
let currentStickers = [];
let isEditorMode = localStorage.getItem("is_editor") === "true";
let deleteTargetIndex = null;
let deleteTargetBoardId = null;
let memoTargetIndex = null;
let editTargetIndex = null;

// 기본 보드 정보가 설정되지 않은 경우 신규 생성을 유도합니다.

// 3. HTML DOM 요소
const loadingSpinner = document.getElementById("loading-spinner");
const appContent = document.querySelector(".app-content");
const roleIcon = document.getElementById("role-icon");
const roleText = document.getElementById("role-text");
const btnToggleRole = document.getElementById("btn-toggle-role");
const boardTitle = document.getElementById("board-title");
const boardCodeDisplay = document.getElementById("board-code-display");
const progressCount = document.getElementById("progress-count");
const progressBarFill = document.getElementById("progress-bar-fill");
const rewardBanner = document.getElementById("reward-banner");
const rewardText = document.getElementById("reward-text");
const celebrationBanner = document.getElementById("celebration-banner");
const celebrationRewardDetail = document.getElementById("celebration-reward-detail");
const stickerGrid = document.getElementById("sticker-grid");

// 사이드바 관련 요소 추가
const btnMenu = document.getElementById("btn-menu");
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebar-overlay");
const btnSidebarClose = document.getElementById("btn-sidebar-close");
const boardListContainer = document.getElementById("board-list");
const btnAddBoardSidebar = document.getElementById("btn-add-board-sidebar");
const inputCreateBoardTitle = document.getElementById("input-create-board-title");

// 모달 및 입력 폼 요소
const modalPin = document.getElementById("modal-pin");
const inputPin = document.getElementById("input-pin");
const pinError = document.getElementById("pin-error");
const btnPinCancel = document.getElementById("btn-pin-cancel");
const btnPinSubmit = document.getElementById("btn-pin-submit");

const modalSettings = document.getElementById("modal-settings");
const inputSwitchBoard = document.getElementById("input-switch-board");
const btnSwitchBoard = document.getElementById("btn-switch-board");
const editPin = document.getElementById("edit-pin");
const editReaderName = document.getElementById("edit-reader-name");
const editEditorName = document.getElementById("edit-editor-name");
const btnSettingsClose = document.getElementById("btn-settings-close");
const btnSettingsSave = document.getElementById("btn-settings-save");

// 칭찬판 정보 수정 모달 요소 (길게 누르기 연동)
const modalBoardEdit = document.getElementById("modal-board-edit");
const editBoardTitle = document.getElementById("edit-board-title");
const editBoardTargetCount = document.getElementById("edit-board-target-count");
const editBoardReward = document.getElementById("edit-board-reward");
const btnBoardEditClose = document.getElementById("btn-board-edit-close");
const btnBoardEditSave = document.getElementById("btn-board-edit-save");

let editTargetBoard = null;

const modalDelete = document.getElementById("modal-delete");
const deleteConfirmText = document.getElementById("delete-confirm-text");
const btnDeleteCancel = document.getElementById("btn-delete-cancel");
const btnDeleteConfirm = document.getElementById("btn-delete-confirm");

const modalShare = document.getElementById("modal-share");
const btnCreateBoard = document.getElementById("btn-create-board");
const btnShareClose = document.getElementById("btn-share-close");

const welcomeScreen = document.getElementById("welcome-screen");
const welcomeConnectCard = document.getElementById("welcome-connect-card");
const welcomeCreateCard = document.getElementById("welcome-create-card");
const welcomeInputBoardId = document.getElementById("welcome-input-board-id");
const btnWelcomeConnect = document.getElementById("btn-welcome-connect");
const btnWelcomeShowCreate = document.getElementById("btn-welcome-show-create");
const btnWelcomeBack = document.getElementById("btn-welcome-back");

const setupBoardId = document.getElementById("setup-board-id");
const setupTitle = document.getElementById("setup-title");
const setupTargetCount = document.getElementById("setup-target-count");
const setupReward = document.getElementById("setup-reward");
const setupPin = document.getElementById("setup-pin");
const btnSetupSubmit = document.getElementById("btn-setup-submit");

const modalMemoInput = document.getElementById("modal-memo-input");
const inputStickerMemo = document.getElementById("input-sticker-memo");
const btnMemoCancel = document.getElementById("btn-memo-cancel");
const btnMemoSubmit = document.getElementById("btn-memo-submit");

const modalMemoView = document.getElementById("modal-memo-view");
const viewStickerMemoText = document.getElementById("view-sticker-memo-text");
const viewStickerCreatedAt = document.getElementById("view-sticker-created-at");
const viewStickerUpdatedAt = document.getElementById("view-sticker-updated-at");
const btnMemoViewClose = document.getElementById("btn-memo-view-close");

const memoEditArea = document.getElementById("memo-edit-area");
const inputEditStickerMemo = document.getElementById("input-edit-sticker-memo");
const btnMemoEditStart = document.getElementById("btn-memo-edit-start");
const btnMemoEditCancel = document.getElementById("btn-memo-edit-cancel");
const btnMemoEditSave = document.getElementById("btn-memo-edit-save");

// 공용 버튼 트리거
const btnShare = document.getElementById("btn-share");
const btnSettings = document.getElementById("btn-settings");

// ==========================================
// 4. 데이터베이스 / 로컬스토리지 통신 매핑 API
// ==========================================

// 보드 불러오기
async function apiGetBoard(boardId) {
    if (isLocalMode || !supabaseClient) {
        const localData = localStorage.getItem(`board_${boardId}`);
        if (localData) {
            return JSON.parse(localData);
        }
        return null;
    } else {
        try {
            const fetchPromise = supabaseClient
                .from("praise_boards")
                .select("*")
                .eq("id", boardId)
                .maybeSingle();

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Supabase timeout")), 3500)
            );

            const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);
            if (error) throw error;
            if (data) {
                // 로컬 캐시 업데이트
                localStorage.setItem(`board_${boardId}`, JSON.stringify(data));
                return data;
            }
            return null;
        } catch (e) {
            console.error("보드 조회 중 서버 에러 발생, 캐시를 반환합니다.", e);
            const cached = localStorage.getItem(`board_${boardId}`);
            if (cached) return JSON.parse(cached);
            return null;
        }
    }
}

// 보드 생성 또는 수정
async function apiCreateBoard(board) {
    if (isLocalMode || !supabaseClient) {
        localStorage.setItem(`board_${board.id}`, JSON.stringify(board));
        return true;
    } else {
        try {
            const dbBoard = {
                id: board.id,
                title: board.title,
                target_count: board.target_count || 30,
                reward_text: board.reward_text || "",
                editor_pin: board.editor_pin || "1234",
                reader_role_name: board.reader_role_name || "남자친구 모드 (조회 전용)",
                editor_role_name: board.editor_role_name || "여자친구 모드 (부착 가능)"
            };
            if (board.created_at) {
                dbBoard.created_at = board.created_at;
            }

            const { error } = await supabaseClient
                .from("praise_boards")
                .upsert(dbBoard);
            if (error) {
                console.warn("Supabase 칭찬판 저장 중 에러가 발생하여 로컬 브라우저 캐시에 우선 저장합니다.", error);
                localStorage.setItem(`board_${board.id}`, JSON.stringify(board));
                return true;
            }
            localStorage.setItem(`board_${board.id}`, JSON.stringify(board));
            return true;
        } catch (e) {
            console.error("보드 생성/수정 실패", e);
            // 캐시 보존 fallback
            localStorage.setItem(`board_${board.id}`, JSON.stringify(board));
            return true;
        }
    }
}

// 보드 및 스티커 데이터베이스/로컬 캐시 완전 삭제
async function apiDeleteBoard(boardId) {
    // 1. 로컬 캐시 삭제
    localStorage.removeItem(`board_${boardId}`);
    localStorage.removeItem(`stickers_${boardId}`);
    localStorage.removeItem(`is_editor_${boardId}`);

    if (isLocalMode || !supabaseClient) {
        return true;
    } else {
        try {
            // 2. Supabase DB 삭제 (ON DELETE CASCADE로 인해 스티커 데이터도 함께 삭제됨)
            const { error } = await supabaseClient
                .from("praise_boards")
                .delete()
                .eq("id", boardId);
            if (error) throw error;
            return true;
        } catch (e) {
            console.error("보드 삭제 실패", e);
            return false;
        }
    }
}

// 부착된 스티커 목록 가져오기
async function apiGetStickers(boardId) {
    if (isLocalMode || !supabaseClient) {
        const localData = localStorage.getItem(`stickers_${boardId}`);
        return localData ? JSON.parse(localData) : [];
    } else {
        try {
            const { data, error } = await supabaseClient
                .from("praise_stickers")
                .select("*")
                .eq("board_id", boardId);
            if (error) throw error;
            localStorage.setItem(`stickers_${boardId}`, JSON.stringify(data));
            return data;
        } catch (e) {
            console.error("스티커 리스트 조회 중 서버 에러 발생, 캐시를 반환합니다.", e);
            const cached = localStorage.getItem(`stickers_${boardId}`);
            return cached ? JSON.parse(cached) : [];
        }
    }
}

// 스티커 부착
async function apiAddSticker(boardId, index, memo) {
    const nowISO = new Date().toISOString();
    if (isLocalMode || !supabaseClient) {
        const current = await apiGetStickers(boardId);
        if (!current.some(s => s.sticker_index === index)) {
            current.push({ 
                board_id: boardId, 
                sticker_index: index, 
                memo: memo,
                created_at: nowISO,
                updated_at: nowISO
            });
            localStorage.setItem(`stickers_${boardId}`, JSON.stringify(current));
        }
        return true;
    } else {
        try {
            const { error } = await supabaseClient
                .from("praise_stickers")
                .insert({ 
                    board_id: boardId, 
                    sticker_index: index, 
                    memo: memo,
                    created_at: nowISO,
                    updated_at: nowISO
                });
            if (error) throw error;
            return true;
        } catch (e) {
            console.error("스티커 부착 실패", e);
            return false;
        }
    }
}

// 스티커 메모 수정
async function apiUpdateStickerMemo(boardId, index, memo) {
    const nowISO = new Date().toISOString();
    if (isLocalMode || !supabaseClient) {
        const current = await apiGetStickers(boardId);
        const sticker = current.find(s => s.sticker_index === index);
        if (sticker) {
            sticker.memo = memo;
            sticker.updated_at = nowISO;
            localStorage.setItem(`stickers_${boardId}`, JSON.stringify(current));
        }
        return true;
    } else {
        try {
            const { error } = await supabaseClient
                .from("praise_stickers")
                .update({ 
                    memo: memo, 
                    updated_at: nowISO 
                })
                .eq("board_id", boardId)
                .eq("sticker_index", index);
            if (error) throw error;
            return true;
        } catch (e) {
            console.error("스티커 메모 수정 실패", e);
            return false;
        }
    }
}

// 스티커 떼기
async function apiRemoveSticker(boardId, index) {
    if (isLocalMode || !supabaseClient) {
        let current = await apiGetStickers(boardId);
        current = current.filter(s => s.sticker_index !== index);
        localStorage.setItem(`stickers_${boardId}`, JSON.stringify(current));
        return true;
    } else {
        try {
            const { error } = await supabaseClient
                .from("praise_stickers")
                .delete()
                .eq("board_id", boardId)
                .eq("sticker_index", index);
            if (error) throw error;
            return true;
        } catch (e) {
            console.error("스티커 제거 실패", e);
            return false;
        }
    }
}

// ==========================================
// 5. 3D 입체 해양생물 에폭시 스티커 10종 빌더
// ==========================================
const SEA_CREATURES = [
    { id: 0, name: "핑크 문어", emoji: "🐙" },
    { id: 1, name: "아쿠아 돌고래", emoji: "🐬" },
    { id: 2, name: "버블 물범", emoji: "🦭" },
    { id: 3, name: "코랄 게", emoji: "🦀" },
    { id: 4, name: "진주 조개", emoji: "🐚" },
    { id: 5, name: "동글 펭귄", emoji: "🐧" },
    { id: 6, name: "별빛 외뿔고래", emoji: "🐋" },
    { id: 7, name: "투명 오징어", emoji: "🦑" },
    { id: 8, name: "반짝 별님", emoji: "⭐" },
    { id: 9, name: "바다 수달", emoji: "🦦" }
];

let selectedStickerType = 0;

function parseStickerMemo(rawMemo) {
    if (!rawMemo) return { type: null, memo: "" };
    const match = String(rawMemo).match(/^\[type:(\d+)\]\s*(.*)/s);
    if (match) {
        return { type: parseInt(match[1], 10), memo: match[2] };
    }
    return { type: null, memo: rawMemo };
}

function getSeaCreatureGraphic(type) {
    switch (type) {
        case 0: // 🐙 핑크 젤리 문어
            return `
                <defs>
                    <linearGradient id="pink-head-${type}" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#FF99DD" />
                        <stop offset="60%" stop-color="#FF4DB8" />
                        <stop offset="100%" stop-color="#E6007A" />
                    </linearGradient>
                </defs>
                <circle cx="28" cy="72" r="9" fill="url(#pink-head-${type})" />
                <circle cx="43" cy="76" r="9" fill="url(#pink-head-${type})" />
                <circle cx="57" cy="76" r="9" fill="url(#pink-head-${type})" />
                <circle cx="72" cy="72" r="9" fill="url(#pink-head-${type})" />
                <ellipse cx="50" cy="46" rx="28" ry="24" fill="url(#pink-head-${type})" />
                <circle cx="40" cy="48" r="3.5" fill="#1E293B" />
                <circle cx="60" cy="48" r="3.5" fill="#1E293B" />
                <circle cx="41" cy="46" r="1.2" fill="#FFFFFF" />
                <circle cx="61" cy="46" r="1.2" fill="#FFFFFF" />
                <ellipse cx="33" cy="53" rx="4" ry="2.5" fill="#FF1A8C" opacity="0.6" />
                <ellipse cx="67" cy="53" rx="4" ry="2.5" fill="#FF1A8C" opacity="0.6" />
                <path d="M 47 54 Q 50 57 53 54" stroke="#1E293B" stroke-width="2" fill="none" stroke-linecap="round" />
                <path d="M 30 30 A 20 15 0 0 1 70 30 C 58 24 42 24 30 30 Z" fill="#FFFFFF" opacity="0.7" />
                <circle cx="34" cy="28" r="3" fill="#FFFFFF" opacity="0.8" />
            `;
        case 1: // 🐬 아쿠아 돌고래
            return `
                <defs>
                    <linearGradient id="aqua-dolphin-${type}" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#70E4EF" />
                        <stop offset="50%" stop-color="#00C4FF" />
                        <stop offset="100%" stop-color="#0077FF" />
                    </linearGradient>
                </defs>
                <path d="M 76 68 C 84 64 90 70 88 78 C 80 74 74 72 70 70 Z" fill="url(#aqua-dolphin-${type})" />
                <path d="M 16 52 C 22 32 46 24 72 44 C 80 50 84 62 72 70 C 52 78 30 72 16 52 Z" fill="url(#aqua-dolphin-${type})" />
                <path d="M 44 28 C 48 18 56 16 58 26 Z" fill="url(#aqua-dolphin-${type})" />
                <path d="M 24 56 C 36 68 56 70 66 62 C 48 64 34 60 24 56 Z" fill="#E0F7FA" opacity="0.75" />
                <circle cx="30" cy="46" r="3" fill="#0F172A" />
                <circle cx="31" cy="44.8" r="1" fill="#FFFFFF" />
                <path d="M 22 52 Q 26 55 28 51" stroke="#0F172A" stroke-width="1.8" fill="none" stroke-linecap="round" />
                <path d="M 32 34 C 44 28 60 32 66 40 C 52 32 38 32 32 34 Z" fill="#FFFFFF" opacity="0.7" />
            `;
        case 2: // 🦭 버블 하프물범
            return `
                <defs>
                    <radialGradient id="bubble-sphere-${type}" cx="35%" cy="35%" r="65%">
                        <stop offset="0%" stop-color="#E0F2FE" stop-opacity="0.95" />
                        <stop offset="60%" stop-color="#38BDF8" stop-opacity="0.65" />
                        <stop offset="100%" stop-color="#0284C7" stop-opacity="0.9" />
                    </radialGradient>
                    <linearGradient id="seal-body-${type}" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stop-color="#FFFFFF" />
                        <stop offset="100%" stop-color="#E2E8F0" />
                    </linearGradient>
                </defs>
                <circle cx="50" cy="50" r="38" fill="url(#bubble-sphere-${type})" />
                <ellipse cx="50" cy="54" rx="24" ry="19" fill="url(#seal-body-${type})" />
                <ellipse cx="30" cy="62" rx="6" ry="4" fill="url(#seal-body-${type})" transform="rotate(-20 30 62)" />
                <ellipse cx="70" cy="62" rx="6" ry="4" fill="url(#seal-body-${type})" transform="rotate(20 70 62)" />
                <circle cx="42" cy="50" r="3" fill="#1E293B" />
                <circle cx="58" cy="50" r="3" fill="#1E293B" />
                <ellipse cx="50" cy="55" rx="3.5" ry="2.5" fill="#475569" />
                <ellipse cx="36" cy="54" rx="3.5" ry="2" fill="#FDA4AF" opacity="0.7" />
                <ellipse cx="64" cy="54" rx="3.5" ry="2" fill="#FDA4AF" opacity="0.7" />
                <path d="M 24 28 A 30 30 0 0 1 76 28 C 60 20 40 20 24 28 Z" fill="#FFFFFF" opacity="0.8" />
                <circle cx="72" cy="70" r="3" fill="#FFFFFF" opacity="0.6" />
            `;
        case 3: // 🦀 코랄 핑크 게
            return `
                <defs>
                    <linearGradient id="coral-crab-${type}" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#FF8A9E" />
                        <stop offset="100%" stop-color="#FF3B60" />
                    </linearGradient>
                </defs>
                <path d="M 22 36 C 12 24 16 12 28 20 C 32 26 26 34 22 36 Z" fill="url(#coral-crab-${type})" />
                <path d="M 78 36 C 88 24 84 12 72 20 C 68 26 74 34 78 36 Z" fill="url(#coral-crab-${type})" />
                <path d="M 24 54 Q 14 62 20 72 M 76 54 Q 86 62 80 72" stroke="#FF3B60" stroke-width="4" stroke-linecap="round" fill="none" />
                <ellipse cx="50" cy="52" rx="28" ry="20" fill="url(#coral-crab-${type})" />
                <circle cx="40" cy="46" r="3.5" fill="#1E293B" />
                <circle cx="60" cy="46" r="3.5" fill="#1E293B" />
                <circle cx="41" cy="44.5" r="1.2" fill="#FFFFFF" />
                <circle cx="61" cy="44.5" r="1.2" fill="#FFFFFF" />
                <ellipse cx="33" cy="52" rx="3.5" ry="2" fill="#FF1A40" opacity="0.6" />
                <ellipse cx="67" cy="52" rx="3.5" ry="2" fill="#FF1A40" opacity="0.6" />
                <path d="M 47 54 Q 50 57 53 54" stroke="#1E293B" stroke-width="1.8" stroke-linecap="round" fill="none" />
                <path d="M 30 38 A 20 12 0 0 1 70 38 C 56 32 44 32 30 38 Z" fill="#FFFFFF" opacity="0.7" />
            `;
        case 4: // 🐚 진주 가리비
            return `
                <defs>
                    <linearGradient id="purple-shell-${type}" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#E9D5FF" />
                        <stop offset="50%" stop-color="#C084FC" />
                        <stop offset="100%" stop-color="#9333EA" />
                    </linearGradient>
                    <radialGradient id="pearl-shine-${type}" cx="30%" cy="30%" r="70%">
                        <stop offset="0%" stop-color="#FFFFFF" />
                        <stop offset="50%" stop-color="#F1F5F9" />
                        <stop offset="100%" stop-color="#CBD5E1" />
                    </radialGradient>
                </defs>
                <path d="M 20 60 C 14 36 34 20 50 20 C 66 20 86 36 80 60 C 74 76 26 76 20 60 Z" fill="url(#purple-shell-${type})" />
                <path d="M 50 20 L 50 72 M 36 24 L 38 70 M 64 24 L 62 70 M 26 34 L 30 66 M 74 34 L 70 66" stroke="#F3E8FF" stroke-width="1.5" opacity="0.6" fill="none" />
                <path d="M 38 70 L 62 70 L 58 78 L 42 78 Z" fill="#7E22CE" />
                <circle cx="50" cy="56" r="11" fill="url(#pearl-shine-${type})" />
                <circle cx="46" cy="52" r="3.5" fill="#FFFFFF" opacity="0.9" />
                <path d="M 30 28 C 42 22 58 22 70 28 C 58 24 42 24 30 28 Z" fill="#FFFFFF" opacity="0.75" />
            `;
        case 5: // 🐧 동글 펭귄
            return `
                <defs>
                    <linearGradient id="penguin-dark-${type}" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#334155" />
                        <stop offset="100%" stop-color="#0F172A" />
                    </linearGradient>
                </defs>
                <ellipse cx="50" cy="50" rx="28" ry="32" fill="url(#penguin-dark-${type})" />
                <ellipse cx="50" cy="56" rx="20" ry="22" fill="#FFFFFF" />
                <ellipse cx="20" cy="52" rx="5" ry="14" fill="url(#penguin-dark-${type})" transform="rotate(15 20 52)" />
                <ellipse cx="80" cy="52" rx="5" ry="14" fill="url(#penguin-dark-${type})" transform="rotate(-15 80 52)" />
                <ellipse cx="44" cy="80" rx="5" ry="3" fill="#F59E0B" />
                <ellipse cx="56" cy="80" rx="5" ry="3" fill="#F59E0B" />
                <polygon points="50,46 45,51 55,51" fill="#F59E0B" />
                <circle cx="40" cy="42" r="3" fill="#0F172A" />
                <circle cx="60" cy="42" r="3" fill="#0F172A" />
                <circle cx="41" cy="41" r="1" fill="#FFFFFF" />
                <circle cx="61" cy="41" r="1" fill="#FFFFFF" />
                <ellipse cx="34" cy="46" rx="3.5" ry="2" fill="#FDA4AF" opacity="0.7" />
                <ellipse cx="66" cy="46" rx="3.5" ry="2" fill="#FDA4AF" opacity="0.7" />
                <path d="M 30 26 C 42 20 58 20 70 26 C 58 22 42 22 30 26 Z" fill="#FFFFFF" opacity="0.75" />
            `;
        case 6: // 🐋 별빛 외뿔고래
            return `
                <defs>
                    <linearGradient id="narwhal-body-${type}" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#C084FC" />
                        <stop offset="50%" stop-color="#818CF8" />
                        <stop offset="100%" stop-color="#38BDF8" />
                    </linearGradient>
                </defs>
                <polygon points="34,36 14,14 38,30" fill="#FBBF24" />
                <path d="M 24 25 L 28 27" stroke="#F59E0B" stroke-width="1.5" />
                <ellipse cx="54" cy="54" rx="28" ry="20" fill="url(#narwhal-body-${type})" />
                <path d="M 78 54 C 88 48 92 54 90 62 C 84 58 80 58 76 56 Z" fill="url(#narwhal-body-${type})" />
                <path d="M 34 58 C 44 68 64 68 74 58 C 62 64 46 64 34 58 Z" fill="#F0F9FF" opacity="0.8" />
                <circle cx="40" cy="50" r="3" fill="#1E293B" />
                <circle cx="41" cy="48.8" r="1" fill="#FFFFFF" />
                <ellipse cx="46" cy="54" rx="3" ry="2" fill="#F472B6" opacity="0.7" />
                <path d="M 24 45 L 26 42 L 28 45 L 26 48 Z" fill="#FDE047" />
                <path d="M 36 40 C 48 36 64 38 72 44 C 60 38 46 38 36 40 Z" fill="#FFFFFF" opacity="0.75" />
            `;
        case 7: // 🦑 투명 오징어
            return `
                <defs>
                    <linearGradient id="squid-body-${type}" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#EEF2FF" />
                        <stop offset="50%" stop-color="#F472B6" />
                        <stop offset="100%" stop-color="#DB2777" />
                    </linearGradient>
                </defs>
                <path d="M 36 62 Q 32 78 36 84 M 44 64 Q 42 80 46 86 M 56 64 Q 58 80 54 86 M 64 62 Q 68 78 64 84" stroke="#EC4899" stroke-width="4" stroke-linecap="round" fill="none" />
                <path d="M 50 18 C 30 18 26 42 30 62 C 40 66 60 66 70 62 C 74 42 70 18 50 18 Z" fill="url(#squid-body-${type})" />
                <circle cx="42" cy="46" r="3" fill="#1E293B" />
                <circle cx="58" cy="46" r="3" fill="#1E293B" />
                <ellipse cx="36" cy="50" rx="3" ry="2" fill="#BE185D" opacity="0.6" />
                <ellipse cx="64" cy="50" rx="3" ry="2" fill="#BE185D" opacity="0.6" />
                <path d="M 38 26 C 46 22 54 22 62 26 C 54 23 46 23 38 26 Z" fill="#FFFFFF" opacity="0.8" />
            `;
        case 8: // ⭐ 반짝 별님
            return `
                <defs>
                    <linearGradient id="star-jelly-${type}" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#FDE047" />
                        <stop offset="50%" stop-color="#F59E0B" />
                        <stop offset="100%" stop-color="#F43F5E" />
                    </linearGradient>
                </defs>
                <path d="M 50 14 C 54 28 60 34 76 36 C 62 46 60 54 66 72 C 52 62 48 62 34 72 C 40 54 38 46 24 36 C 40 34 46 28 50 14 Z" fill="url(#star-jelly-${type})" />
                <circle cx="44" cy="44" r="3" fill="#1E293B" />
                <circle cx="56" cy="44" r="3" fill="#1E293B" />
                <ellipse cx="38" cy="48" rx="3" ry="2" fill="#E11D48" opacity="0.6" />
                <ellipse cx="62" cy="48" rx="3" ry="2" fill="#E11D48" opacity="0.6" />
                <path d="M 47 50 Q 50 53 53 50" stroke="#1E293B" stroke-width="1.8" stroke-linecap="round" fill="none" />
                <path d="M 46 20 C 48 30 52 34 60 36 C 54 32 50 30 46 20 Z" fill="#FFFFFF" opacity="0.8" />
            `;
        case 9: // 🦦 바다 수달
            return `
                <defs>
                    <linearGradient id="otter-brown-${type}" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#D97706" />
                        <stop offset="100%" stop-color="#78350F" />
                    </linearGradient>
                </defs>
                <circle cx="28" cy="30" r="6" fill="url(#otter-brown-${type})" />
                <circle cx="72" cy="30" r="6" fill="url(#otter-brown-${type})" />
                <ellipse cx="50" cy="50" rx="26" ry="28" fill="url(#otter-brown-${type})" />
                <ellipse cx="50" cy="48" rx="12" ry="9" fill="#FEF3C7" />
                <circle cx="36" cy="62" r="5" fill="#B45309" />
                <circle cx="64" cy="62" r="5" fill="#B45309" />
                <ellipse cx="50" cy="64" rx="9" ry="7" fill="#FBBF24" />
                <path d="M 50 58 L 50 70 M 45 60 L 47 68 M 55 60 L 53 68" stroke="#D97706" stroke-width="1" />
                <circle cx="42" cy="42" r="3" fill="#1E293B" />
                <circle cx="58" cy="42" r="3" fill="#1E293B" />
                <ellipse cx="50" cy="46" rx="3" ry="2" fill="#78350F" />
                <ellipse cx="36" cy="46" rx="3" ry="2" fill="#F472B6" opacity="0.6" />
                <ellipse cx="64" cy="46" rx="3" ry="2" fill="#F472B6" opacity="0.6" />
                <path d="M 32 28 C 44 24 56 24 68 28 C 56 25 44 25 32 28 Z" fill="#FFFFFF" opacity="0.75" />
            `;
        default:
            return "";
    }
}

function getCosmicStickerSvg(index, isSticker, rawMemo = "") {
    const parsed = parseStickerMemo(rawMemo);
    const type = (parsed.type !== null && parsed.type >= 0 && parsed.type < 10) ? parsed.type : (index % 10);
    
    if (!isSticker) {
        return `
            <svg viewBox="0 0 100 100" class="sea-sticker-svg placeholder" style="opacity: 0.26;">
                <g filter="grayscale(50%)">
                    ${getSeaCreatureGraphic(type)}
                </g>
            </svg>
        `;
    }
    return `
        <svg viewBox="0 0 100 100" class="sea-sticker-svg active">
            ${getSeaCreatureGraphic(type)}
        </svg>
    `;
}

function renderStickerPickerGrid() {
    const gridContainer = document.getElementById("sticker-select-grid");
    if (!gridContainer) return;
    gridContainer.innerHTML = "";
    
    SEA_CREATURES.forEach(creature => {
        const isSel = creature.id === selectedStickerType;
        const item = document.createElement("div");
        item.className = `sticker-option-item ${isSel ? "selected" : ""}`;
        item.innerHTML = `
            <div class="sticker-option-icon">
                <svg viewBox="0 0 100 100" style="width:100%; height:100%;">
                    ${getSeaCreatureGraphic(creature.id)}
                </svg>
            </div>
            <span class="sticker-option-label">${creature.name}</span>
        `;
        
        item.addEventListener("click", () => {
            selectedStickerType = creature.id;
            document.querySelectorAll(".sticker-option-item").forEach(el => el.classList.remove("selected"));
            item.classList.add("selected");
        });
        
        gridContainer.appendChild(item);
    });
}

// ==========================================
// 5.5 등록된 보드 목록 관리 및 사이드바 렌더링
// ==========================================

// 모든 스티커판 목록 조회 (서버 및 로컬)
async function apiGetAllBoards() {
    if (isLocalMode || !supabaseClient) {
        // 로컬스토리지 전체 키 순회
        const boards = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith("board_")) {
                try {
                    const board = JSON.parse(localStorage.getItem(key));
                    if (board && board.id) {
                        boards.push(board);
                    }
                } catch(e){}
            }
        }
        return boards;
    } else {
        try {
            const { data, error } = await supabaseClient
                .from("praise_boards")
                .select("*")
                .order("created_at", { ascending: false });
            if (error) throw error;
            return data || [];
        } catch (e) {
            console.error("전체 보드 조회 실패", e);
            const boards = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith("board_")) {
                    try {
                        const board = JSON.parse(localStorage.getItem(key));
                        if (board && board.id) {
                            boards.push(board);
                        }
                    } catch(e){}
                }
            }
            return boards;
        }
    }
}

// 보드 이름 수정 API
async function apiUpdateBoardTitle(boardId, newTitle) {
    let board = await apiGetBoard(boardId);
    if (!board) return false;
    
    board.title = newTitle;
    const success = await apiCreateBoard(board);
    if (success) {
        addRegisteredBoard(boardId, newTitle);
        return true;
    }
    return false;
}

// 보드 아이템 롱프레스 핸들러 - 칭찬판 상세 수정 모달 오픈
async function handleBoardItemLongPress(board) {
    editTargetBoard = board;
    const hasPermission = localStorage.getItem("is_editor") === "true";

    if (hasPermission) {
        // 모든 입력 필드 활성화
        if (editBoardTitle) editBoardTitle.disabled = false;
        if (editBoardTargetCount) editBoardTargetCount.disabled = false;
        if (editBoardReward) editBoardReward.disabled = false;
        if (btnBoardEditSave) btnBoardEditSave.classList.remove("hidden");
    } else {
        // 읽기 전용으로 비활성화
        if (editBoardTitle) editBoardTitle.disabled = true;
        if (editBoardTargetCount) editBoardTargetCount.disabled = true;
        if (editBoardReward) editBoardReward.disabled = true;
        if (btnBoardEditSave) btnBoardEditSave.classList.add("hidden");
    }

    // 폼 값 세팅
    if (editBoardTitle) editBoardTitle.value = board.title;
    if (editBoardTargetCount) editBoardTargetCount.value = board.target_count || 30;
    if (editBoardReward) editBoardReward.value = board.reward_text || "";

    // 팝업 모달창 오픈
    if (modalBoardEdit) {
        modalBoardEdit.classList.remove("hidden");
    }
}

// 등록된 보드 목록 관리 헬퍼 함수들
function getRegisteredBoards() {
    const list = localStorage.getItem("registered_boards");
    return list ? JSON.parse(list) : [];
}

function addRegisteredBoard(boardId, title) {
    let list = getRegisteredBoards();
    const existingIndex = list.findIndex(b => b.id === boardId);
    if (existingIndex !== -1) {
        list[existingIndex].title = title;
    } else {
        list.push({ id: boardId, title: title });
    }
    localStorage.setItem("registered_boards", JSON.stringify(list));
}

function removeRegisteredBoard(boardId) {
    let list = getRegisteredBoards();
    list = list.filter(b => b.id !== boardId);
    localStorage.setItem("registered_boards", JSON.stringify(list));
    
    if (currentBoardId === boardId) {
        if (list.length > 0) {
            currentBoardId = list[0].id;
        } else {
            currentBoardId = "DEFAULT";
        }
        localStorage.setItem("current_board_id", currentBoardId);
    }
}

// 사이드바 내부 보드 목록 동적 렌더링
async function renderBoardList() {
    if (!boardListContainer) return;
    boardListContainer.innerHTML = "";
    
    // 1. 서버 및 로컬 전체 보드 목록 가져오기
    let serverBoards = await apiGetAllBoards();
    let localList = getRegisteredBoards();
    
    // 통합 맵으로 중복 제거 및 병합 (서버에 새로 생성된 보드도 자동 표시되도록 함)
    const boardMap = new Map();
    serverBoards.forEach(b => {
        if (b && b.id) {
            boardMap.set(b.id, { id: b.id, title: b.title, reward_text: b.reward_text });
        }
    });
    localList.forEach(b => {
        if (b && b.id && !boardMap.has(b.id)) {
            boardMap.set(b.id, b);
        }
    });
    
    const combinedList = Array.from(boardMap.values());
    
    // 2. 단일 리스트로 깔끔하게 렌더링
    if (combinedList.length === 0) {
        const emptyMsg = document.createElement("div");
        emptyMsg.style.fontSize = "11px";
        emptyMsg.style.color = "var(--text-muted)";
        emptyMsg.style.textAlign = "center";
        emptyMsg.style.padding = "10px 0";
        emptyMsg.textContent = "등록된 스티커판이 없습니다. 🧸";
        boardListContainer.appendChild(emptyMsg);
    } else {
        combinedList.forEach(board => {
            const item = createBoardItemDOM(board, true);
            boardListContainer.appendChild(item);
        });
    }
}

// 보드 아이템 DOM 요소 생성 헬퍼
function createBoardItemDOM(board, isLocal) {
    const isActive = board.id === currentBoardId;
    const item = document.createElement("div");
    item.className = `board-item ${isActive ? "active" : ""}`;
    
    const hasPermission = localStorage.getItem("is_editor") === "true";

    // 나의 칭찬판 목록이며 + 동시에 편집 권한(여자친구 PIN)을 갖고 있을 때만 삭제(휴지통) 아이콘 노출
    const deleteButtonHtml = (isLocal && hasPermission) ? `
        <button class="btn-delete-board" title="삭제">
            <span class="material-icons" style="font-size: 16px;">delete</span>
        </button>
    ` : '';

    item.innerHTML = `
        <div class="board-item-info">
            <span class="board-item-title">${board.title}</span>
            <span class="board-item-code">코드: ${board.id}</span>
        </div>
        ${deleteButtonHtml}
    `;

    // 1. 클릭 시 전환 이벤트
    item.addEventListener("click", async () => {
        if (isActive) return;
        
        loadingSpinner.classList.remove("hidden");
        sidebar.classList.remove("open");
        sidebarOverlay.classList.add("hidden");
        
        currentBoardId = board.id;
        localStorage.setItem("current_board_id", currentBoardId);
        isEditorMode = localStorage.getItem("is_editor") === "true"; // 전역 인증 상태 유지
        updateRoleUI();
        await refreshApp();
        
        const newUrl = `${window.location.origin}${window.location.pathname}?board=${board.id}`;
        window.history.replaceState({ path: newUrl }, "", newUrl);
    });

    // 2. 롱프레스 감지 이벤트 (모바일 및 데스크톱)
    let pressTimer = null;
    let isLongPress = false;

    const startPress = (e) => {
        if (e.type === 'mousedown' && e.button !== 0) return;
        isLongPress = false;
        pressTimer = setTimeout(() => {
            isLongPress = true;
            handleBoardItemLongPress(board);
        }, 700);
    };

    const cancelPress = () => {
        if (pressTimer) {
            clearTimeout(pressTimer);
            pressTimer = null;
        }
    };

    const endPress = (e) => {
        if (pressTimer) {
            clearTimeout(pressTimer);
            pressTimer = null;
        }
        if (isLongPress) {
            e.preventDefault();
            e.stopPropagation();
        }
    };

    item.addEventListener("mousedown", startPress);
    item.addEventListener("mouseup", endPress);
    item.addEventListener("mouseleave", cancelPress);

    item.addEventListener("touchstart", startPress, { passive: true });
    item.addEventListener("touchend", endPress, { passive: false });
    item.addEventListener("touchcancel", cancelPress, { passive: true });
    item.addEventListener("touchmove", cancelPress, { passive: true });

    // 3. 삭제 버튼 클릭 (완전 삭제 - 편집 권한 보유 시에만 작동)
    if (isLocal && hasPermission) {
        const btnDelete = item.querySelector(".btn-delete-board");
        if (btnDelete) {
            // 모든 이벤트 버블링 방지 (상위 board-item의 롱프레스/클릭 간섭 완전 차단)
            btnDelete.addEventListener("mousedown", (e) => e.stopPropagation());
            btnDelete.addEventListener("mouseup", (e) => e.stopPropagation());
            btnDelete.addEventListener("touchstart", (e) => e.stopPropagation(), { passive: true });
            btnDelete.addEventListener("touchend", (e) => e.stopPropagation(), { passive: true });

            btnDelete.addEventListener("click", (e) => {
                e.stopPropagation();
                e.preventDefault();
                // 커스텀 모달로 삭제 확인 (네이티브 confirm() 대신 앱 내 모달 사용)
                deleteTargetBoardId = board.id;
                deleteTargetIndex = null; // 스티커 삭제가 아님을 명시
                deleteConfirmText.textContent = `'${board.title}' 판을 삭제하시겠습니까?\n(실제 데이터와 스티커가 모두 영구 삭제됩니다.)`;
                modalDelete.classList.remove("hidden");
            });
        }
    }

    return item;
}

// ==========================================
// 6. UI 업데이트 및 렌더링 로직
// ==========================================

// 현재 화면 리프레시
async function refreshApp() {
    // 1. 보드 정보 로드
    let board = await apiGetBoard(currentBoardId);
    if (!board) {
        // 보드가 존재하지 않음 -> 초기 설정 화면 노출
        loadingSpinner.classList.add("hidden");
        appContent.classList.add("hidden");
        welcomeScreen.classList.remove("hidden");
        
        // 접속 화면 카드를 노출하고 생성 화면 카드를 숨김
        if (welcomeConnectCard) welcomeConnectCard.classList.remove("hidden");
        if (welcomeCreateCard) welcomeCreateCard.classList.add("hidden");
        if (welcomeInputBoardId) welcomeInputBoardId.value = "";
        
        // 설정 폼에 현재 보드 ID 자동 완성 및 테스트값 미리 채우기
        if (currentBoardId === "DEFAULT" || currentBoardId.startsWith("TEST-")) {
            setupBoardId.value = currentBoardId === "DEFAULT" ? "TEST-COSMIC-BOARD" : currentBoardId;
            setupTitle.value = "TEST";
            setupTargetCount.value = "30";
            setupReward.value = "맛있는 디저트 데이트! 🍦";
            setupPin.value = "1234";
        } else {
            setupBoardId.value = currentBoardId;
        }
        return;
    }

    // 보드가 정상적으로 로드된 경우 설정창 숨기고 콘텐츠 노출
    welcomeScreen.classList.add("hidden");
    currentBoard = board;

    // 로컬 보드 목록 관리 및 갱신
    addRegisteredBoard(board.id, board.title);
    renderBoardList();

    // 2. 스티커 정보 로드
    currentStickers = await apiGetStickers(currentBoardId);
    const activeIndices = new Set(currentStickers.map(s => s.sticker_index));

    // 3. 헤더 및 요약 카드 업데이트
    boardTitle.textContent = currentBoard.title;
    boardCodeDisplay.textContent = `보드 코드: ${currentBoard.id}`;

    const targetCount = currentBoard.target_count;
    const completedCount = currentStickers.length;
    progressCount.textContent = `${completedCount} / ${targetCount} 개`;

    const percentage = Math.min((completedCount / targetCount) * 100, 100);
    progressBarFill.style.width = `${percentage}%`;

    // 보상 배너 처리
    if (currentBoard.reward_text) {
        rewardText.textContent = `완료 보상: ${currentBoard.reward_text}`;
        rewardBanner.classList.remove("hidden");
    } else {
        rewardBanner.classList.add("hidden");
    }

    // 축하 배너 처리
    if (completedCount >= targetCount) {
        celebrationRewardDetail.textContent = `${currentBoard.reward_text}을(를) 획득할 시간이에요! 🎁`;
        celebrationBanner.classList.remove("hidden");
    } else {
        celebrationBanner.classList.add("hidden");
    }

    // 4. 스티커 판 격자 그리기
    stickerGrid.innerHTML = "";
    for (let i = 0; i < targetCount; i++) {
        const stickerData = currentStickers.find(s => s.sticker_index === i);
        const isActive = !!stickerData;
        const rawMemo = stickerData && stickerData.memo ? stickerData.memo : "";

        const slot = document.createElement("div");
        slot.className = `grid-slot ${isActive ? "active" : ""}`;
        slot.innerHTML = `
            ${getCosmicStickerSvg(i, isActive, rawMemo)}
            <span class="slot-number">${i + 1}</span>
        `;

        // 칸 클릭 및 롱프레스 핸들러 바인딩 (모바일 터치 & 데스크톱 마우스 대응)
        let pressTimer = null;
        let preventClick = false;

        const startPress = (e) => {
            if (e.type === 'mousedown' && e.button !== 0) return;
            preventClick = false;
            pressTimer = setTimeout(() => {
                preventClick = true;
                handleSlotLongPress(i, isActive);
            }, 600); // 600ms 롱프레스 임계값
        };

        const cancelPress = () => {
            if (pressTimer) {
                clearTimeout(pressTimer);
                pressTimer = null;
            }
        };

        const endPress = (e) => {
            if (pressTimer) {
                clearTimeout(pressTimer);
                pressTimer = null;
            }
        };

        // 데스크톱 마우스 이벤트
        slot.addEventListener("mousedown", startPress);
        slot.addEventListener("mouseup", endPress);
        slot.addEventListener("mouseleave", cancelPress);

        // 모바일 터치 이벤트
        slot.addEventListener("touchstart", startPress, { passive: true });
        slot.addEventListener("touchend", endPress, { passive: true });
        slot.addEventListener("touchcancel", cancelPress, { passive: true });
        slot.addEventListener("touchmove", cancelPress, { passive: true });

        // 클릭 이벤트 (짧은 터치 / 클릭)
        slot.addEventListener("click", (e) => {
            if (preventClick) {
                e.preventDefault();
                preventClick = false;
                return;
            }
            handleSlotClick(i, isActive);
        });

        stickerGrid.appendChild(slot);
    }

    // 5. 모달 내의 필드 업데이트 (현재 설정 대입)
    if (editReaderName) editReaderName.value = currentBoard.reader_role_name || "남자친구 모드 (조회 전용)";
    if (editEditorName) editEditorName.value = currentBoard.editor_role_name || "여자친구 모드 (부착 가능)";
    if (editPin) editPin.value = currentBoard.editor_pin || "";

    // 로딩 종료 및 컨텐츠 표출
    loadingSpinner.classList.add("hidden");
    appContent.classList.remove("hidden");
}

// 날짜 포맷 함수
function formatDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const date = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    return `${year}년 ${month}월 ${date}일 ${hours}:${minutes}`;
}

// 스티커 슬롯 클릭 제어 (짧은 클릭: 메모 작성 또는 조회)
async function handleSlotClick(index, isActive) {
    if (isActive) {
        // 이미 붙은 스티커 클릭 시: 메모 모달창 노출
        editTargetIndex = index;
        const sticker = currentStickers.find(s => s.sticker_index === index);
        const rawMemo = sticker && sticker.memo ? sticker.memo : "";
        const parsed = parseStickerMemo(rawMemo);
        
        const displayMemoText = parsed.memo ? parsed.memo : "등록된 칭찬 메모가 없습니다. 🧸";
        const createdDate = sticker && sticker.created_at ? formatDate(sticker.created_at) : "";
        const updatedDate = sticker && sticker.updated_at ? formatDate(sticker.updated_at) : "";

        // 최초 생성 시간과 최근 수정 시간의 차이가 5초 이상인 경우에만 실제 수정된 것으로 간주
        const createdTime = sticker && sticker.created_at ? new Date(sticker.created_at).getTime() : 0;
        const updatedTime = sticker && sticker.updated_at ? new Date(sticker.updated_at).getTime() : 0;
        const isModified = createdTime && updatedTime && Math.abs(updatedTime - createdTime) > 5000;

        viewStickerMemoText.textContent = displayMemoText;
        viewStickerCreatedAt.textContent = createdDate ? `최초 작성: ${createdDate}` : "";
        
        if (updatedDate && isModified) {
            viewStickerUpdatedAt.textContent = `최근 수정: ${updatedDate}`;
            viewStickerUpdatedAt.classList.remove("hidden");
        } else {
            viewStickerUpdatedAt.textContent = "";
            viewStickerUpdatedAt.classList.add("hidden");
        }

        // 수정/저장 관련 UI 초기화
        document.querySelector("#modal-memo-view .memo-view-content").classList.remove("hidden");
        memoEditArea.classList.add("hidden");
        btnMemoEditCancel.classList.add("hidden");
        btnMemoEditSave.classList.add("hidden");
        btnMemoViewClose.classList.remove("hidden");

        if (isEditorMode) {
            btnMemoEditStart.classList.remove("hidden");
        } else {
            btnMemoEditStart.classList.add("hidden");
        }

        modalMemoView.classList.remove("hidden");
    } else {
        // 빈칸 클릭 시: 편집자만 스티커 선택 & 메모 작성 모달 노출
        if (!isEditorMode) {
            showToast("스티커 추가는 여자친구(편집자)만 가능해요! 🧸");
            return;
        }
        memoTargetIndex = index;
        selectedStickerType = index % 10; // 기본 선택 스티커
        inputStickerMemo.value = "";
        
        renderStickerPickerGrid();
        
        modalMemoInput.classList.remove("hidden");
        inputStickerMemo.focus();
    }
}

// 스티커 슬롯 롱프레스 제어 (길게 누르기: 스티커 떼기)
async function handleSlotLongPress(index, isActive) {
    if (!isActive) return; // 빈칸은 롱프레스 무시

    if (!isEditorMode) {
        showToast("스티커 제거는 여자친구(편집자)만 가능해요! 🧸");
        return;
    }

    deleteTargetIndex = index;
    deleteConfirmText.textContent = `스티커를 떼겠습니까?`;
    modalDelete.classList.remove("hidden");
}

// ==========================================
// 7. 역할 모드 토글 (인증 및 로그아웃)
// ==========================================
function updateRoleUI() {
    const globalReaderName = localStorage.getItem("global_reader_role_name");
    const globalEditorName = localStorage.getItem("global_editor_role_name");

    if (isEditorMode) {
        if (btnToggleRole) btnToggleRole.className = "sidebar-role-btn editor-mode";
        if (roleIcon) roleIcon.textContent = "edit";
        if (roleText) roleText.textContent = globalEditorName || (currentBoard && currentBoard.editor_role_name) || "여자친구 모드 (부착 가능)";

        // 설정 모달 내 필드 활성화
        document.querySelectorAll(".editor-only-field").forEach(el => el.disabled = false);
        btnSettingsSave.classList.remove("hidden");
    } else {
        if (btnToggleRole) btnToggleRole.className = "sidebar-role-btn reader-mode";
        if (roleIcon) roleIcon.textContent = "visibility";
        if (roleText) roleText.textContent = globalReaderName || (currentBoard && currentBoard.reader_role_name) || "남자친구 모드 (조회 전용)";

        // 설정 모달 내 필드 비활성화
        document.querySelectorAll(".editor-only-field").forEach(el => el.disabled = true);
        btnSettingsSave.classList.add("hidden");
    }
}

// ==========================================
// 8. 다이얼로그 모달 상호작용 및 이벤트 리스너
// ==========================================

// 토스트 메시지 띄우기
let toastTimeout = null;
function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.remove("hidden");
    toast.style.opacity = 1;

    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.style.opacity = 0;
        setTimeout(() => toast.classList.add("hidden"), 300);
    }, 2500);
}

// PIN 번호 확인 처리
btnPinSubmit.addEventListener("click", () => {
    const pin = inputPin.value.trim();
    const requiredPin = localStorage.getItem("global_editor_pin") || (currentBoard && currentBoard.editor_pin) || "1234";

    if (pin === requiredPin) {
        isEditorMode = true;
        localStorage.setItem("is_editor", "true"); // 전역 인증 승인
        localStorage.setItem("global_editor_pin", pin);
        inputPin.value = "";
        pinError.classList.add("hidden");
        modalPin.classList.add("hidden");
        updateRoleUI();
        refreshApp();
        showToast("여자친구 편집 권한이 승인되었습니다! 🌸");
    } else {
        pinError.classList.remove("hidden");
    }
});

btnPinCancel.addEventListener("click", () => {
    inputPin.value = "";
    pinError.classList.add("hidden");
    modalPin.classList.add("hidden");
});

// 역할 전환 버튼
btnToggleRole.addEventListener("click", () => {
    if (isEditorMode) {
        isEditorMode = false;
        localStorage.removeItem("is_editor"); // 로그아웃 시 전역 인증 승인 기록 삭제
        updateRoleUI();
        refreshApp();
        showToast("조회 전용 모드로 복귀했습니다.");
    } else {
        modalPin.classList.remove("hidden");
        inputPin.focus();
    }
});

// 새 칭찬판 만들기 다이얼로그 노출
btnShare.addEventListener("click", () => {
    modalShare.classList.remove("hidden");
    inputCreateBoardTitle.value = "";
    inputCreateBoardTitle.focus();
});

btnShareClose.addEventListener("click", () => {
    modalShare.classList.add("hidden");
});

// 새로운 칭찬판 생성 (백그라운드에서 난수 코드 자동 생성 및 대조)
btnCreateBoard.addEventListener("click", async () => {
    const titleVal = inputCreateBoardTitle.value.trim();
    const finalTitle = titleVal || "TEST";

    loadingSpinner.classList.remove("hidden");
    modalShare.classList.add("hidden");

    // 고유한 순차 코드 생성 (예: TEST-BOARD-001)
    let finalCode = "";
    let boardNum = 1;
    while (true) {
        const numStr = String(boardNum).padStart(3, '0');
        const tempCode = `TEST-BOARD-${numStr}`;
        const existing = await apiGetBoard(tempCode);
        if (!existing) {
            finalCode = tempCode;
            break;
        }
        boardNum++;
    }

    const newBoard = {
        id: finalCode,
        title: finalTitle,
        target_count: 30,
        reward_text: "새로운 선물 지정하기",
        editor_pin: currentBoard ? currentBoard.editor_pin : "1234"
    };

    const success = await apiCreateBoard(newBoard);
    if (success) {
        currentBoardId = finalCode;
        localStorage.setItem("current_board_id", finalCode);
        localStorage.setItem("is_editor", "true"); // 신규 생성 시 즉시 자동 로그인 세션 등록
        inputCreateBoardTitle.value = ""; // 입력창 초기화
        isEditorMode = true; // 새로 만든 판은 즉시 편집자 권한 부여
        updateRoleUI();
        await refreshApp();
        
        showToast("새 칭찬판이 생성되었습니다! 🚀");
    } else {
        showToast("칭찬판 개설에 실패했습니다.");
        loadingSpinner.classList.add("hidden");
        modalShare.classList.remove("hidden");
    }
});

// 설정 다이얼로그 노출/숨김
btnSettings.addEventListener("click", () => {
    modalSettings.classList.remove("hidden");
});

btnSettingsClose.addEventListener("click", () => {
    modalSettings.classList.add("hidden");
});

// 칭찬판 코드 스위칭
btnSwitchBoard.addEventListener("click", async () => {
    const code = inputSwitchBoard.value.trim().toUpperCase();
    if (!code) {
        showToast("코드를 입력해 주세요.");
        return;
    }

    loadingSpinner.classList.remove("hidden");
    modalSettings.classList.add("hidden");

    const board = await apiGetBoard(code);
    if (board) {
        currentBoardId = code;
        localStorage.setItem("current_board_id", code);
        inputSwitchBoard.value = "";
        isEditorMode = localStorage.getItem("is_editor") === "true"; // 전역 인증 상태 유지
        updateRoleUI();
        await refreshApp();
        showToast(`칭찬판 '${board.title}'을 성공적으로 불러왔습니다!`);
    } else {
        showToast("존재하지 않는 칭찬판 공유 코드입니다.");
        loadingSpinner.classList.add("hidden");
        modalSettings.classList.remove("hidden");
    }
});

// 칭찬판 세부 설정 변경 및 저장 (보안 및 라벨 전용)
btnSettingsSave.addEventListener("click", async () => {
    if (!isEditorMode) return;

    loadingSpinner.classList.remove("hidden");
    modalSettings.classList.add("hidden");

    const newPin = editPin.value.trim();
    const newReaderName = editReaderName.value.trim();
    const newEditorName = editEditorName.value.trim();

    if (newPin) localStorage.setItem("global_editor_pin", newPin);
    if (newReaderName) localStorage.setItem("global_reader_role_name", newReaderName);
    if (newEditorName) localStorage.setItem("global_editor_role_name", newEditorName);

    const updated = {
        ...currentBoard,
        editor_pin: newPin || (currentBoard && currentBoard.editor_pin) || "1234",
        reader_role_name: newReaderName || (currentBoard && currentBoard.reader_role_name) || "남자친구 모드 (조회 전용)",
        editor_role_name: newEditorName || (currentBoard && currentBoard.editor_role_name) || "여자친구 모드 (부착 가능)"
    };

    const success = await apiCreateBoard(updated);
    if (success) {
        currentBoard = updated;
        await refreshApp();
        showToast("칭찬판 보안 및 라벨 설정이 변경되었습니다. ✨");
    } else {
        showToast("설정 저장에 실패했습니다.");
        loadingSpinner.classList.add("hidden");
        modalSettings.classList.remove("hidden");
    }
});

// 칭찬판 정보 수정 저장 처리 (길게 누르기 모달)
btnBoardEditSave.addEventListener("click", async () => {
    if (!editTargetBoard) return;
    const hasPermission = localStorage.getItem("is_editor") === "true";
    if (!hasPermission) return;

    const count = parseInt(editBoardTargetCount.value);
    if (isNaN(count) || count < 1 || count > 100) {
        showToast("올바른 목표 개수(1~100)를 입력하세요.");
        return;
    }

    loadingSpinner.classList.remove("hidden");
    if (modalBoardEdit) modalBoardEdit.classList.add("hidden");

    const updatedBoard = {
        ...editTargetBoard,
        title: editBoardTitle.value.trim() || editTargetBoard.title,
        target_count: count,
        reward_text: editBoardReward.value.trim()
    };

    const success = await apiCreateBoard(updatedBoard);
    if (success) {
        // 로컬 레지스트리 목록 캐시 이름 갱신
        addRegisteredBoard(editTargetBoard.id, updatedBoard.title);

        if (editTargetBoard.id === currentBoardId) {
            currentBoard = updatedBoard;
            await refreshApp();
        } else {
            renderBoardList();
            loadingSpinner.classList.add("hidden");
        }
        showToast("칭찬판이 성공적으로 수정되었습니다! ✨");
        editTargetBoard = null;
    } else {
        showToast("설정 저장에 실패했습니다.");
        loadingSpinner.classList.add("hidden");
        if (modalBoardEdit) modalBoardEdit.classList.remove("hidden");
    }
});

btnBoardEditClose.addEventListener("click", () => {
    editTargetBoard = null;
    if (modalBoardEdit) modalBoardEdit.classList.add("hidden");
});

// 스티커 제거 또는 스티커판 삭제 확인 처리
btnDeleteConfirm.addEventListener("click", async () => {
    loadingSpinner.classList.remove("hidden");
    modalDelete.classList.add("hidden");

    // (A) 스티커판(보드) 삭제 처리
    if (deleteTargetBoardId) {
        const boardIdToDelete = deleteTargetBoardId;
        deleteTargetBoardId = null;
        const wasActive = boardIdToDelete === currentBoardId;

        await apiDeleteBoard(boardIdToDelete);
        removeRegisteredBoard(boardIdToDelete);

        if (wasActive) {
            sidebar.classList.remove("open");
            sidebarOverlay.classList.add("hidden");
            isEditorMode = localStorage.getItem("is_editor") === "true";
            updateRoleUI();
            const newUrl = `${window.location.origin}${window.location.pathname}?board=${currentBoardId}`;
            window.history.replaceState({ path: newUrl }, "", newUrl);
            await refreshApp();
        } else {
            renderBoardList();
            loadingSpinner.classList.add("hidden");
        }
        showToast("스티커판이 완전히 삭제되었습니다.");
        return;
    }

    // (B) 스티커 제거 처리
    if (deleteTargetIndex === null) {
        loadingSpinner.classList.add("hidden");
        return;
    }

    const success = await apiRemoveSticker(currentBoardId, deleteTargetIndex);
    if (success) {
        showToast(`${deleteTargetIndex + 1}번째 스티커를 제거했습니다.`);
        deleteTargetIndex = null;
        await refreshApp();
    } else {
        showToast("스티커 제거 실패");
        loadingSpinner.classList.add("hidden");
    }
});

btnDeleteCancel.addEventListener("click", () => {
    deleteTargetIndex = null;
    deleteTargetBoardId = null;
    modalDelete.classList.add("hidden");
});

// 칭찬 메모 입력 모달 이벤트 리스너
btnMemoSubmit.addEventListener("click", async () => {
    if (memoTargetIndex === null) return;
    const memoText = inputStickerMemo.value.trim();
    const formattedMemo = `[type:${selectedStickerType}] ${memoText}`;

    loadingSpinner.classList.remove("hidden");
    modalMemoInput.classList.add("hidden");

    const success = await apiAddSticker(currentBoardId, memoTargetIndex, formattedMemo);
    if (success) {
        const creatureName = SEA_CREATURES[selectedStickerType] ? SEA_CREATURES[selectedStickerType].name : "해양생물";
        showToast(`${memoTargetIndex + 1}번째 칸에 ${creatureName} 스티커 부착 완료! 🌊💙`);
        memoTargetIndex = null;
        await refreshApp();
    } else {
        showToast("스티커 부착 중 에러가 발생했습니다.");
        loadingSpinner.classList.add("hidden");
    }
});

btnMemoCancel.addEventListener("click", () => {
    memoTargetIndex = null;
    modalMemoInput.classList.add("hidden");
});

// 칭찬 메모 확인 모달 이벤트 리스너
btnMemoViewClose.addEventListener("click", () => {
    editTargetIndex = null;
    modalMemoView.classList.add("hidden");
});

// 메모 수정 시작
btnMemoEditStart.addEventListener("click", () => {
    if (editTargetIndex === null) return;
    const sticker = currentStickers.find(s => s.sticker_index === editTargetIndex);
    const parsed = parseStickerMemo(sticker && sticker.memo ? sticker.memo : "");
    inputEditStickerMemo.value = parsed.memo;
    
    // UI 전환
    document.querySelector("#modal-memo-view .memo-view-content").classList.add("hidden");
    memoEditArea.classList.remove("hidden");
    
    btnMemoEditStart.classList.add("hidden");
    btnMemoViewClose.classList.add("hidden");
    btnMemoEditCancel.classList.remove("hidden");
    btnMemoEditSave.classList.remove("hidden");
    
    inputEditStickerMemo.focus();
});

// 메모 수정 취소
btnMemoEditCancel.addEventListener("click", () => {
    document.querySelector("#modal-memo-view .memo-view-content").classList.remove("hidden");
    memoEditArea.classList.add("hidden");
    
    btnMemoEditStart.classList.remove("hidden");
    btnMemoViewClose.classList.remove("hidden");
    btnMemoEditCancel.classList.add("hidden");
    btnMemoEditSave.classList.add("hidden");
});

// 메모 수정 저장
btnMemoEditSave.addEventListener("click", async () => {
    if (editTargetIndex === null) return;
    const newMemoText = inputEditStickerMemo.value.trim();
    
    const sticker = currentStickers.find(s => s.sticker_index === editTargetIndex);
    const parsed = parseStickerMemo(sticker ? sticker.memo : "");
    const keepType = parsed.type !== null ? parsed.type : (editTargetIndex % 10);
    const formattedMemo = `[type:${keepType}] ${newMemoText}`;

    loadingSpinner.classList.remove("hidden");
    modalMemoView.classList.add("hidden");
    
    const success = await apiUpdateStickerMemo(currentBoardId, editTargetIndex, formattedMemo);
    if (success) {
        showToast("칭찬 메모가 수정되었습니다. ✨");
        editTargetIndex = null;
        await refreshApp();
    } else {
        showToast("메모 수정에 실패했습니다.");
        loadingSpinner.classList.add("hidden");
        modalMemoView.classList.remove("hidden");
    }
});

// ==========================================
// 9. 앱 초기 구동 및 실시간 데이터 싱크 폴링
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    // 1. 기존 데모/더미 데이터 로컬스토리지 캐시 정리
    localStorage.removeItem("board_DEFAULT");
    localStorage.removeItem("stickers_DEFAULT");

    // [소독 패치] 무효한 데이터 정리 및 유효한 보드 보존
    try {
        const boards = JSON.parse(localStorage.getItem("registered_boards") || "[]");
        if (boards.length > 0) {
            const cleaned = boards.filter(b => b && b.id && typeof b.id === "string");
            if (cleaned.length !== boards.length) {
                localStorage.setItem("registered_boards", JSON.stringify(cleaned));
            }
        }
    } catch (e) {
        console.error("로컬 스토리지 칭찬판 리스트 정리 중 오류:", e);
    }

    // 2. URL 쿼리 파라미터에서 보드 ID가 넘어온 경우 자동 설정
    const urlParams = new URLSearchParams(window.location.search);
    const boardParam = urlParams.get("board");
    if (boardParam) {
        currentBoardId = boardParam.trim().toUpperCase();
        localStorage.setItem("current_board_id", currentBoardId);
        // URL로 진입할 때 전역 인증 상태 복원
        isEditorMode = localStorage.getItem("is_editor") === "true";
    }

    updateRoleUI();
    refreshApp();

    // 사이드바 토글 및 기능 바인딩
    if (btnMenu) {
        btnMenu.addEventListener("click", () => {
            sidebar.classList.add("open");
            sidebarOverlay.classList.remove("hidden");
            renderBoardList(); // 열릴 때 최신 목록 렌더링
        });
    }

    if (btnSidebarClose) {
        btnSidebarClose.addEventListener("click", () => {
            sidebar.classList.remove("open");
            sidebarOverlay.classList.add("hidden");
        });
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener("click", () => {
            sidebar.classList.remove("open");
            sidebarOverlay.classList.add("hidden");
        });
    }
    
    if (btnAddBoardSidebar) {
        btnAddBoardSidebar.addEventListener("click", () => {
            sidebar.classList.remove("open");
            sidebarOverlay.classList.add("hidden");
            
            // 공유/생성 모달을 열고 새 보드 생성 인풋에 포커싱
            modalShare.classList.remove("hidden");
            inputCreateBoardTitle.value = "";
            inputCreateBoardTitle.focus();
        });
    }

    // 2. 웰컴 스크린 칭찬판 최초 생성 처리
    btnSetupSubmit.addEventListener("click", async () => {
        const code = setupBoardId.value.trim().toUpperCase();
        const title = setupTitle.value.trim();
        const target = parseInt(setupTargetCount.value);
        const reward = setupReward.value.trim();
        const pin = setupPin.value.trim();

        if (!code) {
            showToast("공유 코드를 입력해 주세요.");
            return;
        }
        if (!code.startsWith("TEST-")) {
            showToast("보안을 위해 테스트용 보드(TEST-로 시작)만 새로 생성하거나 덮어쓸 수 있습니다.");
            return;
        }
        if (!title) {
            showToast("칭찬판 제목을 입력해 주세요.");
            return;
        }
        if (isNaN(target) || target < 1 || target > 100) {
            showToast("올바른 목표 개수(1~100)를 입력하세요.");
            return;
        }
        if (!pin) {
            showToast("비밀번호 PIN을 입력해 주세요.");
            return;
        }

        loadingSpinner.classList.remove("hidden");
        welcomeScreen.classList.add("hidden");

        const newBoard = {
            id: code,
            title: title,
            target_count: target,
            reward_text: reward,
            editor_pin: pin
        };

        const success = await apiCreateBoard(newBoard);
        if (success) {
            currentBoardId = code;
            localStorage.setItem("current_board_id", code);
            localStorage.setItem("is_editor", "true"); // 최초 개설 시 로컬에 자동 전역 로그인 세션 활성화
            localStorage.setItem("global_editor_pin", pin);
            // 생성 시에는 자동으로 편집자 모드 승인
            isEditorMode = true;
            updateRoleUI();
            await refreshApp();
            showToast("칭찬판이 성공적으로 개설되었습니다! 🚀");
            
            // 브라우저 주소창 URL 업데이트
            const newUrl = `${window.location.origin}${window.location.pathname}?board=${code}`;
            window.history.replaceState({ path: newUrl }, "", newUrl);
        } else {
            showToast("칭찬판 개설에 실패했습니다.");
            welcomeScreen.classList.remove("hidden");
            loadingSpinner.classList.add("hidden");
        }
    });

    // 3. 웰컴 스크린 접속하기 처리
    if (btnWelcomeConnect) {
        btnWelcomeConnect.addEventListener("click", async () => {
            const code = welcomeInputBoardId.value.trim().toUpperCase();
            if (!code) {
                showToast("공유 코드를 입력해 주세요.");
                return;
            }

            loadingSpinner.classList.remove("hidden");
            const board = await apiGetBoard(code);
            if (board) {
                currentBoardId = code;
                localStorage.setItem("current_board_id", code);
                welcomeInputBoardId.value = "";
                isEditorMode = localStorage.getItem("is_editor") === "true"; // 전역 인증 상태 유지
                updateRoleUI();
                await refreshApp();
                showToast(`칭찬판 '${board.title}'을 성공적으로 불러왔습니다!`);
                
                // 브라우저 주소창 URL 업데이트
                const newUrl = `${window.location.origin}${window.location.pathname}?board=${code}`;
                window.history.replaceState({ path: newUrl }, "", newUrl);
            } else {
                showToast("존재하지 않는 칭찬판 공유 코드입니다.");
                loadingSpinner.classList.add("hidden");
            }
        });
    }

    // 4. 웰컴 스크린 새 스티커판 만들기 화면 전환
    if (btnWelcomeShowCreate) {
        btnWelcomeShowCreate.addEventListener("click", async () => {
            loadingSpinner.classList.remove("hidden");

            // 고유한 순차 코드 생성 (예: TEST-BOARD-001)
            let finalCode = "";
            let boardNum = 1;
            while (true) {
                const numStr = String(boardNum).padStart(3, '0');
                const tempCode = `TEST-BOARD-${numStr}`;
                const existing = await apiGetBoard(tempCode);
                if (!existing) {
                    finalCode = tempCode;
                    break;
                }
                boardNum++;
            }

            setupBoardId.value = finalCode;
            setupTitle.value = "TEST";
            setupTargetCount.value = "30";
            setupReward.value = "맛있는 디저트 데이트! 🍦";
            setupPin.value = "1234";

            if (welcomeConnectCard) welcomeConnectCard.classList.add("hidden");
            if (welcomeCreateCard) welcomeCreateCard.classList.remove("hidden");
            
            loadingSpinner.classList.add("hidden");
        });
    }

    // 5. 웰컴 스크린 생성 화면에서 이전(접속) 화면으로 돌아가기
    if (btnWelcomeBack) {
        btnWelcomeBack.addEventListener("click", () => {
            if (welcomeCreateCard) welcomeCreateCard.classList.add("hidden");
            if (welcomeConnectCard) welcomeConnectCard.classList.remove("hidden");
        });
    }

    // 타 기기에서의 업데이트 감지를 위해 5초마다 자동 싱크 (폴링)
    setInterval(() => {
        // 사용자가 입력을 입력하거나 모달 창을 띄운 작업 중이 아닐 때만 렌더링 리프레시 진행해 간섭 차단
        const isModalOpen = !modalPin.classList.contains("hidden") ||
            !modalSettings.classList.contains("hidden") ||
            !modalDelete.classList.contains("hidden") ||
            !modalShare.classList.contains("hidden");

        if (!isModalOpen) {
            apiGetStickers(currentBoardId).then(stickers => {
                const currentActive = new Set(currentStickers.map(s => s.sticker_index));
                const newActive = new Set(stickers.map(s => s.sticker_index));

                // 스티커 구성원 변경 시에만 화면 부분 렌더링 리프레시 실행
                if (currentActive.size !== newActive.size || [...currentActive].some(x => !newActive.has(x))) {
                    refreshApp();
                }
            }).catch(err => console.error("백그라운드 스티커 싱크 실패", err));
        }
    }, 5000);
});
