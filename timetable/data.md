# 课程表数据字段说明

本文档说明 `大三下.json` 课程表数据文件中各字段的含义。

## 文件结构概览

```json
{
  "courseLen": 45,           // 课程时长（分钟）
  "id": 3,                   // 时间表ID
  "name": "大三下",          // 时间表名称
  "sameBreakLen": false,     // 课间休息是否统一
  "sameLen": true,           // 课程时长是否统一
  "theBreakLen": 10,         // 课间休息时长（分钟）
  "timeTable": [...],        // 时间段数组
  "settings": {...},         // 设置对象
  "courses": [...],          // 课程列表
  "schedules": [...]         // 课程安排
}
```

---

## 顶层字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `courseLen` | number | 每节课的时长（分钟），如 45 表示每节课 45 分钟 |
| `id` | number | 时间表的唯一标识ID |
| `name` | string | 时间表的名称，如 "大三下" |
| `sameBreakLen` | boolean | 是否所有课间休息时间相同 |
| `sameLen` | boolean | 是否所有课程时长相同 |
| `theBreakLen` | number | 课间休息时长（分钟） |
| `timeTable` | array | 一天中各节课的时间段定义 |
| `settings` | object | 课表的显示设置和配置 |
| `courses` | array | 所有课程的基本信息 |
| `schedules` | array | 课程的具体安排（时间、地点等） |

---

## timeTable（时间段）

定义一天中每节课的开始和结束时间。

