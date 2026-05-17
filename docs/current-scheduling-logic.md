# Current Scheduling Logic

Status: reflects the current implementation in the working tree.

This document describes the scheduling logic that is currently implemented in [app.js](C:\Users\filic\Documents\New project 5\app.js).

## 1. Goal

The current engine tries to balance these business goals:

- protect critical coverage for `Fruehschicht` and `Spaetschicht`
- avoid leaving high-hour employees underplanned
- reduce over-protection of `Mittelschicht` preference when other roles are structurally short
- use `Kernzeit` as a targeted exact-fit and repair tool
- keep manual locks compatible with automatic replanning
- allow small manager-driven supplement shifts without rerunning the engine

## 2. Main entry points

The main flow is:

1. `generateSchedule()`
2. `createSchedulingEngineContext(planningDays)`
3. `createEmployeeStats()`
4. `runSchedulingEngine(employeeStats, engine)`
5. `updateSummaryAndMessages(...)`

Manual rebalancing still goes through:

- `rebalanceAfterManualChange()`

That means auto-planning and post-manual replanning use the same core engine.

There is now also a separate no-rebalance path for the dedicated manual add panel:

- `onManualAddSubmit()`
- `refreshDerivedScheduleState()`

That path updates the current schedule state, coverage, summary, and status messages without calling `generateSchedule()`.

## 3. Weekly role diagnosis

Before assigning shifts, the engine builds a weekly diagnosis for the fixed roles:

- `early`
- `middle`
- `late`

This happens in:

- `buildWeeklyRoleDiagnostics(planningDays, roleMap)`

For each role, the engine calculates:

- `weeklyDemandHours`
- `preferredSupplyHours`
- `flexibleSupplyHours`
- `shortageHours`
- `shortageRatio`

Business meaning:

- if a role already has a clear weekly shortage, preference protection is softened
- if a role is structurally short, substitute candidates can be considered earlier
- this is especially important for `Spaetschicht`

## 4. Day ordering

The planner still prioritizes days by demand pressure.

The ordering is built from:

- `sortPlanningDaysByPriority(...)`
- `getDayDemandHours(...)`
- `compareDayFallbackPriority(...)`

Business meaning:

- heavier days are planned first
- if demand is equal, later-week days such as Saturday and Friday are favored

## 5. Employee stats and hour limits

Each employee receives a planning stat object in:

- `createEmployeeStats()`

Important fields:

- `assignedHours`
- `hardCap`
- `softTarget`
- `overtimeCapacity`

Meaning:

- `hardCap` is the real maximum after overtime release
- `softTarget` is the preferred planning target before harder escalation

This prevents employees from being removed from the candidate pool too early.

## 6. Planning pressure

The current engine no longer relies only on preference and planning priority.

It also computes employee pressure through:

- `getRemainingAvailableDays(entry, engine)`
- `getPlanningPressure(entry, engine)`

Current idea:

- employees with many remaining hours and fewer remaining safe assignment days should become more urgent

Business effect:

- large contracts are less likely to remain badly underplanned
- low-hour contracts are less likely to consume too many early slots

## 7. Scheduling phases

The current `runSchedulingEngine(...)` flow is:

1. critical full-shift pass
2. critical repair pass
3. critical full-to-core repack
4. critical core fallback pass
5. repeated critical repair
6. overtime release if critical gaps still remain
7. repeat critical full/core attempts with overtime
8. middle-shift pass
9. global repair pass
10. normalize overfilled shifts

The key helper phases are:

- `runCriticalFullPhase(...)`
- `runCriticalCoreFallbackPhase(...)`
- `runMiddlePhase(...)`
- `runGlobalRepairPhase(...)`
- `normalizeAllDays(...)`

## 8. Critical shifts first

The engine treats these roles as critical:

- `Fruehschicht`
- `Spaetschicht`

It uses:

- `buildAlternatingCriticalRoleQueue(...)`

This creates an alternating order like:

- `Frueh -> Spaet -> Frueh -> Spaet`

Business meaning:

- the engine does not fill all early shifts first and only then look at late shifts
- both critical sides are protected during the same pass

