/**
 * 课表可视化编辑器组件
 */

import { buildTimetableViewModel } from '../utils/timetable-normalizer.js';
import { serializeTimetableDataToFileText } from '../utils/timetable-parser.js';

const DAY_LABELS = {
  1: "周一",
  2: "周二",
  3: "周三",
  4: "周四",
  5: "周五",
  6: "周六",
  7: "周日",
};

/**
 * 创建可视化编辑器 HTML
 * @param {import('../types/timetable.js').TimetableViewModel} viewModel
 * @param {import('../types/timetable.js').ParsedTimetableData} baselineParsed
 * @returns {string}
 */
export function createTimetableVisualEditor(viewModel, baselineParsed) {
  return `
    <div class="visual-editor" data-visual-editor>
      <div class="visual-editor-toolbar">
        <button type="button" class="btn btn-primary" data-action="enter-edit">编辑课表</button>
      </div>
      <div class="visual-editor-hint">
        点击"编辑课表"进入图形化编辑模式，导出后会自动还原页面临时修改。
      </div>
    </div>
  `;
}

/**
 * 深度克隆对象
 * @template T
 * @param {T} value
 * @returns {T}
 */
function deepClone(value) {
  if (typeof globalThis.structuredClone === "function") {
    return globalThis.structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

/**
 * 初始化可视化编辑器
 * @param {HTMLElement} container
 * @param {import('../types/timetable.js').TimetableViewModel} viewModel
 * @param {import('../types/timetable.js').ParsedTimetableData} baselineParsed
 */
export function initTimetableVisualEditor(container, viewModel, baselineParsed) {
  let editMode = false;
  let draftParsed = deepClone(baselineParsed);
  let selectedArrangementIndex = null;
  let creatingCourse = false;
  let validationError = "";

  const visibleDays = viewModel.dayColumns.map((column) => column.day);
  const maxNode = Math.max(...viewModel.nodeRows.map((row) => row.node), 1);

  function render() {
    if (!editMode) {
      container.innerHTML = `
        <div class="visual-editor">
          <div class="visual-editor-toolbar">
            <button type="button" class="btn btn-primary" data-action="enter-edit">编辑课表</button>
          </div>
          <div class="visual-editor-hint">
            点击"编辑课表"进入图形化编辑模式，导出后会自动还原页面临时修改。
          </div>
        </div>
      `;
      bindEvents();
      return;
    }

    const previewViewModel = buildTimetableViewModel(draftParsed, viewModel.currentWeek);
    const arrangementCards = buildArrangementCards(previewViewModel, draftParsed.arrangements);
    
    const existingCourseNames = [...new Set(draftParsed.courseDefinitions.map(c => c.courseName).filter(Boolean))];
    const existingTeachers = [...new Set(draftParsed.arrangements.map(a => a.teacher).filter(Boolean))];
    const existingRooms = [...new Set(draftParsed.arrangements.map(a => a.room).filter(Boolean))];

    const selectedArrangement = selectedArrangementIndex !== null 
      ? draftParsed.arrangements[selectedArrangementIndex] 
      : null;
    const selectedCourseName = selectedArrangement
      ? draftParsed.courseDefinitions.find(c => c.id === selectedArrangement?.id)?.courseName || ""
      : "";

    container.innerHTML = `
      <div class="visual-editor">
        <div class="visual-editor-toolbar">
          <button type="button" class="btn" data-action="exit-edit">退出编辑</button>
          <button type="button" class="btn" data-action="reset">重置</button>
          <button type="button" class="btn btn-primary" data-action="create-course">新增课程</button>
          <button type="button" class="btn btn-primary" data-action="export">导出 JSON</button>
        </div>
        
        <div class="visual-editor-notice">
          当前为临时编辑模式：导出后将自动退出并恢复原始课表展示。
        </div>
        
        ${validationError ? `
          <div class="visual-editor-error">
            ${escapeHtml(validationError)}
          </div>
        ` : ''}
        
        <div class="visual-editor-content">
          <div class="visual-editor-list">
            <h3>可视化课程列表（当前周）</h3>
            <div class="arrangement-grid">
              ${arrangementCards.map(dayGroup => `
                <div class="arrangement-day">
                  <div class="arrangement-day-title">${dayGroup.label}</div>
                  ${dayGroup.items.length === 0 
                    ? '<p class="arrangement-empty">本日暂无课程</p>'
                    : `<div class="arrangement-items">
                        ${dayGroup.items.map(item => `
                          <button type="button" 
                            class="arrangement-card ${selectedArrangementIndex === item.arrangementIndex ? 'is-selected' : ''}"
                            data-arrangement-index="${item.arrangementIndex}"
                            style="--card-color: ${item.color}">
                            <div class="arrangement-card-title">${escapeHtml(item.title)}</div>
                            <div class="arrangement-card-meta">${item.nodeText} · ${item.weekText}</div>
                            <div class="arrangement-card-info">${escapeHtml(item.teacher)} / ${escapeHtml(item.room)}</div>
                          </button>
                        `).join('')}
                      </div>`
                  }
                </div>
              `).join('')}
            </div>
          </div>
          
          <div class="visual-editor-panel">
            <h3>属性编辑面板</h3>
            ${creatingCourse 
              ? renderCreateForm(existingCourseNames, existingTeachers, existingRooms)
              : selectedArrangement 
                ? renderEditForm(selectedArrangement, selectedCourseName)
                : '<p class="panel-hint">请先在左侧点击课程卡片，或点击上方"新增课程"。</p>'
            }
          </div>
        </div>
      </div>
    `;
    
    bindEvents();
  }

  function renderCreateForm(existingCourseNames, existingTeachers, existingRooms) {
    const maxWeek = Math.max(1, draftParsed.meta.maxWeek || 1);
    return `
      <div class="editor-form">
        <label class="form-field">
          <span>课程名</span>
          <input type="text" list="course-name-list" data-field="courseName" placeholder="输入课程名称">
          <datalist id="course-name-list">
            ${existingCourseNames.map(name => `<option value="${escapeHtml(name)}">`).join('')}
          </datalist>
        </label>
        
        <label class="form-field">
          <span>教师</span>
          <input type="text" list="teacher-list" data-field="teacher" placeholder="输入教师姓名">
          <datalist id="teacher-list">
            ${existingTeachers.map(teacher => `<option value="${escapeHtml(teacher)}">`).join('')}
          </datalist>
        </label>
        
        <label class="form-field">
          <span>教室</span>
          <input type="text" list="room-list" data-field="room" placeholder="输入教室位置">
          <datalist id="room-list">
            ${existingRooms.map(room => `<option value="${escapeHtml(room)}">`).join('')}
          </datalist>
        </label>
        
        <label class="form-field">
          <span>星期</span>
          <select data-field="day">
            ${visibleDays.map(day => `<option value="${day}">${DAY_LABELS[day]}</option>`).join('')}
          </select>
        </label>
        
        <label class="form-field">
          <span>起始节</span>
          <input type="number" data-field="startNode" min="1" max="${maxNode}" value="1">
        </label>
        
        <div class="form-row">
          <label class="form-field">
            <span>起始周</span>
            <input type="number" data-field="startWeek" min="1" max="${maxWeek}" value="1">
          </label>
          <label class="form-field">
            <span>结束周</span>
            <input type="number" data-field="endWeek" min="1" max="${maxWeek}" value="${maxWeek}">
          </label>
        </div>
        
        <div class="form-actions">
          <button type="button" class="btn btn-primary" data-action="submit-create">保存新增课程</button>
          <button type="button" class="btn" data-action="cancel-create">取消新增</button>
        </div>
      </div>
    `;
  }

  function renderEditForm(arrangement, courseName) {
    const maxWeek = Math.max(1, draftParsed.meta.maxWeek || 1);
    return `
      <div class="editor-form">
        <label class="form-field">
          <span>课程名</span>
          <input type="text" data-field="courseName" value="${escapeHtml(courseName)}">
        </label>
        
        <label class="form-field">
          <span>教师</span>
          <input type="text" data-field="teacher" value="${escapeHtml(arrangement.teacher || '')}">
        </label>
        
        <label class="form-field">
          <span>教室</span>
          <input type="text" data-field="room" value="${escapeHtml(arrangement.room || '')}">
        </label>
        
        <label class="form-field">
          <span>星期</span>
          <select data-field="day">
            ${visibleDays.map(day => `
              <option value="${day}" ${arrangement.day === day ? 'selected' : ''}>${DAY_LABELS[day]}</option>
            `).join('')}
          </select>
        </label>
        
        <label class="form-field">
          <span>起始节</span>
          <input type="number" data-field="startNode" min="1" max="${maxNode}" value="${arrangement.startNode}">
        </label>
        
        <div class="form-row">
          <label class="form-field">
            <span>起始周</span>
            <input type="number" data-field="startWeek" min="1" max="${maxWeek}" value="${arrangement.startWeek}">
          </label>
          <label class="form-field">
            <span>结束周</span>
            <input type="number" data-field="endWeek" min="1" max="${maxWeek}" value="${arrangement.endWeek}">
          </label>
        </div>
        
        <div class="form-actions">
          <button type="button" class="btn btn-danger" data-action="delete">删除课程</button>
        </div>
      </div>
    `;
  }

  function buildArrangementCards(currentViewModel, arrangements) {
    return currentViewModel.dayColumns.map((dayColumn) => {
      const cards = currentViewModel.coursesByDay[dayColumn.day] ?? [];
      const items = cards
        .map((courseView) => {
          const arrangementIndex = arrangements.findIndex(
            (arrangement) =>
              arrangement.id === courseView.courseId &&
              arrangement.day === courseView.day &&
              arrangement.startNode === courseView.startNode &&
              arrangement.startWeek === courseView.startWeek &&
              arrangement.endWeek === courseView.endWeek
          );

          if (arrangementIndex < 0) return null;

          return {
            arrangementIndex,
            title: courseView.courseName,
            teacher: courseView.teacher,
            room: courseView.room,
            nodeText: courseView.nodeText,
            weekText: `${courseView.startWeek}-${courseView.endWeek}周`,
            color: courseView.color,
          };
        })
        .filter(Boolean);

      return {
        day: dayColumn.day,
        label: DAY_LABELS[dayColumn.day] ?? dayColumn.label,
        items,
      };
    });
  }

  function validateDraft() {
    const maxWeek = Math.max(1, draftParsed.meta.maxWeek || 1);

    for (let index = 0; index < draftParsed.arrangements.length; index += 1) {
      const arrangement = draftParsed.arrangements[index];
      if (arrangement.day < 1 || arrangement.day > 7) {
        return `第 ${index + 1} 条课程安排的星期超出范围（1-7）`;
      }
      if (!visibleDays.includes(arrangement.day)) {
        return `第 ${index + 1} 条课程安排的星期不在当前课表显示范围内`;
      }
      if (arrangement.startNode < 1 || arrangement.startNode > maxNode) {
        return `第 ${index + 1} 条课程安排的起始节次超出范围（1-${maxNode}）`;
      }
      if (arrangement.startWeek < 1 || arrangement.endWeek < 1) {
        return `第 ${index + 1} 条课程安排的周次必须大于等于 1`;
      }
      if (arrangement.startWeek > arrangement.endWeek) {
        return `第 ${index + 1} 条课程安排的起止周非法（开始周不能大于结束周）`;
      }
      if (arrangement.endWeek > maxWeek) {
        return `第 ${index + 1} 条课程安排的结束周超出最大周次 ${maxWeek}`;
      }
      const courseDef = draftParsed.courseDefinitions.find(
        (course) => course.id === arrangement.id
      );
      if (!courseDef || !courseDef.courseName?.trim()) {
        return `第 ${index + 1} 条课程安排关联课程名为空`;
      }
    }

    for (const course of draftParsed.courseDefinitions) {
      if (!course.courseName?.trim()) {
        return `课程定义 #${course.id} 的课程名不能为空`;
      }
    }

    return "";
  }

  function bindEvents() {
    container.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', handleAction);
    });
    
    container.querySelectorAll('[data-arrangement-index]').forEach(card => {
      card.addEventListener('click', () => {
        selectedArrangementIndex = Number(card.dataset.arrangementIndex);
        creatingCourse = false;
        render();
      });
    });
    
    container.querySelectorAll('[data-field]').forEach(field => {
      field.addEventListener('input', handleFieldChange);
      field.addEventListener('change', handleFieldChange);
    });
  }

  function handleAction(e) {
    const action = e.target.dataset.action;
    
    switch (action) {
      case 'enter-edit':
        editMode = true;
        draftParsed = deepClone(baselineParsed);
        selectedArrangementIndex = null;
        creatingCourse = false;
        validationError = "";
        render();
        break;
        
      case 'exit-edit':
        editMode = false;
        draftParsed = deepClone(baselineParsed);
        selectedArrangementIndex = null;
        creatingCourse = false;
        validationError = "";
        render();
        break;
        
      case 'reset':
        draftParsed = deepClone(baselineParsed);
        selectedArrangementIndex = null;
        creatingCourse = false;
        validationError = "";
        render();
        break;
        
      case 'create-course':
        creatingCourse = true;
        selectedArrangementIndex = null;
        render();
        break;
        
      case 'cancel-create':
        creatingCourse = false;
        render();
        break;
        
      case 'submit-create':
        submitCreateCourse();
        break;
        
      case 'delete':
        if (selectedArrangementIndex !== null) {
          draftParsed.arrangements.splice(selectedArrangementIndex, 1);
          selectedArrangementIndex = null;
          validationError = validateDraft();
          render();
        }
        break;
        
      case 'export':
        exportJson();
        break;
    }
  }

  function handleFieldChange(e) {
    const field = e.target.dataset.field;
    const value = e.target.value;
    
    if (creatingCourse) {
      // 创建模式下的字段更新
      return;
    }
    
    if (selectedArrangementIndex === null) return;
    
    const arrangement = draftParsed.arrangements[selectedArrangementIndex];
    if (!arrangement) return;
    
    if (field === 'courseName') {
      const courseDef = draftParsed.courseDefinitions.find(c => c.id === arrangement.id);
      if (courseDef) courseDef.courseName = value;
    } else if (field === 'teacher' || field === 'room') {
      arrangement[field] = value;
    } else {
      const numValue = Number(value);
      if (Number.isFinite(numValue)) {
        arrangement[field] = Math.floor(numValue);
      }
    }
    
    validationError = validateDraft();
    render();
  }

  function submitCreateCourse() {
    const courseName = container.querySelector('[data-field="courseName"]')?.value?.trim();
    const teacher = container.querySelector('[data-field="teacher"]')?.value?.trim() || '';
    const room = container.querySelector('[data-field="room"]')?.value?.trim() || '';
    const day = Number(container.querySelector('[data-field="day"]')?.value);
    const startNode = Number(container.querySelector('[data-field="startNode"]')?.value);
    const startWeek = Number(container.querySelector('[data-field="startWeek"]')?.value);
    const endWeek = Number(container.querySelector('[data-field="endWeek"]')?.value);
    
    if (!courseName) {
      validationError = "新增课程的课程名不能为空";
      render();
      return;
    }
    
    const maxWeek = Math.max(1, draftParsed.meta.maxWeek || 1);
    
    if (!visibleDays.includes(day)) {
      validationError = "新增课程的星期不在当前课表显示范围内";
      render();
      return;
    }
    if (startNode < 1 || startNode > maxNode) {
      validationError = `新增课程的起始节次超出范围（1-${maxNode}）`;
      render();
      return;
    }
    if (startWeek < 1 || endWeek < 1) {
      validationError = "新增课程的周次必须大于等于 1";
      render();
      return;
    }
    if (startWeek > endWeek) {
      validationError = "新增课程的起止周非法（开始周不能大于结束周）";
      render();
      return;
    }
    if (endWeek > maxWeek) {
      validationError = `新增课程的结束周超出最大周次 ${maxWeek}`;
      render();
      return;
    }
    
    const maxCourseId = draftParsed.courseDefinitions.reduce(
      (maxId, course) => Math.max(maxId, course.id),
      0
    );
    const nextCourseId = maxCourseId + 1;
    
    draftParsed.courseDefinitions.push({
      id: nextCourseId,
      courseName,
    });
    
    draftParsed.arrangements.push({
      id: nextCourseId,
      day,
      startNode,
      step: 2,
      startWeek,
      endWeek,
      teacher,
      room,
    });
    
    creatingCourse = false;
    selectedArrangementIndex = draftParsed.arrangements.length - 1;
    validationError = validateDraft();
    render();
  }

  function exportJson() {
    const error = validateDraft();
    if (error) {
      validationError = error;
      render();
      return;
    }
    
    validationError = "";
    const text = serializeTimetableDataToFileText(draftParsed);
    const blob = new Blob([text], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${draftParsed.meta.tableName || "timetable"}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // 退出编辑模式
    editMode = false;
    draftParsed = deepClone(baselineParsed);
    selectedArrangementIndex = null;
    creatingCourse = false;
    render();
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // 初始渲染
  render();
}