```json
{
  "endTime": "08:45",      // 结束时间（HH:mm）
  "node": 1,               // 节次编号（1-11）
  "startTime": "08:00",    // 开始时间（HH:mm）
  "timeTable": 1           // 时间表ID
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `node` | number | 节次，第几节课（1-11） |
| `startTime` | string | 开始时间，格式 "HH:mm" |
| `endTime` | string | 结束时间，格式 "HH:mm" |
| `timeTable` | number | 所属时间表ID |

---

## settings（设置）

课表的显示配置和学期设置。

```json
{
  "background": "",              // 背景图片（空表示无）
  "courseTextColor": -1,         // 课程文字颜色
  "id": 3,                       // 设置ID
  "itemAlpha": 50,               // 课程块透明度
  "itemHeight": 42,              // 课程块高度
  "itemTextSize": 12,            // 课程文字大小
  "maxWeek": 20,                 // 最大周数
  "nodes": 11,                   // 每天节数
  "school": "",                  // 学校名称
  "showOtherWeekCourse": true,   // 是否显示其他周的课程
  "showSat": false,              // 是否显示周六
  "showSun": false,              // 是否显示周日
  "showTime": false,             // 是否显示时间
  "startDate": "2026-3-2",       // 学期开始日期
  "strokeColor": -2130706433,    // 边框颜色
  "sundayFirst": false,          // 是否周日为一周第一天
  "tableName": "大三下",         // 课表名称
  "textColor": -16777216,        // 文字颜色
  "tid": "...",                  // 唯一标识符
  "timeTable": 1,                // 时间表ID
  "type": 0,                     // 类型
  "updateTime": 1772780768613,   // 更新时间戳
  "widgetCourseTextColor": -1,   // 小部件课程文字颜色
  "widgetItemAlpha": 50,         // 小部件透明度
  "widgetItemHeight": 64,        // 小部件高度
  "widgetItemTextSize": 12,      // 小部件文字大小
  "widgetStrokeColor": -2130706433, // 小部件边框颜色
  "widgetTextColor": -16777216   // 小部件文字颜色
}
```

### 关键字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `maxWeek` | number | 本学期总周数 |
| `nodes` | number | 每天的课程节数 |
| `startDate` | string | 学期开始日期，格式 "YYYY-M-D" |
| `tableName` | string | 课表显示名称 |
| `showSat` | boolean | 课表是否显示周六列（基础设置） |
| `showSun` | boolean | 课表是否显示周日列（基础设置） |
| `weekendDisplay` | object | 特定周次显示周末的配置（可选） |

#### weekendDisplay 配置

```json
{
  "weekendDisplay": {
    "enabled": true,           // 是否启用特定周次显示
    "weeks": [13, 14, 15, 16], // 需要显示周末的周次列表
    "days": ["sat", "sun"]     // 显示的日期："sat"=周六, "sun"=周日
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `enabled` | boolean | 是否启用特定周次显示周末 |
| `weeks` | number[] | 需要显示周末的周次列表，如 `[13, 14, 15, 16]` |
| `days` | string[] | 显示的日期，可选 `"sat"`（周六）、`"sun"`（周日） |

**注意**：`weekendDisplay` 优先级高于 `showSat`/`showSun`。如果某周在 `weekendDisplay.weeks` 中，则会显示配置的周末列，不受基础设置影响。

---

## courses（课程列表）

定义所有课程的基本信息。

```json
{
  "color": "#ffb500b0",        // 课程颜色（ARGB格式）
  "courseName": "MATLAB 及控制系统仿真",  // 课程名称
  "credit": 0,                 // 学分
  "id": 0,                     // 课程ID
  "note": "",                  // 备注
  "tableId": 3                 // 所属时间表ID
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | number | 课程唯一标识ID，用于关联 schedules |
| `courseName` | string | 课程名称 |
| `color` | string | 课程显示颜色，ARGB格式（如 `#ffb500b0`）|
| `credit` | number | 课程学分 |
| `note` | string | 课程备注 |
| `tableId` | number | 所属时间表ID |

---

## schedules（课程安排）

定义每门课程的具体上课时间和地点。

```json
{
  "day": 1,                // 星期几（1=周一，7=周日）
  "endTime": "",           // 结束时间（通常为空）
  "endWeek": 4,            // 结束周
  "id": 0,                 // 课程ID（关联 courses）
  "level": 0,              // 层级
  "ownTime": false,        // 是否使用自定义时间
  "room": "G1躬行楼313",   // 教室/地点
  "startNode": 3,          // 开始节次
  "startTime": "",         // 开始时间（通常为空）
  "startWeek": 1,          // 开始周
  "step": 2,               // 持续节数
  "tableId": 3,            // 时间表ID
  "teacher": "",           // 教师姓名
  "type": 0                // 类型（0=正常课程，2=实训/特殊）
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | number | 课程ID，对应 `courses` 中的 `id` |
| `day` | number | 星期几，1-7（1=周一，7=周日）|
| `startWeek` | number | 开始周（如第1周开始）|
| `endWeek` | number | 结束周（如第4周结束）|
| `startNode` | number | 开始节次（第几节课开始）|
| `step` | number | 持续节数（通常2节连上）|
| `room` | string | 上课地点/教室 |
| `teacher` | string | 教师姓名 |
| `type` | number | 课程类型：0=正常课程，2=实训/实践课程 |
| `ownTime` | boolean | 是否使用自定义时间（而非按节次计算）|

---

## 数据关联关系

```
courses (课程定义)
  │
  │ id
  ▼
schedules (课程安排) ──► timeTable (时间段)
  │                         │
  │                         │ node
  ▼                         ▼
viewModel (视图模型) ◄── 计算时间范围
```

1. `courses` 定义课程的基本信息（名称、颜色）
2. `schedules` 定义何时何地上课，通过 `id` 关联到 `courses`
3. `timeTable` 提供每节课的具体时间
4. 系统根据当前周数筛选 `schedules`，结合 `timeTable` 生成最终课表视图

---

## 示例：解析一门课程

以 "MATLAB 及控制系统仿真" 为例：

**courses 中定义：**
```json
{
  "id": 0,
  "courseName": "MATLAB 及控制系统仿真",
  "color": "#ffb500b0"
}
```

**schedules 中安排：**
```json
{
  "id": 0,              // 对应 MATLAB 课程
  "day": 1,             // 周一
  "startWeek": 1,       // 第1周开始
  "endWeek": 4,         // 第4周结束
  "startNode": 3,       // 第3节开始
  "step": 2,            // 上2节课
  "room": "G1躬行楼313" // 地点
}
```

**显示结果：**
- 第1-4周的周一，第3-4节（10:00-11:40）
- 在 G1躬行楼313 上 MATLAB 课