## 9. Middle shift logic

`Mittelschicht` is still planned later than critical shifts, but it is no longer protected too rigidly.

Current behavior:

- `runMiddlePhase(...)` only assigns middle shifts on days where the same day has no remaining critical gap
- however, middle preference is no longer preserved as a hard rule for the whole week

The softer reservation logic is in:

- `isReservedForMiddleShift(...)`

Business meaning:

- if `Frueh` or `Spaet` already has a meaningful weekly shortage, the engine stops over-protecting middle-preference employees
- this is what allows cases like employee `F` to move into `Spaetschicht` coverage

## 10. Candidate filtering

Candidate filtering is handled mainly by:

- `selectBestCandidate(...)`
- `canTakeTask(...)`
- `staysWithinRegularHours(...)`

Current rules include:

- one assignment per employee per day
- no assignment on locked cells
- regular-hours-first behavior when possible
- `core` tasks are allowed more broadly than before
- `core-closeout` is used for small remaining-hour situations

For the separate manual add panel, there is one extra UI-level business rule:

- manual supplement shifts may only be written into cells that are currently `frei`

## 11. Scoring logic

The engine now scores tasks by role and phase.

Main scoring functions:

- `scoreCriticalFullTask(...)`
- `scoreMiddleTask(...)`
- `scoreCoreFallbackTask(...)`

Current scoring direction:

- weekly role shortage matters
- planning pressure matters
- preference still matters
- planning priority still matters
- overtime is penalized
- spacing across the week still matters

Business meaning:

- preference is no longer the only strong driver
- business shortage and remaining hour pressure now have more influence

## 12. Current role of `Kernzeit`

`Kernzeit` is no longer only a special fallback for exact `20h` contracts.

Current behavior includes:

- `repackTwentyHourCriticalAssignments(...)`
- `runCriticalCoreFallbackPhase(...)`
- `runExactFitCoreCloseoutPhase(...)`

What this means:

- full assignments can be compressed to core when that improves weekly fit
- non-`20h` employees can also receive `core` assignments when the hour fit makes sense
- small remaining budgets can be used more precisely at the end of the week

This is what enables cases like:

- `I` and `J` receiving `Spaetschicht (Kernzeit)` instead of being left with unusable hour fragments

## 13. Repair logic

The current engine uses both local and cross-day repair.

Main functions:

- `repairCriticalCoverage(...)`
- `repairCoverageForDayV2(...)`
- `tryReassignWithinDayV2(...)`
- `backfillOriginalTaskV2(...)`
- `repairCoverageAcrossDays(...)`
- `tryMoveAssignmentFromOtherDay(...)`
- `runGlobalRepairPhase(...)`

Business meaning:

- the engine does not only assign once and stop
- it tries to repair weak spots after the first distribution
- it can move assignments across days when higher-priority coverage needs it

## 14. Overfill normalization

If a shift ends up overfilled, the engine removes the least suitable assignment first.

Main functions:

- `normalizeDayOverfillV2(...)`
- `overfillRemovalScoreV2(...)`

Business meaning:

- preference and planning priority are also respected during rollback

## 15. Current practical effect

Compared with the earlier V2 state, the current logic improves these cases:

- high-hour employees are less likely to stay heavily underplanned
- `Mittelschicht` preference is softer when `Spaetschicht` or `Fruehschicht` is structurally short
- `Kernzeit` can be used for exact-fit closeout beyond only `20h` employees
- final repair is more explicit

In the current sample scenario, this means:

- employee `F` can be pulled into `Spaetschicht` coverage and reach full planned hours
- employees `I` and `J` can receive `Spaetschicht` core assignments

## 16. Remaining limitations

The engine is still heuristic.

It does not yet guarantee:

- globally optimal weekly distribution
- labor-law optimization
- vacation and absence optimization
- long-term fairness across multiple weeks

So the correct description is:

- this is now a stronger and more business-aware V2 heuristic engine
- it is not yet a mathematical optimizer

---

# 当前排班逻辑

状态：本文档描述的是当前工作区里已经实现的排班逻辑。

这份文档对应的是 [app.js](C:\Users\filic\Documents\New project 5\app.js) 里的当前实现。

