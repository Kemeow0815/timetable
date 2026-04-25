/**
 * 课表数据标准化模块
 * 将解析后的数据转换为视图模型
 */

const WEEKDAY_LABELS = {
  1: "周一",
  2: "周二",
  3: "周三",
  4: "周四",
  5: "周五",
  6: "周六",
  7: "周日",
};

/**
 * 计算文本哈希值
 * @param {string} input
 * @returns {number}
 */
function hashText(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * 解析日期字符串
 * @param {string} ymd
 * @returns {Date | null}
 */
function parseDateFromYmd(ymd) {
  const parts = ymd.split("-").map((part) => Number(part));
  if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) {
    return null;
  }
  const [year, month, day] = parts;
  return new Date(year, month - 1, day);
}

/**
 * 计算当前周次
 * @param {string} startDateText
 * @param {number} maxWeek
 * @param {Date} [now]
 * @returns {number}
 */
export function resolveCurrentWeek(startDateText, maxWeek, now = new Date()) {
  const startDate = parseDateFromYmd(startDateText);
  if (!startDate) {
    return 1;
  }

  const msPerDay = 24 * 60 * 60 * 1000;
  const diffDays = Math.floor((now.getTime() - startDate.getTime()) / msPerDay);
  const week = Math.floor(diffDays / 7) + 1;

  if (week < 1) {
    return 1;
  }
  if (week > maxWeek) {
    return 1;
  }
  return week;
}

/**
 * 检查当前周次是否应该显示周末
 * @param {import('../types/timetable.js').TimetableMetaSegment} meta
 * @param {number} currentWeek
 * @returns {{ showSat: boolean, showSun: boolean }}
 */
function getWeekendDisplay(meta, currentWeek) {
  // 基础设置
  let showSat = meta.showSat ?? true;
  let showSun = meta.showSun ?? false;

  // 如果有 weekendDisplay 配置，根据当前周次动态调整
  if (meta.weekendDisplay?.enabled) {
    const { weeks, days } = meta.weekendDisplay;
    const isWeekendWeek = weeks.includes(currentWeek);

    if (isWeekendWeek) {
      // 根据 days 配置决定显示哪些天
      const hasSat = days.includes("sat") || days.includes("saturday");
      const hasSun = days.includes("sun") || days.includes("sunday");
      const hasAll = days.includes("all");

      if (hasAll) {
        showSat = true;
        showSun = true;
      } else {
        showSat = hasSat;
        showSun = hasSun;
      }
    } else {
      // 不在指定周次，不显示周末
      showSat = false;
      showSun = false;
    }
  }

  return { showSat, showSun };
}

/**
 * 转换星期列数据
 * @param {import('../types/timetable.js').ParsedTimetableData} data
 * @param {number} currentWeek
 * @returns {import('../types/timetable.js').TimetableDayColumn[]}
 */
function toDayColumns(data, currentWeek) {
  const columns = [
    { day: 1, label: WEEKDAY_LABELS[1] },
    { day: 2, label: WEEKDAY_LABELS[2] },
    { day: 3, label: WEEKDAY_LABELS[3] },
    { day: 4, label: WEEKDAY_LABELS[4] },
    { day: 5, label: WEEKDAY_LABELS[5] },
  ];

  const { showSat, showSun } = getWeekendDisplay(data.meta, currentWeek);

  if (showSat) {
    columns.push({ day: 6, label: WEEKDAY_LABELS[6] });
  }
  if (showSun) {
    columns.push({ day: 7, label: WEEKDAY_LABELS[7] });
  }
  return columns;
}

/**
 * 转换课程视图
 * @param {import('../types/timetable.js').TimetableCourseArrangement} arrangement
 * @param {string} courseName
 * @param {string} color
 * @param {import('../types/timetable.js').TimetableNodeRow[]} nodeRows
 * @returns {import('../types/timetable.js').TimetableCourseView}
 */
