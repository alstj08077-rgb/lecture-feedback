/**
 * 비대면 강의 경험 설문조사 - Google Apps Script
 *
 * 핵심 변경점:
 * - device 컬럼 제거
 * - 사후 인지 제출 시 즉시 저장
 * - 빈 데이터 / 미완료 데이터 차단
 * - 중복 응답 차단
 */

// ⚠️ 본인 시트 ID로 변경 (URL의 /d/와 /edit 사이 문자열)
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
const SHEET_NAME = 'responses';

// 시트 컬럼 순서
const COLUMNS = [
  'participant_id',
  'group',
  'timestamp_start',
  'timestamp_end',
  'total_duration_sec',
  'consent_required',
  'consent_opt1',
  'consent_opt2',
  'consent_all_clicked',
  'more_clicked',
  'more_view_duration_sec',
  'tos_dwell_sec',
  'tos_scroll_max_pct',
  // 설문 응답
  'survey_q1', 'survey_q2', 'survey_q3', 'survey_q4', 'survey_q5',
  'survey_q6', 'survey_q7', 'survey_q8', 'survey_q9', 'survey_q10',
  'survey_q11', 'survey_q12', 'survey_q13', 'survey_q14', 'survey_q15',
  // 사후 인지
  'post_postQ1', 'post_postQ2',
  'post_postQ3', 'post_postQ4', 'post_postQ5',
  'post_postQ4_pre', 'post_postQ4_post'
];

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // 1) 필수 필드 검증
    if (!data.participant_id || !data.group) {
      return jsonResponse({ status: 'error', message: 'missing required fields' });
    }

    // 2) 그룹 값 검증
    if (!['A', 'B', 'C'].includes(data.group)) {
      return jsonResponse({ status: 'error', message: 'invalid group' });
    }

    // 3) 설문 완료 여부 검증
    if (!data.consent_required) {
      return jsonResponse({ status: 'error', message: 'survey not completed' });
    }

    // 4) 중복 응답 차단
    if (isDuplicate(data.participant_id)) {
      return jsonResponse({ status: 'error', message: 'duplicate participant_id' });
    }

    appendRow(data);
    return jsonResponse({ status: 'success' });
  } catch (error) {
    return jsonResponse({ status: 'error', message: error.toString() });
  }
}

function doGet(e) {
  return jsonResponse({ status: 'ok', message: 'Apps Script 정상 작동 중' });
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function isDuplicate(participantId) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) return false;

  const ids = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues().flat();
  return ids.includes(participantId);
}

function appendRow(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(COLUMNS);

    const headerRange = sheet.getRange(1, 1, 1, COLUMNS.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#1e3a5f');
    headerRange.setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(COLUMNS);
  }

  const row = COLUMNS.map(col => {
    const value = data[col];
    if (value === undefined || value === null) return '';
    if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
    return value;
  });

  sheet.appendRow(row);
}

/**
 * 테스트용 - 더미 데이터 추가
 */
function testAppend() {
  const testData = {
    participant_id: 'test-' + new Date().getTime(),
    group: 'A',
    timestamp_start: new Date().toISOString(),
    timestamp_end: new Date().toISOString(),
    total_duration_sec: 120,
    consent_required: '동의',
    consent_opt1: '동의',
    consent_opt2: '동의',
    consent_all_clicked: true,
    more_clicked: false,
    more_view_duration_sec: 0,
    tos_dwell_sec: 5.3,
    tos_scroll_max_pct: 80,
    survey_q1: '자취',
    survey_q2: '3학년',
    post_postQ1: '개인정보 수집',
    post_postQ2: '읽지 않았습니다'
  };

  appendRow(testData);
  Logger.log('테스트 데이터 추가 완료. 시트를 확인하세요.');
}

/**
 * 모든 응답 데이터 초기화 (헤더만 남김)
 * ⚠️ 본 실험 중에는 실행 금지!
 */
function clearAllData() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (sheet && sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
    Logger.log('데이터가 모두 삭제되었습니다.');
  }
}