## 1. 目标

当前引擎主要在平衡这些业务目标：

- 优先保障 `Fruehschicht` 和 `Spaetschicht` 这类关键班次
- 尽量避免高工时员工明显排不满
- 当其他角色整周明显缺人时，避免把 `Mittelschicht` 偏好保护得过硬
- 把 `Kernzeit` 当作精确补差和修复工具
- 让手动锁定和自动重排继续兼容

## 2. 主流程入口

当前主流程是：

1. `generateSchedule()`
2. `createSchedulingEngineContext(planningDays)`
3. `createEmployeeStats()`
4. `runSchedulingEngine(employeeStats, engine)`
5. `updateSummaryAndMessages(...)`

手动修改后的重平衡仍然走：

- `rebalanceAfterManualChange()`

这意味着自动排班和手动改班后的自动重排，使用的是同一套核心引擎。

## 3. 整周角色诊断

在真正开始分配班次之前，引擎会先对固定角色做一轮整周诊断：

- `early`
- `middle`
- `late`

这部分逻辑在：

- `buildWeeklyRoleDiagnostics(planningDays, roleMap)`

当前会计算：

- `weeklyDemandHours`
- `preferredSupplyHours`
- `flexibleSupplyHours`
- `shortageHours`
- `shortageRatio`

业务含义：

- 如果某个角色整周已经明显缺人，那么偏好保护会被适当放松
- 如果某个角色本来就结构性短缺，那么系统会更早考虑替补候选人
- 这对 `Spaetschicht` 尤其重要

## 4. 日期优先级

当前仍然会先按需求压力排序日期。

相关逻辑在：

- `sortPlanningDaysByPriority(...)`
- `getDayDemandHours(...)`
- `compareDayFallbackPriority(...)`

业务含义：

- 需求更重的天先排
- 如果需求相同，会优先照顾周五、周六这类后段高压日

## 5. 员工统计与工时边界

每个员工在一次排班中都会获得一个统计对象，生成于：

- `createEmployeeStats()`

关键字段包括：

- `assignedHours`
- `hardCap`
- `softTarget`
- `overtimeCapacity`

含义是：

- `hardCap` 是放开加班后的真实硬上限
- `softTarget` 是正式激进分配前的目标工时

这样可以避免员工过早被踢出候选池。

## 6. 排班压力

当前引擎不再只看偏好和排班优先级。

还会通过以下函数计算员工压力：

- `getRemainingAvailableDays(entry, engine)`
- `getPlanningPressure(entry, engine)`

当前核心思想是：

- 剩余工时很多、但剩余安全可排天数不多的人，会变得更紧急

业务效果：

- 大合同员工更不容易到周末还明显排不满
- 小合同员工也不容易过早占掉太多关键位置

## 7. 排班阶段

当前 `runSchedulingEngine(...)` 的大体流程是：

1. 关键 full 班次分配
2. 关键缺口修复
3. 关键班次 `full -> core` 重打包
4. 关键 core 兜底分配
5. 再次修复关键缺口
6. 如果还缺关键班次，再释放加班能力
7. 在加班条件下重复关键 full/core 尝试
8. `Mittelschicht` 正常分配
9. 全局修复阶段
10. 对超额分配做归一化处理

关键阶段函数包括：

- `runCriticalFullPhase(...)`
- `runCriticalCoreFallbackPhase(...)`
- `runMiddlePhase(...)`
- `runGlobalRepairPhase(...)`
- `normalizeAllDays(...)`

## 8. 为什么先排关键班次

当前把下面两类角色视为关键班次：

- `Fruehschicht`
- `Spaetschicht`

并通过：

- `buildAlternatingCriticalRoleQueue(...)`

生成交替顺序，例如：

- `Frueh -> Spaet -> Frueh -> Spaet`

业务含义：

- 不是先把所有早班排完再看晚班
- 而是在同一轮里同时保护两边的关键覆盖

## 9. `Mittelschicht` 的当前逻辑

`Mittelschicht` 现在仍然比关键班次靠后，但已经不再是过去那种过硬保护。

当前行为是：

