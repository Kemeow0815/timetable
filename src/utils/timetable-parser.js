/**
 * 课表数据解析模块
 * 支持从 JSON 文件解析课表数据
 */

const EXPECTED_SEGMENT_COUNT = 5;

/**
 * 解析单行 JSON
 * @template T
 * @param {string} line
 * @param {number} lineNumber
 * @returns {T}
 */
function parseJsonLine(line, lineNumber) {
  const normalizedLine = line.endsWith(",") ? line.slice(0, -1) : line;
  try {
    return JSON.parse(normalizedLine);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `课表数据解析失败：第 ${lineNumber} 行不是合法 JSON（${message}）`
    );
  }
}

/**
 * 确保值为对象
 * @param {unknown} value
 * @param {number} index
 * @returns {asserts value is Record<string, unknown>}
 */
function ensureObject(value, index) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`课表数据结构错误：第 ${index + 1} 段应为对象`);
  }
}

/**
 * 确保值为数组
 * @param {unknown} value
 * @param {number} index
 * @returns {asserts value is unknown[]}
 */
function ensureArray(value, index) {
  if (!Array.isArray(value)) {
    throw new Error(`课表数据结构错误：第 ${index + 1} 段应为数组`);
  }
}

/**
 * 解析课表文本
 * 支持两种格式：
 * 1. 单一 JSON 对象（新格式）
 * 2. 多行 JSON 格式（旧格式）
 * @param {string} rawText
 * @returns {import('../types/timetable.js').ParsedTimetableData}
 */
export function parseTimetableText(rawText) {
  try {
    // 尝试解析为单一 JSON 对象（新格式）
    const data = JSON.parse(rawText);
    
    if (data.courses && data.schedules) {
      // 新格式处理
      const config = {
        courseLen: data.courseLen || 45,
        id: data.id || 0,
        name: data.name || '课表'
      };
      
      const nodeTimes = data.timeTable || [];
      
      const meta = {
        id: data.id || 0,
        tableName: data.settings?.tableName || data.name || '课表',
        maxWeek: data.settings?.maxWeek || 20,
        nodes: data.settings?.nodes || 11,
        startDate: data.settings?.startDate || '2026-02-23',
        timeTable: 1,
        showSat: data.settings?.showSat || false,
        showSun: data.settings?.showSun || false
      };
      
      const courseDefinitions = data.courses.map(course => ({
        id: course.id,
        courseName: course.courseName,
        color: course.color
      }));
      
      const arrangements = data.schedules.map(schedule => ({
        id: schedule.id,
        day: schedule.day,
        startNode: schedule.startNode,
        step: schedule.step,
        startWeek: schedule.startWeek,
        endWeek: schedule.endWeek,
        teacher: schedule.teacher || '',
        room: schedule.room || ''
      }));
      
      return {
        config,
        nodeTimes,
        meta,
        courseDefinitions,
        arrangements
      };
    }
  } catch (error) {
    // 新格式解析失败，尝试旧格式
  }

  // 旧格式处理
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length !== EXPECTED_SEGMENT_COUNT) {
    throw new Error(
      `课表数据结构错误：必须恰好包含 ${EXPECTED_SEGMENT_COUNT} 段 JSON，当前为 ${lines.length} 段`
    );
  }

  const segments = lines.map((line, index) =>
    parseJsonLine(line, index + 1)
  );
  const [config, nodeTimes, meta, courseDefinitions, arrangements] = segments;

  ensureObject(config, 0);
  ensureArray(nodeTimes, 1);
  ensureObject(meta, 2);
  ensureArray(courseDefinitions, 3);
  ensureArray(arrangements, 4);

  return {
    config,
    nodeTimes,
    meta,
    courseDefinitions,
    arrangements,
  };
}

/**
 * 将课表数据序列化为文件文本
 * @param {import('../types/timetable.js').ParsedTimetableData} data
 * @returns {string}
 */
export function serializeTimetableDataToFileText(data) {
  const segments = [
    data.config,
    data.nodeTimes,
    data.meta,
    data.courseDefinitions,
    data.arrangements,
  ];
  return `${segments.map((segment) => JSON.stringify(segment)).join("\n")}\n`;
}

/**
 * 解析新版 JSON 格式（单文件对象格式）
 * @param {string} rawText
 * @returns {import('../types/timetable.js').ParsedTimetableData}
 */
export function parseNewTimetableFormat(rawText) {
  const data = JSON.parse(rawText);

  // 转换新版格式到内部格式
  const nodeTimes = (data.timeTable || []).map((item) => ({
    node: item.node,
    startTime: item.startTime,
    endTime: item.endTime,
    timeTable: item.timeTable,
  }));

  // 解析 weekendDisplay 配置
  const weekendDisplay = data.settings?.weekendDisplay;
  const hasWeekendDisplay = weekendDisplay?.enabled && Array.isArray(weekendDisplay.weeks) && weekendDisplay.weeks.length > 0;

  const meta = {
    id: data.id || 1,
    tableName: data.name || "课程表",
    maxWeek: data.settings?.maxWeek || 20,
    nodes: data.settings?.nodes || 11,
    startDate: data.settings?.startDate || "2024-01-01",
    timeTable: data.settings?.timeTable || 1,
    // 基础设置
    showSat: data.settings?.showSat ?? true,
    showSun: data.settings?.showSun ?? false,
    // 周末显示配置（特定周次）
    weekendDisplay: hasWeekendDisplay ? {
      enabled: true,
      weeks: weekendDisplay.weeks,
      days: weekendDisplay.days || ["sat"],
    } : null,
  };

  const courseDefinitions = (data.courses || []).map((course) => ({
    id: course.id,
    courseName: course.courseName,
    color: course.color,
  }));

  const arrangements = (data.schedules || []).map((schedule) => ({
    id: schedule.id,
    day: schedule.day,
    startNode: schedule.startNode,
    step: schedule.step || 2,
    startWeek: schedule.startWeek,
    endWeek: schedule.endWeek,
    teacher: schedule.teacher,
    room: schedule.room,
  }));

  const config = {
    courseLen: data.courseLen || 45,
    id: data.id || 1,
    name: data.name || "课程表",
  };

  return {
    config,
    nodeTimes,
    meta,
    courseDefinitions,
    arrangements,
  };
}
