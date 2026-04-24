/**
 * 课表网格组件（桌面端）
 */

import { createCourseCard } from './TimetableCourseCard.js';

/**
 * 创建课表网格 HTML
 * @param {import('../types/timetable.js').TimetableViewModel} viewModel
 * @returns {string}
 */
export function createTimetableGrid(viewModel) {
  const dayIndexes = viewModel.dayColumns.map((day) => day.day);
  const dayCount = viewModel.dayColumns.length;
  
  // 构建课程映射表（按天和节次）
  /** @type {Map<string, import('../types/timetable.js').TimetableCourseView[]>} */
  const courseMapByDayAndNode = new Map();

  for (const day of dayIndexes) {
    for (const course of viewModel.coursesByDay[day] ?? []) {
      const pairStartNode =
        course.startNode % 2 === 1 ? course.startNode : course.startNode - 1;
      const key = `${day}-${Math.max(1, pairStartNode)}`;
      const list = courseMapByDayAndNode.get(key) ?? [];
      list.push(course);
      courseMapByDayAndNode.set(key, list);
    }
  }

  // 过滤出奇数节次（配对显示）
  const pairRows = viewModel.nodeRows.filter((row) => row.node % 2 === 1);

  const headerCells = viewModel.dayColumns.map((day) => `
    <div class="timetable-header-cell">${day.label}</div>
  `).join('');

  const rowsHtml = pairRows.map((row) => {
    const nextNode = Math.min(row.node + 1, viewModel.nodeRows.length);
    const nextRow = viewModel.nodeRows.find((item) => item.node === nextNode);
    const endTime = nextRow?.endTime ?? row.endTime;

    const dayCells = viewModel.dayColumns.map((day) => {
      const key = `${day.day}-${row.node}`;
      const courses = courseMapByDayAndNode.get(key) ?? [];
      
      if (courses.length > 0) {
        const cardsHtml = courses.map((course) => 
          createCourseCard(course, { compact: true })
        ).join('');
        return `
          <div class="timetable-cell">
            <div class="space-y-2">${cardsHtml}</div>
          </div>
        `;
      } else {
        return `
          <div class="timetable-cell timetable-cell-empty">
            <span>—</span>
          </div>
        `;
      }
    }).join('');

    return `
      <div class="timetable-row">
        <div class="timetable-node-cell">
          <p class="timetable-node-title">第 ${row.node}-${nextNode} 节</p>
          <p class="timetable-node-time">${row.startTime} - ${endTime}</p>
        </div>
        ${dayCells}
      </div>
    `;
  }).join('');

  return `
    <div class="timetable-grid-wrapper" style="--day-count: ${dayCount}">
      <div class="timetable-scale-viewport" data-timetable-scale-viewport>
        <div class="timetable-scale-content" data-timetable-scale-content>
          <div class="timetable-header">
            <div class="timetable-header-cell timetable-header-cell--fixed">节次</div>
            ${headerCells}
          </div>
          ${rowsHtml}
        </div>
      </div>
    </div>
  `;
}

/**
 * 初始化课表网格缩放功能
 */
export function initTimetableGridScale() {
  function setupScale() {
    const roots = document.querySelectorAll('[data-timetable-scale-viewport]');
    for (const viewport of roots) {
      if (!(viewport instanceof HTMLElement)) continue;
      const content = viewport.querySelector('[data-timetable-scale-content]');
      if (!(content instanceof HTMLElement)) continue;

      content.style.setProperty('--timetable-scale', '1');
      viewport.style.setProperty('--timetable-scaled-height', 'auto');

      const viewportWidth = viewport.clientWidth;
      const contentWidth = content.scrollWidth;
      if (viewportWidth <= 0 || contentWidth <= 0) continue;

      const scale = Math.min(1, viewportWidth / contentWidth);
      content.style.setProperty('--timetable-scale', String(scale));
      viewport.style.setProperty('--timetable-scaled-height', `${Math.ceil(content.scrollHeight * scale)}px`);
    }
  }

  // 初始设置
  requestAnimationFrame(setupScale);
  
  // 窗口大小改变时重新计算
  const handlerKey = '__timetableGridScaleHandler';
  const previousHandler = window[handlerKey];
  if (typeof previousHandler === 'function') {
    window.removeEventListener('resize', previousHandler);
  }
  window[handlerKey] = () => requestAnimationFrame(setupScale);
  window.addEventListener('resize', window[handlerKey]);
}