- `runMiddlePhase(...)` 只会在“当天已经没有关键缺口”的情况下安排中班
- 但 `Mittelschicht` 偏好不再作为整周硬保留规则存在

更柔性的保护逻辑在：

- `isReservedForMiddleShift(...)`

业务含义：

- 如果 `Frueh` 或 `Spaet` 在整周层面已经明显短缺，系统就不会继续过度保护中班偏好员工
- 这正是像 `F` 这种员工现在能被拉去补 `Spaetschicht` 的原因

## 10. 候选人过滤

候选人过滤主要由这些函数负责：

- `selectBestCandidate(...)`
- `canTakeTask(...)`
- `staysWithinRegularHours(...)`

当前规则包括：

- 每个员工每天最多一个班次
- 锁定单元格不会被自动重排占用
- 能在常规工时内解决时，优先不动用加班
- `core` 任务现在比旧版更广泛可用
- `core-closeout` 主要用于小剩余工时的收尾

## 11. 打分逻辑

当前已经按角色和阶段拆开打分。

主要函数有：

- `scoreCriticalFullTask(...)`
- `scoreMiddleTask(...)`
- `scoreCoreFallbackTask(...)`

当前打分方向是：

- 先看整周角色缺口
- 再看员工排班压力
- 再看偏好是否匹配
- 再看排班优先级
- 同时对加班进行惩罚
- 继续考虑一周内的间隔分布

业务含义：

- 偏好仍然重要
- 但已经不再是唯一强驱动
- 业务缺口和剩余工时压力现在更有影响力

## 12. `Kernzeit` 的当前角色

`Kernzeit` 现在已经不再只是“精确 `20h` 员工专用兜底规则”。

当前相关逻辑包括：

- `repackTwentyHourCriticalAssignments(...)`
- `runCriticalCoreFallbackPhase(...)`
- `runExactFitCoreCloseoutPhase(...)`

当前含义是：

- 当 `full` 更不合适时，已有 full 班次可以压缩成 core
- 非 `20h` 员工也可以在合适情况下拿到 `core`
- 小剩余工时可以在周后段被更精确地利用

这就是为什么像：

- `I`
- `J`

现在也能拿到 `Spaetschicht (Kernzeit)`，而不是把尾部工时浪费掉。

## 13. 修复逻辑

当前引擎既有日内修复，也有跨天修复。

主要函数有：

- `repairCriticalCoverage(...)`
- `repairCoverageForDayV2(...)`
- `tryReassignWithinDayV2(...)`
- `backfillOriginalTaskV2(...)`
- `repairCoverageAcrossDays(...)`
- `tryMoveAssignmentFromOtherDay(...)`
- `runGlobalRepairPhase(...)`

业务含义：

- 不是排一轮就结束
- 初排之后会继续修弱点
- 当高优先级日期更需要人时，系统可以尝试把人从别的天挪过来

## 14. 超额分配归一化

如果某个班次排多了，系统会优先回收最不合适的那条分配。

相关函数：

- `normalizeDayOverfillV2(...)`
- `overfillRemovalScoreV2(...)`

业务含义：

- 在回收阶段，偏好和排班优先级仍然会被考虑

## 15. 当前实际效果

和前一阶段的 V2 相比，当前逻辑已经改善了这些问题：

- 高工时员工不那么容易严重排不满
- 当 `Spaetschicht` 或 `Fruehschicht` 整周短缺时，`Mittelschicht` 偏好会更柔和
- `Kernzeit` 可以用于非 `20h` 员工的小尾差补位
- 全局修复阶段变得更明确

在当前示例场景里，这意味着：

- `F` 可以被拉入 `Spaetschicht` 覆盖，并最终排满
- `I` 和 `J` 可以获得 `Spaetschicht` 的 core 班次

## 16. 仍然存在的限制

当前引擎本质上仍然是启发式算法。

它还不能保证：

- 整周全局最优
- 劳动法级别优化
- 请假和缺勤的完整优化
- 跨多周的长期公平性

所以最准确的说法是：

- 当前已经是一套更强、更贴近业务的 V2 启发式排班引擎
- 但还不是数学优化器
