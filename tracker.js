/* ============================================
   비대면 강의 경험 설문조사 - 측정 로직
   ============================================ */

// ⚠️ 배포 후 여기에 Apps Script 웹 앱 URL을 넣으세요
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxV31fNbHCnt6yYBd5Jy0kUXi9_MowF7PfxXI6Zq5YjAeFoK0OJgemwqN45EsFl8OhD/exec';

// 전역 데이터 저장소
const trackerData = {
  participant_id: '',
  group: '',
  timestamp_start: '',
  timestamp_end: '',
  total_duration_sec: 0,
  consent_required: '',
  consent_opt1: '',
  consent_opt2: '',
  consent_all_clicked: false,
  more_clicked: false,
  more_view_duration_sec: 0,
  tos_dwell_sec: 0,
  tos_scroll_max_pct: 0,
  survey_answers: {},
  post_answers: {}
};

// 내부 상태
let _moreOpenedAt = null;
let _tosInViewSince = null;

/* ─────────────────────────────────────────────
   초기화
   ───────────────────────────────────────────── */
function initTracker(group) {
  const saved = sessionStorage.getItem('trackerData');
  if (saved) {
    Object.assign(trackerData, JSON.parse(saved));
  }

  if (!trackerData.participant_id) {
    trackerData.participant_id = generateUUID();
    trackerData.timestamp_start = new Date().toISOString();
  }

  trackerData.group = group;
  saveSession();
}

function generateUUID() {
  return 'p-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 9);
}

function saveSession() {
  sessionStorage.setItem('trackerData', JSON.stringify(trackerData));
}

/* ─────────────────────────────────────────────
   이벤트 트래킹
   ───────────────────────────────────────────── */
function trackEvent(eventName, value) {
  if (eventName === 'consent_all_clicked') {
    trackerData.consent_all_clicked = value;
  } else if (eventName === 'more_clicked') {
    if (value === true && !trackerData.more_clicked) {
      trackerData.more_clicked = true;
      _moreOpenedAt = Date.now();
    } else if (value === false && _moreOpenedAt) {
      trackerData.more_view_duration_sec += (Date.now() - _moreOpenedAt) / 1000;
      _moreOpenedAt = null;
    }
  }
  saveSession();
}

/* ─────────────────────────────────────────────
   약관 영역 체류 시간 측정
   ───────────────────────────────────────────── */
function observeConsentDwell(sectionId) {
  const el = document.getElementById(sectionId);
  if (!el) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
        if (!_tosInViewSince) _tosInViewSince = Date.now();
      } else {
        if (_tosInViewSince) {
          trackerData.tos_dwell_sec += (Date.now() - _tosInViewSince) / 1000;
          _tosInViewSince = null;
          saveSession();
        }
      }
    });
  }, { threshold: [0, 0.3, 0.7, 1.0] });

  observer.observe(el);

  window.addEventListener('beforeunload', () => {
    if (_tosInViewSince) {
      trackerData.tos_dwell_sec += (Date.now() - _tosInViewSince) / 1000;
    }
    if (_moreOpenedAt) {
      trackerData.more_view_duration_sec += (Date.now() - _moreOpenedAt) / 1000;
    }
    saveSession();
  });

  window.addEventListener('scroll', () => {
    const rect = el.getBoundingClientRect();
    const elTop = rect.top + window.scrollY;
    const elBottom = elTop + el.offsetHeight;
    const viewBottom = window.scrollY + window.innerHeight;

    if (viewBottom > elTop) {
      const visibleBottom = Math.min(viewBottom, elBottom);
      const pct = ((visibleBottom - elTop) / el.offsetHeight) * 100;
      if (pct > trackerData.tos_scroll_max_pct) {
        trackerData.tos_scroll_max_pct = Math.min(100, Math.round(pct));
        saveSession();
      }
    }
  }, { passive: true });
}

/* ─────────────────────────────────────────────
   폼 데이터 수집
   ───────────────────────────────────────────── */
function collectFormData(formEl) {
  const data = {};

  formEl.querySelectorAll('input, textarea, select').forEach(input => {
    if (input.name === '') return;

    if (input.type === 'checkbox') {
      if (!data[input.name]) data[input.name] = [];
      if (input.checked) {
        if (Array.isArray(data[input.name])) {
          data[input.name].push(input.value);
        }
      }
    } else if (input.type === 'radio') {
      if (input.checked) data[input.name] = input.value;
    } else {
      if (input.value) data[input.name] = input.value;
    }
  });

  Object.keys(data).forEach(k => {
    if (Array.isArray(data[k])) data[k] = data[k].join(', ');
  });

  return data;
}

