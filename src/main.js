/**
 * 主入口文件
 */

import { parseNewTimetableFormat } from "./utils/timetable-parser.js";
import {
  buildTimetableViewModel,
  resolveCurrentWeek,
} from "./utils/timetable-normalizer.js";
import {
  createTimetableGrid,
  initTimetableGridScale,
} from "./components/TimetableGrid.js";
import { createTimetableDayList } from "./components/TimetableDayList.js";
import {
  createLiveTimetableStatus,
  initLiveTimetableStatus,
} from "./components/LiveTimetableStatus.js";
import {
  createTimetableVisualEditor,
  initTimetableVisualEditor,
} from "./components/TimetableVisualEditor.js";

// 全局状态
let currentViewModel = null;
let baselineParsed = null;
let currentWeek = 1;

/**
 * 初始化主题
 */
function initTheme() {
  const themeToggle = document.getElementById("theme-toggle");
  const html = document.documentElement;

  // 检查本地存储或系统偏好
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    html.setAttribute("data-theme", savedTheme);
  } else if (window.matchMedia("(prefers-color-scheme: light)").matches) {
    html.setAttribute("data-theme", "light");
  }

  themeToggle.addEventListener("click", () => {
    const currentTheme = html.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    html.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  });
}

/**
 * 加载课表数据
 */
async function loadTimetableData() {
  const loadingEl = document.getElementById("loading");
  const errorEl = document.getElementById("error");
  const errorTextEl = document.getElementById("error-text");
  const contentEl = document.getElementById("timetable-content");

  try {
    // 尝试加载多个可能的数据文件
    const dataFiles = [
      "./data/大三下.json",
      "./data/timetable.json",
      "./timetable.json",
    ];

    let response = null;
    let usedFile = "";

    for (const file of dataFiles) {
      try {
        const res = await fetch(file);
        if (res.ok) {
          response = res;
          usedFile = file;
          break;
        }
      } catch {
        // 继续尝试下一个
      }
    }

    if (!response) {
      throw new Error("未找到课表数据文件，请确保 data/大三下.json 存在");
    }

    const rawText = await response.text();
    baselineParsed = parseNewTimetableFormat(rawText);

    // 计算当前周
    currentWeek = resolveCurrentWeek(
      baselineParsed.meta.startDate,
      baselineParsed.meta.maxWeek,
    );

    // 构建视图模型
    currentViewModel = buildTimetableViewModel(baselineParsed, currentWeek);

    // 更新页面标题
    document.getElementById("table-name").textContent =
      currentViewModel.tableName;
    document.title = `${currentViewModel.tableName} - 第${currentWeek}周`;

    // 隐藏加载，显示内容
    loadingEl.style.display = "none";
    contentEl.style.display = "block";

    // 渲染课表
    renderTimetable();

    // 初始化实时状态
    initLiveTimetableStatus();

    // 初始化网格缩放
    initTimetableGridScale();
  } catch (error) {
    loadingEl.style.display = "none";
    errorEl.style.display = "block";
    errorTextEl.textContent =
      error instanceof Error ? error.message : "课表数据加载失败";
    console.error("加载课表数据失败:", error);
  }
}

/**
 * 渲染课表
 */
function renderTimetable() {
  if (!currentViewModel) return;

  // 更新周次显示
  document.getElementById("current-week").textContent =
    currentViewModel.currentWeek;
  document.getElementById("max-week").textContent = currentViewModel.maxWeek;

  // 显示/隐藏"当前周"标签
  const currentWeekBadge = document.getElementById("current-week-badge");
  const actualCurrentWeek = resolveCurrentWeek(
    baselineParsed.meta.startDate,
    baselineParsed.meta.maxWeek,
  );
  currentWeekBadge.style.display =
    currentViewModel.currentWeek === actualCurrentWeek
      ? "inline-block"
      : "none";

  // 更新导航按钮状态
  const prevBtn = document.getElementById("prev-week");
  const nextBtn = document.getElementById("next-week");
  prevBtn.disabled = currentViewModel.currentWeek <= 1;
  nextBtn.disabled = currentViewModel.currentWeek >= currentViewModel.maxWeek;

  // 渲染实时状态（传递完整的课程数据，不限制周次）
  const liveStatusContainer = document.getElementById("live-status-container");
  // 构建包含所有周课程的完整数据
  const allCoursesByDay = {};
  for (let week = 1; week <= baselineParsed.meta.maxWeek; week++) {
    const weekViewModel = buildTimetableViewModel(baselineParsed, week);
    for (const [day, courses] of Object.entries(weekViewModel.coursesByDay)) {
      if (!allCoursesByDay[day]) {
        allCoursesByDay[day] = [];
      }
      allCoursesByDay[day].push(...courses);
    }
  }
  // 去重（同一课程可能在多个周出现）
  for (const day in allCoursesByDay) {
    const seenCourses = new Set();
    allCoursesByDay[day] = allCoursesByDay[day].filter((course) => {
      const key = `${course.courseId}-${course.day}-${course.startNode}`;
      if (seenCourses.has(key)) {
        return false;
      }
      seenCourses.add(key);
      return true;
    });
  }
  liveStatusContainer.innerHTML = createLiveTimetableStatus({
    coursesByDay: allCoursesByDay,
    startDate: baselineParsed.meta.startDate,
    maxWeek: baselineParsed.meta.maxWeek,
  });

  // 重新初始化实时状态
  initLiveTimetableStatus();

  // 渲染可视化编辑器
  const visualEditorContainer = document.getElementById(
    "visual-editor-container",
  );
  visualEditorContainer.innerHTML = createTimetableVisualEditor(
    currentViewModel,
    baselineParsed,
  );
  initTimetableVisualEditor(
    visualEditorContainer.querySelector(".visual-editor"),
    currentViewModel,
    baselineParsed,
  );

  // 渲染网格（桌面端）
  const gridContainer = document.getElementById("timetable-grid-container");
  gridContainer.innerHTML = createTimetableGrid(currentViewModel);

  // 渲染日列表（移动端）
  const dayListContainer = document.getElementById(
    "timetable-daylist-container",
  );
  dayListContainer.innerHTML = createTimetableDayList(currentViewModel);

  // 重新初始化网格缩放
  initTimetableGridScale();
}

/**
 * 切换到指定周次
 * @param {number} week
 */
function navigateToWeek(week) {
  if (!baselineParsed) return;

  const newWeek = Math.max(1, Math.min(week, baselineParsed.meta.maxWeek));
  currentViewModel = buildTimetableViewModel(baselineParsed, newWeek);
  renderTimetable();
}

/**
 * 初始化事件监听
 */
function initEventListeners() {
  // 周次导航
  document.getElementById("prev-week").addEventListener("click", () => {
    navigateToWeek(currentViewModel.currentWeek - 1);
  });

  document.getElementById("next-week").addEventListener("click", () => {
    navigateToWeek(currentViewModel.currentWeek + 1);
  });
}

/**
 * 初始化应用
 */
function init() {
  initTheme();
  initEventListeners();
  loadTimetableData();
}

// 启动应用
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
