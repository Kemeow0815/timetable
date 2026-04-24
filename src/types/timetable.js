/**
 * @typedef {Object} TimetableConfigSegment
 * @property {number} courseLen
 * @property {number} id
 * @property {string} name
 */

/**
 * @typedef {Object} TimetableNodeTime
 * @property {number} node
 * @property {string} startTime
 * @property {string} endTime
 * @property {number} timeTable
 */

/**
 * @typedef {Object} TimetableMetaSegment
 * @property {number} id
 * @property {string} tableName
 * @property {number} maxWeek
 * @property {number} nodes
 * @property {string} startDate
 * @property {number} timeTable
 * @property {boolean} [showSat]
 * @property {boolean} [showSun]
 */

/**
 * @typedef {Object} TimetableCourseDefinition
 * @property {number} id
 * @property {string} courseName
 * @property {string} [color]
 */

/**
 * @typedef {Object} TimetableCourseArrangement
 * @property {number} id
 * @property {number} day
 * @property {number} startNode
 * @property {number} step
 * @property {number} startWeek
 * @property {number} endWeek
 * @property {string} [teacher]
 * @property {string} [room]
 */

/**
 * @typedef {Object} ParsedTimetableData
 * @property {TimetableConfigSegment} config
 * @property {TimetableNodeTime[]} nodeTimes
 * @property {TimetableMetaSegment} meta
 * @property {TimetableCourseDefinition[]} courseDefinitions
 * @property {TimetableCourseArrangement[]} arrangements
 */

/**
 * @typedef {Object} TimetableCourseView
 * @property {number} courseId
 * @property {string} courseName
 * @property {string} color
 * @property {string} teacher
 * @property {string} room
 * @property {number} day
 * @property {number} startNode
 * @property {number} endNode
 * @property {number} durationNodes
 * @property {number} startWeek
 * @property {number} endWeek
 * @property {string} nodeText
 * @property {string} timeText
 */

/**
 * @typedef {Object} TimetableDayColumn
 * @property {number} day
 * @property {string} label
 */

/**
 * @typedef {Object} TimetableNodeRow
 * @property {number} node
 * @property {string} startTime
 * @property {string} endTime
 */

/**
 * @typedef {Object} TimetableViewModel
 * @property {string} tableName
 * @property {number} maxWeek
 * @property {number} currentWeek
 * @property {number[]} weeks
 * @property {TimetableDayColumn[]} dayColumns
 * @property {TimetableNodeRow[]} nodeRows
 * @property {Record<number, TimetableCourseView[]>} coursesByDay
 */

export {};