/* ─────────────────────────────────────────────
   설문지 → 사후 인지로 이동 (저장 X)
   ───────────────────────────────────────────── */
function finalizeAndProceed(formData, nextPage) {
  trackerData.consent_required = formData.consent_required || '';
  trackerData.consent_opt1 = formData.consent_opt1 || '';
  trackerData.consent_opt2 = formData.consent_opt2 || '';

  const surveyAnswers = {};
  Object.keys(formData).forEach(k => {
    if (!k.startsWith('consent_')) {
      surveyAnswers[k] = formData[k];
    }
  });
  trackerData.survey_answers = surveyAnswers;

  // 마지막 정산
  if (_tosInViewSince) {
    trackerData.tos_dwell_sec += (Date.now() - _tosInViewSince) / 1000;
    _tosInViewSince = null;
  }
  if (_moreOpenedAt) {
    trackerData.more_view_duration_sec += (Date.now() - _moreOpenedAt) / 1000;
    _moreOpenedAt = null;
  }

  trackerData.tos_dwell_sec = Math.round(trackerData.tos_dwell_sec * 10) / 10;
  trackerData.more_view_duration_sec = Math.round(trackerData.more_view_duration_sec * 10) / 10;

  saveSession();
  window.location.href = nextPage;
}

/* ─────────────────────────────────────────────
   사후 인지 제출 → 데이터 시트에 저장 후 디브리핑으로 이동
   ───────────────────────────────────────────── */
function savePostAndProceed(formData, nextPage) {
  trackerData.post_answers = formData;
  trackerData.timestamp_end = new Date().toISOString();
  trackerData.total_duration_sec = Math.round(
    (new Date(trackerData.timestamp_end) - new Date(trackerData.timestamp_start)) / 1000
  );

  // 중복 전송 방지
  if (sessionStorage.getItem('data_sent') === 'true') {
    window.location.href = nextPage;
    return;
  }

  const flatData = flattenData(trackerData);

  // sendBeacon으로 안정적 전송 (모바일에서도 잘 작동)
  sendData(flatData);

  // 전송 완료 플래그
  sessionStorage.setItem('data_sent', 'true');

  // 디브리핑 페이지로 이동
  window.location.href = nextPage;
}

function flattenData(data) {
  const flat = {
    participant_id: data.participant_id,
    group: data.group,
    timestamp_start: data.timestamp_start,
    timestamp_end: data.timestamp_end,
    total_duration_sec: data.total_duration_sec,
    consent_required: data.consent_required,
    consent_opt1: data.consent_opt1,
    consent_opt2: data.consent_opt2,
    consent_all_clicked: data.consent_all_clicked,
    more_clicked: data.more_clicked,
    more_view_duration_sec: data.more_view_duration_sec,
    tos_dwell_sec: data.tos_dwell_sec,
    tos_scroll_max_pct: data.tos_scroll_max_pct
  };

  Object.keys(data.survey_answers || {}).forEach(k => {
    flat['survey_' + k] = data.survey_answers[k];
  });

  Object.keys(data.post_answers || {}).forEach(k => {
    flat['post_' + k] = data.post_answers[k];
  });

  return flat;
}

/* ─────────────────────────────────────────────
   데이터 전송 (sendBeacon 우선)
   ───────────────────────────────────────────── */
function sendData(data) {
  if (!data.participant_id || !data.group) {
    console.warn('필수 데이터 없음');
    return;
  }

  if (APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_URL_HERE') {
    console.warn('Apps Script URL 미설정');
    console.log('데이터:', data);
    return;
  }

  // sendBeacon 우선 (페이지 이동해도 끝까지 전송됨, 모바일 안정적)
  // text/plain으로 보내야 CORS preflight 안 일어남
  if (navigator.sendBeacon) {
    try {
      const blob = new Blob([JSON.stringify(data)], { type: 'text/plain;charset=utf-8' });
      const ok = navigator.sendBeacon(APPS_SCRIPT_URL, blob);
      if (ok) {
        console.log('✅ sendBeacon 전송 성공');
        return;
      }
    } catch (e) {
      console.warn('sendBeacon 실패:', e);
    }
  }

  // 폴백: fetch with keepalive (헤더 없이 - preflight 회피)
  fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    keepalive: true,
    body: JSON.stringify(data)
  }).then(() => {
    console.log('✅ fetch 전송 완료');
  }).catch(err => {
    console.error('전송 실패:', err);
  });
}

/* ─────────────────────────────────────────────
   세션 초기화
   ───────────────────────────────────────────── */
function clearSession() {
  sessionStorage.removeItem('trackerData');
  sessionStorage.removeItem('data_sent');
}
