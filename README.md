# 📚 克喵的课程表

一个精美的课程表展示应用，支持明暗主题切换、响应式布局和可视化编辑。

## ✨ 特性

- 🌓 **明暗主题切换** - 支持浅色/深色模式，自动适应系统偏好
- 📱 **响应式设计** - 完美适配桌面端和移动端
- ⚡ **实时状态** - 显示当前上课状态和下一节课倒计时
- 🎨 **可视化编辑** - 内置图形化编辑器，支持增删改课程
- 📤 **数据导出** - 支持导出编辑后的课表数据
- 🔄 **周次导航** - 支持切换不同周次查看课程安排

## 🚀 部署

### GitHub Pages

1. Fork 本仓库
2. 进入仓库 Settings -> Pages
3. Source 选择 "GitHub Actions"
4. 推送代码后自动部署

### Cloudflare Pages

1. 连接 GitHub 仓库
2. 构建命令：`npm run build`
3. 输出目录：`dist`

### Vercel

1. 导入 GitHub 仓库
2. 框架预设：Vite
3. 自动识别构建配置

### Netlify

1. 连接 GitHub 仓库
2. 构建命令：`npm run build`
3. 发布目录：`dist`

### EdgeOne

1. 创建静态站点
2. 连接 GitHub 仓库
3. 使用默认构建配置

## 📁 项目结构

```
.
├── data/                   # 课表数据
│   └── 大三下.json         # 课程数据文件
├── src/
│   ├── components/         # 组件
│   │   ├── LiveTimetableStatus.js    # 实时状态组件
│   │   ├── TimetableCourseCard.js    # 课程卡片组件
│   │   ├── TimetableDayList.js       # 日列表组件（移动端）
│   │   ├── TimetableGrid.js          # 网格组件（桌面端）
│   │   └── TimetableVisualEditor.js  # 可视化编辑器
│   ├── styles/
│   │   └── main.css        # 主样式文件
│   ├── types/
│   │   └── timetable.js    # 类型定义
│   ├── utils/
│   │   ├── timetable-parser.js       # 数据解析
│   │   └── timetable-normalizer.js   # 数据标准化
│   └── main.js             # 入口文件
├── index.html              # 主页面
├── package.json            # 项目配置
├── vite.config.js          # Vite 配置
└── README.md               # 说明文档
```

## 🛠️ 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

## 📝 数据格式

课表数据使用 JSON 格式，包含以下字段：

- `courses` - 课程定义列表
- `schedules` - 课程安排列表
- `timeTable` - 节次时间配置
- `settings` - 课表设置（学期开始日期、最大周次等）

## 🎯 使用说明

1. 将课表数据放入 `data/` 目录
2. 修改 `src/main.js` 中的数据文件路径（可选）
3. 部署到任意静态托管平台

## 📄 许可证

MIT License

---

Made with ❤️ by Kemeow
