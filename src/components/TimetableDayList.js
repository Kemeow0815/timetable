/**
 * 课表日列表组件（移动端）
 */

import { createCourseCard } from './TimetableCourseCard.js';

/**
 * 创建课表日列表 HTML
 * @param {import('../types/timetable.js').TimetableViewModel} viewModel
 * @returns {string}
 */
export function createTimetableDayList(viewModel) {
  const daysHtml = viewModel.dayColumns.map((day) => {
    const courses = viewModel.coursesByDay[day.day] ?? [];
    
    let contentHtml;
    if (courses.length > 0) {
      const cardsHtml = courses.map((course) => 
        createCourseCard(course, { showTime: true })
      ).join('');
      contentHtml = `<div class="day-list-courses">${cardsHtml}</div>`;
    } else {
      contentHtml = `<p class="day-list-empty">本周暂无课程</p>`;
    }

    return `
      <section class="day-list-section">
        <h2 class="day-list-title">${day.label}</h2>
        ${contentHtml}
      </section>
    `;
  }).join('');

  return `
    <div class="timetable-day-list">
      ${daysHtml}
    </div>
  `;
}
