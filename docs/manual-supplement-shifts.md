# Manual Supplement Shifts

## English

### Purpose
This document describes the standalone manual add panel that sits:

- below `Automatisch erzeugter Dienstplan`
- above `Bedarf gegen Ist`

It exists for the store-manager scenario where the weekly schedule is already acceptable, but one or two real-world adjustments are still needed without regenerating the rest of the week.

### UX behavior

- The panel has three fields: `Name`, `Wochentag`, `Schicht`
- `Schicht` exposes exact assignable variants such as `Fruehschicht (voll)` or `Spaetschicht (Kernzeit)`
- the action button is disabled until all three fields are selected
- the target cell must currently be `frei`
- if the target cell is already occupied, the add is rejected and a validation message is shown

### What happens on success

- the selected assignment is written directly into `state.schedule[employeeId][dayKey]`
- the cell is marked with:
  - `assignmentId`
  - `variant`
  - `locked = true`
  - `source = "manual"`
- the scheduling engine is not run again
- no other employee/day cell is changed

### What updates immediately

- the schedule table
- `Ist-Stunden`
- `Saldo`
- summary cards
- `Bedarf gegen Ist`
- `Status und Plausibilitaet`

### Important boundary

This panel is intentionally separate from the existing in-table schedule dropdowns.

- in-table edits still use the older manual-edit path and can trigger replanning
- the manual add panel is the explicit no-rebalance path

### Persistence

No extra persistence layer was added.

- manual supplement shifts are stored directly in `state.schedule`
- JSON export/import automatically preserves them

### Relevant implementation points

- UI structure: [index.html](C:\Users\filic\Documents\New project 5\index.html)
- panel styling: [styles.css](C:\Users\filic\Documents\New project 5\styles.css)
- panel render and submit flow: [app.js](C:\Users\filic\Documents\New project 5\app.js)

Key functions:

- `renderManualAddPanel()`
- `onManualAddSubmit()`
- `refreshDerivedScheduleState()`
- `buildManualAddAssignmentOptions()`

## 中文

### 目的
这份文档说明的是一个独立的“手动补班面板”，它位于：

- `Automatisch erzeugter Dienstplan` 下方
- `Bedarf gegen Ist` 上方

它服务的业务场景是：整周排班整体已经可以接受，但店长还需要根据现实情况做一两个小调整，而且不希望因此重新生成整周其他人的班次。

### 交互行为

- 面板有三个字段：`Name`、`Wochentag`、`Schicht`
- `Schicht` 会直接提供精确可选项，例如 `Fruehschicht (voll)`、`Spaetschicht (Kernzeit)`
- 当三个字段没有选完整时，按钮保持禁用
- 目标格子当前必须是 `frei`
- 如果目标格已经有班，则本次补班会被拒绝，并显示校验提示

### 补班成功后会发生什么

- 选中的班次会被直接写入 `state.schedule[employeeId][dayKey]`
- 对应单元格会被标记为：
  - `assignmentId`
  - `variant`
  - `locked = true`
  - `source = "manual"`
- 不会重新运行排班引擎
- 不会改动其他员工、其他日期的任何排班格子

### 会立即刷新的内容

- 上方排班表
- `Ist-Stunden`
- `Saldo`
- 汇总卡片
- `Bedarf gegen Ist`
- `Status und Plausibilitaet`

### 重要边界

这个面板是故意和排班表内原有下拉编辑分开的。

- 表格内直接改班仍然沿用旧的手动编辑路径，并可能触发重排
- 这个手动补班面板才是明确的“不重排路径”

### 持久化

这次没有增加额外的持久化层。

- 手动补班直接保存在 `state.schedule` 里
- JSON 导出和导入会自动保留这些补班结果

### 相关实现位置

- UI 结构：[index.html](C:\Users\filic\Documents\New project 5\index.html)
- 面板样式：[styles.css](C:\Users\filic\Documents\New project 5\styles.css)
- 面板渲染和提交逻辑：[app.js](C:\Users\filic\Documents\New project 5\app.js)

关键函数：

- `renderManualAddPanel()`
- `onManualAddSubmit()`
- `refreshDerivedScheduleState()`
- `buildManualAddAssignmentOptions()`