function toCourseView(arrangement, courseName, color, nodeRows) {
  const fixedDurationNodes = 2;
  const maxNode = Math.max(
    ...nodeRows.map((row) => row.node),
    arrangement.startNode,
  );
  const endNode = Math.min(
    arrangement.startNode + fixedDurationNodes - 1,
    maxNode,
  );
  const startNodeRow = nodeRows.find(
    (row) => row.node === arrangement.startNode,
  );
  const endNodeRow = nodeRows.find((row) => row.node === endNode);
  const startTime = startNodeRow?.startTime ?? "--:--";
  const endTime = endNodeRow?.endTime ?? "--:--";

  return {
    courseId: arrangement.id,
    courseName,
    color,
    teacher: arrangement.teacher?.trim() || "未填写",
    room: arrangement.room?.trim() || "未填写",
    day: arrangement.day,
    startNode: arrangement.startNode,
    endNode,
    durationNodes: fixedDurationNodes,
    startWeek: arrangement.startWeek,
    endWeek: arrangement.endWeek,
    nodeText: `第 ${arrangement.startNode}-${endNode} 节`,
    timeText: `${startTime} - ${endTime}`,
  };
}

/**
 * 构建课表视图模型
 * @param {import('../types/timetable.js').ParsedTimetableData} data
 * @param {number} selectedWeek
 * @returns {import('../types/timetable.js').TimetableViewModel}
 */
export function buildTimetableViewModel(data, selectedWeek) {
  const maxWeek = Math.max(1, data.meta.maxWeek || 1);
  const week = Math.min(Math.max(1, selectedWeek), maxWeek);
  const nodeRows = toNodeRows(data);
  const dayColumns = toDayColumns(data, week);

  const courseMap = new Map(
    data.courseDefinitions.map((course) => [course.id, course]),
  );

  /** @type {Record<number, import('../types/timetable.js').TimetableCourseView[]>} */
  const coursesByDay = {};
  for (const column of dayColumns) {
    coursesByDay[column.day] = [];
  }

  for (const arrangement of data.arrangements) {
    if (arrangement.day < 1 || arrangement.day > 7) {
      continue;
    }
    if (week < arrangement.startWeek || week > arrangement.endWeek) {
      continue;
    }
    if (!(arrangement.day in coursesByDay)) {
      continue;
    }

    const courseDef = courseMap.get(arrangement.id);
    const courseName = courseDef?.courseName ?? `课程 #${arrangement.id}`;
    const color = buildCourseColor(courseName, arrangement.id);
    coursesByDay[arrangement.day].push(
      toCourseView(arrangement, courseName, color, nodeRows),
    );
  }

  for (const day of Object.keys(coursesByDay)) {
    coursesByDay[Number(day)].sort(
      (a, b) =>
        a.startNode - b.startNode || a.courseName.localeCompare(b.courseName),
    );
  }

  return {
    tableName: data.meta.tableName || "课表",
    maxWeek,
    currentWeek: week,
    weeks: Array.from({ length: maxWeek }, (_, index) => index + 1),
    dayColumns,
    nodeRows,
    coursesByDay,
  };
}

// 导出工具函数
export function toNodeRows(data) {
  const rows = data.nodeTimes
    .filter((item) => item.node >= 1 && item.node <= data.meta.nodes)
    .sort((a, b) => a.node - b.node)
    .map((item) => ({
      node: item.node,
      startTime: item.startTime,
      endTime: item.endTime,
    }));

  if (rows.length > 0) {
    return rows;
  }

  return Array.from({ length: data.meta.nodes }, (_, index) => {
    const node = index + 1;
    return {
      node,
      startTime: "--:--",
      endTime: "--:--",
    };
  });
}

export function buildCourseColor(courseName, courseId) {
  const seed = hashText(`${courseName}-${courseId}`);
  const hue = seed % 360;
  const saturation = 78;
  const lightness = 68;
  return `hsl(${hue} ${saturation}% ${lightness}%)`;
}
