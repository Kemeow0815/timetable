/**
 * 课程卡片组件
 */

/**
 * 创建课程卡片 HTML
 * @param {import('../types/timetable.js').TimetableCourseView} course
 * @param {Object} options
 * @param {boolean} [options.compact=false]
 * @param {boolean} [options.showTime=false]
 * @returns {string}
 */
export function createCourseCard(course, options = {}) {
  const { compact = false, showTime = false } = options;
  const borderColor = course.color || "#6b7280";
  
  // 根据课程名生成柔和的背景色
  const bgColor = generateSoftColor(course.color);

  return `
    <article class="course-card" style="--course-color: ${borderColor}; --course-bg: ${bgColor}">
      <h3 class="course-name">${escapeHtml(course.courseName)}</h3>
      <p class="course-weeks">${course.startWeek}-${course.endWeek}周</p>
      <p class="course-room">教室：${escapeHtml(course.room)}</p>
      <p class="course-teacher">教师：${escapeHtml(course.teacher)}</p>
    </article>
  `;
}

/**
 * 生成柔和的背景色
 * @param {string} color
 * @returns {string}
 */
function generateSoftColor(color) {
  if (!color) return 'rgba(107, 114, 128, 0.08)';
  
  // 提取 HSL 值并降低饱和度、提高亮度
  const match = color.match(/hsl\((\d+)\s+(\d+)%\s+(\d+)%\)/);
  if (match) {
    const h = match[1];
    return `hsla(${h}, 70%, 85%, 0.25)`;
  }
  
  // 对于十六进制颜色，转换为 rgba
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16) || 0;
    const g = parseInt(color.slice(3, 5), 16) || 0;
    const b = parseInt(color.slice(5, 7), 16) || 0;
    return `rgba(${r}, ${g}, ${b}, 0.12)`;
  }
  
  return 'rgba(107, 114, 128, 0.08)';
}

/**
 * 转义 HTML 特殊字符
 * @param {string} text
 * @returns {string}
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
