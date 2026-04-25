/**
 * 实时课表状态组件
 * 显示当前上课状态和下一节课信息
 */

/**
 * 创建实时状态组件 HTML
 * @param {Object} payload
 * @param {Record<number, import('../types/timetable.js').TimetableCourseView[]>} payload.coursesByDay
 * @param {string} payload.startDate - 开学日期
 * @param {number} payload.maxWeek - 最大周数
 * @returns {string}
 */
export function createLiveTimetableStatus(payload) {
  const payloadText = encodeURIComponent(
    JSON.stringify(
      payload ?? { coursesByDay: {}, startDate: "2026-02-23", maxWeek: 20 },
    ),
  );

  return `
    <div class="live-status-card" data-live-status-root data-live-payload="${payloadText}">
      <div class="live-status-content" data-live-content>
        <p class="live-status-loading">加载中...</p>
      </div>
    </div>
  `;
}

/**
 * 将十六进制颜色转换为 RGB，并在深色模式下增加亮度
 * @param {string} hex
 * @returns {string}
 */
function hexToRgb(hex) {
  hex = hex.replace("#", "");

  let r, g, b;

  // 处理 8 位十六进制（ARGB 格式）
  if (hex.length === 8) {
    r = parseInt(hex.substring(2, 4), 16);
    g = parseInt(hex.substring(4, 6), 16);
    b = parseInt(hex.substring(6, 8), 16);
  }
  // 处理 6 位十六进制
  else if (hex.length === 6) {
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  } else {
    return "rgb(128, 128, 128)";
  }

  // 获取当前主题
  const theme = document.documentElement.getAttribute("data-theme");
  const isDarkMode = theme === "dark";

  // 只在深色模式下增加亮度
  if (isDarkMode) {
    // 计算当前亮度 (0-255)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    // 深色模式下确保最小亮度为 160
    const minBrightness = 160;
    if (brightness < minBrightness) {
      const factor = minBrightness / Math.max(brightness, 10);
      r = Math.min(255, Math.round(r * factor));
      g = Math.min(255, Math.round(g * factor));
      b = Math.min(255, Math.round(b * factor));
    }
  }

  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * 解析时间文本为分钟数
 * @param {string} text
 * @returns {number | null}
 */
function parseTimeToMinute(text) {
  const parts = String(text || "").split(":");
  if (parts.length !== 2) return null;
  const hour = Number(parts[0]);
  const minute = Number(parts[1]);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return hour * 60 + minute;
}

/**
 * 提取时间范围
 * @param {string} timeText
 * @returns {{ startMinute: number, endMinute: number } | null}
 */
function extractRangeMinutes(timeText) {
  const match = String(timeText || "").match(
    /(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/,
  );
  if (!match) return null;
  const startMinute = parseTimeToMinute(match[1]);
  const endMinute = parseTimeToMinute(match[2]);
  if (startMinute === null || endMinute === null) return null;
  return { startMinute, endMinute };
}

/**
 * 格式化持续时间（精确到秒）
 * @param {number} totalSeconds
 * @returns {string}
 */
function formatDuration(totalSeconds) {
  const safeSecs = Math.max(0, Math.floor(totalSeconds));
  const days = Math.floor(safeSecs / 86400);
  const hours = Math.floor((safeSecs % 86400) / 3600);
  const minutes = Math.floor((safeSecs % 3600) / 60);
  const seconds = safeSecs % 60;

  const parts = [];
  if (days > 0) parts.push(`${days}天`);
  if (hours > 0) parts.push(`${hours}时`);
  if (minutes > 0) parts.push(`${minutes}分钟`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}秒`);

  return parts.join("，");
}

/**
 * 获取今日课程
 * @param {Object} payload
 * @param {Date} now
 * @returns {Array<import('../types/timetable.js').TimetableCourseView & { startMinute: number, endMinute: number }>}
 */
function getTodayCourses(payload, now) {
  const day = now.getDay() === 0 ? 7 : now.getDay();
  const rawCourses = payload?.coursesByDay?.[day] || [];
  return rawCourses
    .map((course) => {
      const range = extractRangeMinutes(course.timeText);
      if (!range) return null;
      return {
        ...course,
        startMinute: range.startMinute,
        endMinute: range.endMinute,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.startMinute - b.startMinute);
}

/**
 * 获取本周所有课程
 * @param {Object} payload
 * @returns {Array<any>}
 */
function getAllCoursesThisWeek(payload) {
  const allCourses = [];
  for (let day = 1; day <= 7; day++) {
    const dayCourses = payload?.coursesByDay?.[day] || [];
    for (const course of dayCourses) {
      const range = extractRangeMinutes(course.timeText);
      if (range) {
        allCourses.push({
          ...course,
          day,
          startMinute: range.startMinute,
          endMinute: range.endMinute,
        });
      }
    }
  }
  return allCourses.sort((a, b) => {
    if (a.day !== b.day) return a.day - b.day;
    return a.startMinute - b.startMinute;
  });
}

/**
 * 解析当前状态
 * @param {Object} payload
 * @param {Date} now
 * @returns {Array<Array<{text: string, color?: string, bold?: boolean, strikethrough?: boolean}>>}
 */
function resolveLiveState(payload, now) {
  const currentSecond =
    now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const currentMinute = Math.floor(currentSecond / 60);
  const day = now.getDay() === 0 ? 7 : now.getDay();

  // 计算当前实际周次
  const currentWeek = resolveCurrentWeek(
    payload.startDate || "2026-02-23",
    payload.maxWeek || 20,
    now,
  );
  const nextWeek = Math.min(currentWeek + 1, payload.maxWeek || 20);

  // 过滤课程，只保留指定周的课程
  function filterCoursesByWeek(courses, targetWeek) {
    return courses.filter((course) => {
      return course.startWeek <= targetWeek && course.endWeek >= targetWeek;
    });
  }

  // 周末
  if (day >= 6) {
    const allCourses = getAllCoursesThisWeek(payload);
    // 只显示下周的课程
    const filteredCourses = filterCoursesByWeek(allCourses, nextWeek);
    const nextWeekFirstCourse = filteredCourses.find((c) => c.day === 1);

    if (nextWeekFirstCourse) {
      const daysUntilMonday = day === 6 ? 2 : 1;
      const secondsUntilCourse =
        daysUntilMonday * 86400 +
        nextWeekFirstCourse.startMinute * 60 -
        (currentMinute * 60 + now.getSeconds());

      return [
        [{ text: "### 本周课毕" }],
        [
          { text: "下周首节：" },
          {
            text: `${nextWeekFirstCourse.courseName} - ${nextWeekFirstCourse.room || "未知"}`,
            bold: true,
            color: hexToRgb(nextWeekFirstCourse.color),
          },
        ],
        [
          { text: "距上课还有：" },
          { text: formatDuration(secondsUntilCourse), bold: true },
        ],
      ];
    }

    return [[{ text: "### 周末" }]];
  }

  let courses = getTodayCourses(payload, now);
  // 只显示当前周的课程
  courses = filterCoursesByWeek(courses, currentWeek);

  // 今日无课
  if (courses.length === 0) {
    const allCourses = getAllCoursesThisWeek(payload);
    // 只显示当前周的课程
    const filteredCourses = filterCoursesByWeek(allCourses, currentWeek);
    const nextDayCourse = filteredCourses.find((c) => c.day > day);

    if (nextDayCourse) {
      const daysUntil = nextDayCourse.day - day;
      const secondsUntilCourse =
        daysUntil * 86400 +
        nextDayCourse.startMinute * 60 -
        (currentMinute * 60 + now.getSeconds());

      return [
        [{ text: "### 今日课毕" }],
        [
          { text: "翌日首节：" },
          {
            text: `${nextDayCourse.courseName} - ${nextDayCourse.room || "未知"}`,
            bold: true,
            color: hexToRgb(nextDayCourse.color),
          },
        ],
        [
          { text: "距上课还有：" },
          { text: formatDuration(secondsUntilCourse), bold: true },
        ],
      ];
    }

    return [[{ text: "### 今日无课" }]];
  }

  // 查找当前状态
  for (let index = 0; index < courses.length; index += 1) {
    const current = courses[index];
    const prev = index > 0 ? courses[index - 1] : null;
    const next = courses[index + 1] || null;

    // 上课中
    if (
      currentMinute >= current.startMinute &&
      currentMinute < current.endMinute
    ) {
      const remainSeconds = current.endMinute * 60 - currentSecond;

      const result = [[{ text: "### 上课" }]];

      if (prev) {
        result.push([
          { text: "上节：", strikethrough: true },
          {
            text: `${prev.courseName} - ${prev.room || "未知"}`,
            strikethrough: true,
            color: hexToRgb(prev.color),
          },
        ]);
      }

      result.push([
        { text: "本节：" },
        {
          text: `${current.courseName} - ${current.room || "未知"}`,
          bold: true,
          color: hexToRgb(current.color),
        },
      ]);

      if (next) {
        result.push([
          { text: "下节：" },
          {
            text: `${next.courseName} - ${next.room || "未知"}`,
            color: hexToRgb(next.color),
          },
        ]);
      }

      result.push([
        { text: "距下课还有：" },
        { text: formatDuration(remainSeconds), bold: true },
      ]);

      return result;
    }

    // 课间
    if (
      next &&
      currentMinute >= current.endMinute &&
      currentMinute < next.startMinute
    ) {
      const remainSeconds = next.startMinute * 60 - currentSecond;

      return [
        [{ text: "### 课间" }],
        [
          { text: "上节：", strikethrough: true },
          {
            text: `${current.courseName} - ${current.room || "未知"}`,
            strikethrough: true,
            color: hexToRgb(current.color),
          },
        ],
        [
          { text: "下节：" },
          {
            text: `${next.courseName} - ${next.room || "未知"}`,
            bold: true,
            color: hexToRgb(next.color),
          },
        ],
        [
          { text: "距上课还有：" },
          { text: formatDuration(remainSeconds), bold: true },
        ],
      ];
    }
  }

  // 今日课毕
  const lastCourse = courses[courses.length - 1];
  if (currentMinute >= lastCourse.endMinute) {
    const allCourses = getAllCoursesThisWeek(payload);
    // 只显示当前周的课程
    const filteredCourses = filterCoursesByWeek(allCourses, currentWeek);
    const nextDayCourse = filteredCourses.find((c) => c.day > day);

    if (nextDayCourse) {
      const daysUntil = nextDayCourse.day - day;
      const secondsUntilCourse =
        daysUntil * 86400 +
        nextDayCourse.startMinute * 60 -
        (currentMinute * 60 + now.getSeconds());

      return [
        [{ text: "### 今日课毕" }],
        [
          { text: "翌日首节：" },
          {
            text: `${nextDayCourse.courseName} - ${nextDayCourse.room || "未知"}`,
            bold: true,
            color: hexToRgb(nextDayCourse.color),
          },
        ],
        [
          { text: "距上课还有：" },
          { text: formatDuration(secondsUntilCourse), bold: true },
        ],
      ];
    }

    return [[{ text: "### 今日课毕" }]];
  }

  // 第一节课前
  const firstCourse = courses[0];
  const remainSeconds = firstCourse.startMinute * 60 - currentSecond;

  return [
    [{ text: "### 课前" }],
    [
      { text: "首节：" },
      {
        text: `${firstCourse.courseName} - ${firstCourse.room || "未知"}`,
        bold: true,
        color: hexToRgb(firstCourse.color),
      },
    ],
    [
      { text: "距上课还有：" },
      { text: formatDuration(remainSeconds), bold: true },
    ],
  ];
}

/**
 * 渲染状态行
 * @param {Array<{text: string, color?: string, bold?: boolean, strikethrough?: boolean}>} line
 * @returns {string}
 */
function renderStatusLine(line) {
  const segmentsHtml = line
    .map((segment) => {
      const styles = [];
      const classes = [];

      if (segment.color) {
        styles.push(`color: ${segment.color}`);
      }
      if (segment.bold) {
        classes.push("font-bold");
      }
      if (segment.strikethrough) {
        classes.push("line-through opacity-60");
      }

      const styleAttr =
        styles.length > 0 ? ` style="${styles.join("; ")}"` : "";
      const classAttr =
        classes.length > 0 ? ` class="${classes.join(" ")}"` : "";

      // 处理标题
      if (segment.text.startsWith("###")) {
        const titleText = segment.text.replace("###", "").trim();
        return `<span class="live-status-title"${styleAttr}>${escapeHtml(titleText)}</span>`;
      }

      return `<span${classAttr}${styleAttr}>${escapeHtml(segment.text)}</span>`;
    })
    .join("");

  return `<p class="live-status-line">${segmentsHtml}</p>`;
}

/**
 * 转义 HTML 特殊字符
 * @param {string} text
 * @returns {string}
 */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * 更新组件
 * @param {HTMLElement} root
 */
function updateLiveStatusWidget(root) {
  if (!(root instanceof HTMLElement)) return;

  const contentElement = root.querySelector("[data-live-content]");
  if (!(contentElement instanceof HTMLElement)) return;

  let payload;
  try {
    const payloadRaw = decodeURIComponent(root.dataset.livePayload || "%7B%7D");
    payload = JSON.parse(payloadRaw);
  } catch {
    payload = { coursesByDay: {} };
  }

  const now = new Date();
  const statusLines = resolveLiveState(payload, now);

  const html = statusLines.map((line) => renderStatusLine(line)).join("");
  contentElement.innerHTML = html;

  // 显示组件
  root.style.opacity = "1";
}

/**
 * 计算当前实际周次
 * @param {string} startDateText - 开学日期
 * @param {number} maxWeek - 最大周数
 * @param {Date} now - 当前时间
 * @returns {number}
 */
function resolveCurrentWeek(startDateText, maxWeek, now = new Date()) {
  const parts = startDateText.split("-").map((part) => Number(part));
  if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) {
    return 1;
  }
  const [year, month, day] = parts;
  const startDate = new Date(year, month - 1, day);
  const msPerDay = 24 * 60 * 60 * 1000;
  const diffDays = Math.floor((now.getTime() - startDate.getTime()) / msPerDay);
  const week = Math.floor(diffDays / 7) + 1;
  if (week < 1) return 1;
  if (week > maxWeek) return 1;
  return week;
}

/**
 * 初始化实时状态组件
 */
export function initLiveTimetableStatus() {
  function refreshWidgets() {
    const roots = document.querySelectorAll("[data-live-status-root]");
    for (const root of roots) {
      updateLiveStatusWidget(root);
    }
  }

  // 立即更新一次
  refreshWidgets();

  // 每秒更新一次（为了显示秒级倒计时）
  const timerKey = "__liveStatusWidgetsTimer";
  if (window[timerKey]) {
    clearInterval(window[timerKey]);
  }
  window[timerKey] = window.setInterval(refreshWidgets, 1000);

  // 页面重新获得焦点时更新
  window.addEventListener("focus", refreshWidgets);
}
