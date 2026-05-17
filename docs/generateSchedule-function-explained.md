# `generateSchedule()` Function Explained

## English

### 1. Business purpose

`generateSchedule()` is the main automatic scheduling entry point in [`app.js`](C:\Users\filic\Documents\New project 5\app.js).

Its job is not just "fill shifts". It is responsible for running the full V2 scheduling workflow:

- normalize the current demand data
- rebuild the working schedule grid
- validate whether scheduling is allowed to start
- build a planning context for the V2 engine
- build per-employee planning statistics
- run the multi-phase scheduling engine
- recalculate summary, coverage, and status messages
- trigger UI re-rendering

In plain language:

`generateSchedule()` is the function that turns the current inputs in `state` into a new schedule result.

---

### 2. Where the input comes from

`generateSchedule()` does not accept business data directly as arguments.

It reads almost everything from the global `state` object:

- `state.mode`
- `state.selectedDay`
- `state.activeDays`
- `state.shifts`
- `state.employees`
- `state.demandOverrides`
- `state.schedule`

The only direct option it receives is:

- `preserveManualLocks`

This controls whether manually locked cells from the existing schedule should be carried into the new run.

---

### 3. Direct code flow inside `generateSchedule()`

Current function location:

- [`app.js`](C:\Users\filic\Documents\New project 5\app.js): `generateSchedule()`

Step by step, it does this:

1. `ensureDemandShape()`
2. increment `state.generationRevision`
3. `getPlanningDays()`
4. copy or clear old schedule seed based on `preserveManualLocks`
5. `initializeSchedule(seedSchedule, preserveManualLocks)`
6. `validateStaticConfig()`
7. if there are no planning days:
   - build warning messages
   - `buildEmptySummary()`
   - `buildCoverageMap([])`
   - `renderAll()`
   - stop
8. if static validation contains blocking errors:
   - keep those messages
   - `buildEmptySummary()`
   - `buildCoverageMap([])`
   - `renderAll()`
   - stop
9. `createSchedulingEngineContext(planningDays)`
10. `createEmployeeStats()`
11. `runSchedulingEngine(employeeStats, engine)`
12. `updateSummaryAndMessages(employeeStats, staticMessages, planningDays, engine)`
13. `renderAll()`

So the function has three layers of responsibility:

- pre-check and setup
- engine execution
- post-processing and rendering

---

### 4. Functions called directly by `generateSchedule()`

#### `ensureDemandShape()`

Purpose:

- makes sure `state.demandOverrides` has the expected nested structure for every day and shift

Why it matters:

- the scheduling engine assumes demand data is complete
- without this normalization, later reads could fail or silently use incomplete data

#### `getPlanningDays()`

Purpose:

- returns the actual set of days that should be scheduled in this run

Behavior:

- in day mode, it returns only `state.selectedDay`
- in week mode, it returns all active days from `state.activeDays`

Why it matters:

- this is the scope boundary of the whole run

#### `cloneSchedule(schedule)`

Purpose:

- makes a deep copy of the existing schedule when manual locks should be preserved

Why it matters:

- prevents in-place reuse of mutable state while rebuilding the schedule

#### `initializeSchedule(seedSchedule, preserveManualLocks)`

Purpose:

- creates a fresh schedule grid for every employee and every day

Behavior:

- if a previous cell is locked and `preserveManualLocks` is true, that locked assignment is copied in
- otherwise the cell becomes an empty cell via `createEmptyCell()`

Why it matters:

- the V2 engine does not patch the old schedule incrementally
- it starts from a rebuilt clean grid, optionally carrying forward manual locks

#### `validateStaticConfig()`

Purpose:

- validates whether the current configuration is structurally valid for V2 scheduling

It checks:

- shift duration validity
- core-time validity
- fixed role presence and uniqueness for `Frühschicht`, `Mittelschicht`, `Spätschicht`
- unknown shift names that V2 cannot classify
- duplicate employee names
- empty shift list
- empty employee list

Why it matters:

- V2 depends on a fixed role model, not an arbitrary list of shift names

#### `hasBlockingMessages(messages)`

Purpose:

- decides whether static validation produced errors that must stop scheduling

Why it matters:

- not all messages are equal
- warnings may still allow scheduling, but blocking errors must stop the engine

#### `buildEmptySummary()`

Purpose:

- returns a zeroed summary object

Why it matters:

- when scheduling does not run, the UI still needs a valid summary shape

#### `buildCoverageMap(planningDays)`

Purpose:

- builds required-vs-assigned coverage data for every day and shift

Why it matters:

- the UI summary and diagnostics depend on this shape even when no schedule is generated

#### `createSchedulingEngineContext(planningDays)`

Purpose:

- creates the shared execution context for the V2 engine

It builds:

- `roleMap`
- `orderedDays`
- `roleDiagnostics`
- `dayPriority`

Why it matters:

- this is the business-aware planning frame that tells V2 what each shift means and which days are more urgent

#### `createEmployeeStats()`

Purpose:

- creates per-employee scheduling state objects for the current run

Important fields:

- `assignedHours`
- `hardCap`
- `softTarget`
- `overtimeCapacity`
- `dayPriority`
- `criticalGap`
- `reservedForPreferredShift`

Why it matters:

- the engine does not work directly on raw employees
- it works on enriched runtime planning stats

#### `runSchedulingEngine(employeeStats, engine)`

Purpose:

- executes the actual multi-phase V2 scheduling algorithm

Why it matters:

- this is where assignments are actually produced

#### `updateSummaryAndMessages(employeeStats, staticMessages, planningDays, engine)`

Purpose:

- calculates output-level diagnostics after the schedule is generated

It updates:

- `state.coverage`
- `state.summary`
- `state.statusMessages`

Why it matters:

- scheduling output is not complete until the system translates assignments into business-readable health information

#### `renderAll()`

Purpose:

- re-renders the UI from the updated `state`

Why it matters:

- all scheduling work remains invisible until rendering happens

---

### 5. What `createSchedulingEngineContext()` does

This function prepares the scheduling engine's business context.

#### `getRequiredShiftRoleMap()`

Purpose:

- maps fixed business roles to actual shift objects:
  - `early`
  - `middle`
  - `late`

It depends on:

- `inspectFixedShiftRoles()`
- `getFixedShiftRole(value)`
- `normalizeShiftName(value)`

Why it matters:

- V2 does not treat all shifts equally
- it reasons in role categories, not just raw shift IDs

#### `sortPlanningDaysByPriority(planningDays, roleMap)`

Purpose:

- sorts scheduling days by urgency

It depends on:

- `getDayDemandHours(dayKey, roleMap)`
- `compareDayFallbackPriority(leftDayKey, rightDayKey)`

Why it matters:

- V2 does not simply plan Monday to Saturday in calendar order
- it tries to solve more demanding days first

#### `buildWeeklyRoleDiagnostics(planningDays, roleMap)`

Purpose:

- computes weekly supply-demand diagnostics per role

It outputs values such as:

- `weeklyDemandHours`
- `preferredSupplyHours`
- `flexibleSupplyHours`
- `shortageHours`
- `shortageRatio`

Why it matters:

- later candidate selection logic uses these diagnostics to decide how aggressively a preference should be protected

---

### 6. What `createEmployeeStats()` means

This function transforms raw employees into runtime planning objects.

#### `getLockedAssignedHours(employee.id)`

Purpose:

- calculates how many hours are already consumed by preserved locked cells

Why it matters:

- locked manual assignments must count as already assigned before the engine starts

#### `baseline = Math.max(employee.remainingHours, lockedHours)`

Meaning:

- if locked hours already exceed remaining hours, the engine still raises the baseline to locked hours

Why it matters:

- otherwise the engine would start in an inconsistent state where preserved locks already violate capacity

#### `hardCap`

Meaning:

- absolute scheduling ceiling for the employee in the current run

#### `softTarget`

Meaning:

- preferred planning target before the engine becomes more flexible

Why this split matters:

- V2 distinguishes "ideal target" from "absolute maximum"
- that lets the engine be stricter early and looser only when necessary

---

### 7. What `runSchedulingEngine()` does

This is the core V2 algorithm.

It runs in phases instead of one flat greedy pass.

#### Phase 1: `runCriticalFullPhase(employeeStats, engine, { allowOvertime: false })`

Purpose:

- first fill critical `early` and `late` roles using full shifts, without overtime

Depends on:

- `buildAlternatingCriticalRoleQueue()`
- `createRoleTask()`
- `selectBestCandidate()`
- `assignTask()`

Business meaning:

- critical open/close coverage is treated as the highest priority

#### Phase 2: `repairCriticalCoverage(... allowCoreFallback: false, allowOvertime: false)`

Purpose:

- repair remaining critical gaps without using core fallback and without overtime

Business meaning:

- before relaxing rules, V2 first tries to repair critical shortages within regular structure

#### Phase 3: if critical gaps still exist

`repackTwentyHourCriticalAssignments(...)`

Purpose:

- reorganize assignments to better use exact 20-hour employees in critical roles

`runCriticalCoreFallbackPhase(... allowOvertime: false)`

Purpose:

- allow core-shift fallback for critical roles without overtime

Then:

- `repairCriticalCoverage(... allowCoreFallback: true, allowOvertime: false)`

Business meaning:

- this is a second relaxation step:
  - still no overtime
  - but now core coverage is allowed

#### Phase 4: if critical gaps still exist

`allocateOvertimeCapacity(employeeStats, getRemainingCriticalDemandHours(engine))`

Purpose:

- distribute available overtime capacity based on overtime priority

Then rerun:

- `runCriticalFullPhase(... allowOvertime: true)`
- `repairCriticalCoverage(... allowCoreFallback: false, allowOvertime: true)`
- `repackTwentyHourCriticalAssignments(...)`
- `runCriticalCoreFallbackPhase(... allowOvertime: true)`
- `repairCriticalCoverage(... allowCoreFallback: true, allowOvertime: true)`

Business meaning:

- only after all non-overtime routes fail does V2 unlock overtime for critical demand

#### Phase 5: if no critical gaps remain

`calculateMiddlePhaseSurplus(employeeStats, engine)`

Purpose:

- calculates whether the team has more soft-target capacity than needed for remaining middle demand

`applySoftTargetReduction(employeeStats, surplusHours)`

Purpose:

- lowers soft targets before middle-shift allocation when there is surplus

Business meaning:

- avoids spreading too many hours just because middle demand exists

#### Phase 6: `runMiddlePhase(employeeStats, engine)`

Purpose:

- fill middle shifts after critical roles are stable

Business meaning:

- middle shift is deliberately scheduled later than early/late

#### Phase 7: `runGlobalRepairPhase(employeeStats, engine)`

Purpose:

- do final global repairs and exact-fit core closeout

Depends on:

- `runExactFitCoreCloseoutPhase()`
- `repairCriticalCoverage(... allowCoreFallback: true, allowOvertime: true)`

#### Phase 8: `normalizeAllDays(employeeStats, engine)`

Purpose:

- final cleanup and normalization across days

Business meaning:

- make sure the final result is internally consistent after all repair and reassignment passes

---

### 8. Key functions used inside engine phases

#### `createRoleTask(dayKey, role, variant, stage, engine)`

Purpose:

- creates a normalized task object representing one assignment need

Fields include:

- `dayKey`
- `role`
- `shiftId`
- `stage`
- `variant`
- `assignmentId`
- `hours`

Why it matters:

- candidate scoring depends on stage, role, and variant

#### `selectBestCandidate(employeeStats, task, engine, options = {})`

Purpose:

- finds the best employee for one task

Its filtering/scoring logic includes:

- `canTakeTask()`
- middle-shift reservation protection via `isReservedForMiddleShift()`
- regular-hours preference when overtime is allowed
- stage-aware scoring via `getTaskScore()`
- random tie-breaking through `randomChoice()`

Why it matters:

- this is the main candidate selection gate of V2

#### `canTakeTask(entry, task, engine, options = {})`

Purpose:

- validates whether an employee can legally and practically take a task

Typical constraints include:

- employee availability
- no existing assignment on the same day
- regular capacity or overtime capacity limits

#### `getTaskScore(entry, task, engine)`

Purpose:

- computes the final ranking score for a candidate

It delegates to stage-specific scoring such as:

- `scoreCriticalFullTask()`
- `scoreMiddleTask()`
- `scoreCoreFallbackTask()`

Why it matters:

- V2 does not use one universal score for all scheduling situations

#### `assignTask(employeeStats, employeeId, dayKey, assignmentId, source)`

Purpose:

- writes the assignment into `state.schedule`
- updates the employee's assigned hours

Why it matters:

- this is the mutation point where a planning decision becomes real schedule state

---

### 9. What `updateSummaryAndMessages()` does after scheduling

After the engine finishes, this function converts raw schedule output into user-facing diagnostics.

#### `buildCoverageMap(planningDays)`

Purpose:

- calculates required and assigned counts per day and shift

#### `summarizeCoverage(coverage, planningDays)`

Purpose:

- computes the top-level coverage rate

#### `getTotalCriticalGapCount(engine)`

Purpose:

- tells the message layer whether middle-shift shortages should be muted while critical shortages still exist

Important behavior:

- if a middle shift is still short, but critical gaps remain, the function can suppress that middle warning

Business meaning:

- V2 deliberately treats critical shortage messages as more important than middle shortage messages

#### output fields written

- `state.coverage`
- `state.summary.assignedHours`
- `state.summary.targetHours`
- `state.summary.coverageRate`
- `state.summary.lockedAssignments`
- `state.statusMessages`

---

### 10. Recommended mental model

The best way to understand `generateSchedule()` is:

`generateSchedule()` is not the scheduler itself.

It is the orchestration function around the scheduler.

It does four jobs:

1. prepare state
2. validate whether scheduling may run
3. invoke the V2 multi-phase engine
4. translate the result into UI-facing summary and messages

If you want to debug "why a certain employee got a shift", look inside:

- `runSchedulingEngine()`
- `selectBestCandidate()`
- `getTaskScore()`

If you want to debug "why scheduling did not start", look inside:

- `getPlanningDays()`
- `validateStaticConfig()`
- `hasBlockingMessages()`

If you want to debug "why the UI shows shortage/warning/coverage values", look inside:

- `buildCoverageMap()`
- `summarizeCoverage()`
- `updateSummaryAndMessages()`

---

## 中文

### 1. 业务作用

`generateSchedule()` 是 [`app.js`](C:\Users\filic\Documents\New project 5\app.js) 里自动排班的主入口。

它不只是“把班填进去”，而是负责驱动整套 V2 排班流程：

- 规范化当前需求数据
- 重建本轮排班表格
- 校验当前配置是否允许启动排班
- 构建 V2 引擎上下文
- 为每个员工建立本轮排班统计对象
- 运行多阶段排班引擎
- 重新计算汇总、覆盖率、状态消息
- 触发 UI 重绘

用最直白的话说：

`generateSchedule()` 就是把当前 `state` 里的输入，转换成一份新的排班结果。

---

### 2. 输入从哪里来

`generateSchedule()` 并不直接通过参数接收业务数据。

它主要从全局 `state` 读取：

- `state.mode`
- `state.selectedDay`
- `state.activeDays`
- `state.shifts`
- `state.employees`
- `state.demandOverrides`
- `state.schedule`

它唯一直接接收的控制参数是：

- `preserveManualLocks`

这个参数表示：本轮重排时，是否保留旧排班里已经被手动锁定的单元格。

---

### 3. `generateSchedule()` 自身的执行步骤

当前函数位置：

- [`app.js`](C:\Users\filic\Documents\New project 5\app.js): `generateSchedule()`

它内部的顺序是：

1. `ensureDemandShape()`
2. 递增 `state.generationRevision`
3. `getPlanningDays()`
4. 根据 `preserveManualLocks` 决定是复制旧排班还是清空旧排班
5. `initializeSchedule(seedSchedule, preserveManualLocks)`
6. `validateStaticConfig()`
7. 如果没有任何待排班日期：
   - 构建 warning
   - `buildEmptySummary()`
   - `buildCoverageMap([])`
   - `renderAll()`
   - 结束
8. 如果静态校验里存在阻断错误：
   - 保留这些错误消息
   - `buildEmptySummary()`
   - `buildCoverageMap([])`
   - `renderAll()`
   - 结束
9. `createSchedulingEngineContext(planningDays)`
10. `createEmployeeStats()`
11. `runSchedulingEngine(employeeStats, engine)`
12. `updateSummaryAndMessages(employeeStats, staticMessages, planningDays, engine)`
13. `renderAll()`

所以它本质上分三层职责：

- 启动前准备
- 调用引擎执行
- 执行后汇总和渲染

---

### 4. `generateSchedule()` 直接调用的函数分别做什么

#### `ensureDemandShape()`

作用：

- 确保 `state.demandOverrides` 对每一天、每个班次都具备完整结构

为什么重要：

- 后续引擎默认需求数据是完整的
- 如果这里不先补齐，后面读取需求时可能出错，或者悄悄使用不完整数据

#### `getPlanningDays()`

作用：

- 计算本轮真正需要排班的日期列表

行为：

- 如果是 day 模式，只返回 `state.selectedDay`
- 如果是 week 模式，返回 `state.activeDays` 中启用的所有天

为什么重要：

- 这一步决定了本轮排班的作用范围

#### `cloneSchedule(schedule)`

作用：

- 当需要保留手动锁定时，深拷贝旧排班

为什么重要：

- 避免在构建新排班时直接复用旧的可变对象

#### `initializeSchedule(seedSchedule, preserveManualLocks)`

作用：

- 为每个员工、每一天重建一张新的排班网格

行为：

- 如果旧单元格是锁定状态，并且 `preserveManualLocks = true`，就把该锁定排班复制进来
- 否则就创建一个空单元格 `createEmptyCell()`

为什么重要：

- V2 不是在旧排班上增量打补丁
- 它是“先重建一个干净网格，再决定哪些锁定内容保留”

#### `validateStaticConfig()`

作用：

- 校验当前配置是否满足 V2 启动条件

它会检查：

- 班次时长是否合法
- 核心时段是否合法
- `Frühschicht / Mittelschicht / Spätschicht` 是否存在且唯一
- 是否存在 V2 无法识别的班次名称
- 员工重名
- 班次数量是否为空
- 员工数量是否为空

为什么重要：

- V2 依赖固定角色模型
- 它不是对任意班次名都能工作

#### `hasBlockingMessages(messages)`

作用：

- 判断静态校验结果里是否存在必须阻止排班启动的错误

为什么重要：

- 不是所有消息都一样
- warning 可以继续，blocking error 必须中止

#### `buildEmptySummary()`

作用：

- 返回一份全 0 的汇总对象

为什么重要：

- 即使排班没有真正运行，UI 也仍然需要一个结构完整的 summary

#### `buildCoverageMap(planningDays)`

作用：

- 构建每天、每个班次的需求数和已分配数

为什么重要：

- 无论排班是否真正生成，覆盖率和汇总区域都依赖这个结构

#### `createSchedulingEngineContext(planningDays)`

作用：

- 构建 V2 引擎共享的执行上下文

它会生成：

- `roleMap`
- `orderedDays`
- `roleDiagnostics`
- `dayPriority`

为什么重要：

- 这是 V2 的业务框架
- 它决定每个班次的业务角色，以及哪些日期更优先处理

#### `createEmployeeStats()`

作用：

- 把原始员工数据转换成“本轮排班专用”的运行时对象

重要字段：

- `assignedHours`
- `hardCap`
- `softTarget`
- `overtimeCapacity`
- `dayPriority`
- `criticalGap`
- `reservedForPreferredShift`

为什么重要：

- V2 并不是直接操作原始员工对象
- 它操作的是带有排班状态和约束信息的运行时统计对象

#### `runSchedulingEngine(employeeStats, engine)`

作用：

- 运行真正的 V2 多阶段排班算法

为什么重要：

- 真正做“排班分配”的地方就在这里

#### `updateSummaryAndMessages(employeeStats, staticMessages, planningDays, engine)`

作用：

- 在排班结束后，把结果转换成业务可读的汇总与提示信息

它会更新：

- `state.coverage`
- `state.summary`
- `state.statusMessages`

为什么重要：

- 有了排班结果还不够
- 系统还需要把它翻译成“覆盖率、超时、缺口、警告”这类用户能看懂的信息

#### `renderAll()`

作用：

- 根据最新的 `state` 重绘 UI

为什么重要：

- 如果不重绘，前面所有排班结果用户都看不到

---

### 5. `createSchedulingEngineContext()` 做了什么

这个函数负责搭建 V2 引擎的业务上下文。

#### `getRequiredShiftRoleMap()`

作用：

- 把固定业务角色映射到真实班次对象：
  - `early`
  - `middle`
  - `late`

它依赖：

- `inspectFixedShiftRoles()`
- `getFixedShiftRole(value)`
- `normalizeShiftName(value)`

为什么重要：

- V2 不是把所有 shift 一视同仁
- 它是按“早班 / 中班 / 晚班”这种业务角色来推理

#### `sortPlanningDaysByPriority(planningDays, roleMap)`

作用：

- 给本轮待排日期排序，优先处理更紧张的日期

它依赖：

- `getDayDemandHours(dayKey, roleMap)`
- `compareDayFallbackPriority(leftDayKey, rightDayKey)`

为什么重要：

- V2 不是简单按周一到周六顺序排
- 它会先解决更缺人的日期

#### `buildWeeklyRoleDiagnostics(planningDays, roleMap)`

作用：

- 统计每个角色一整周的供需情况

输出包括：

- `weeklyDemandHours`
- `preferredSupplyHours`
- `flexibleSupplyHours`
- `shortageHours`
- `shortageRatio`

为什么重要：

- 后面的候选人筛选会用这些诊断结果，判断员工偏好应该被保护到什么程度

---

### 6. `createEmployeeStats()` 的核心含义

这个函数把原始员工对象转换成排班运行时对象。

#### `getLockedAssignedHours(employee.id)`

作用：

- 计算因为保留锁定单元格而已经占用掉的工时

为什么重要：

- 手动锁定的排班必须在引擎启动前就算成“已排工时”

#### `baseline = Math.max(employee.remainingHours, lockedHours)`

含义：

- 如果锁定工时已经高于员工剩余工时，系统仍然把 baseline 提升到锁定工时

为什么重要：

- 否则引擎会从一个“锁定内容本身就超上限”的矛盾状态开始工作

#### `hardCap`

含义：

- 当前排班轮次里员工可被安排的绝对上限

#### `softTarget`

含义：

- 当前轮次里理想上的目标工时

为什么要区分这两个值：

- V2 区分“理想目标”和“绝对上限”
- 这让引擎可以前期更保守，后期在必要时再放宽

---

### 7. `runSchedulingEngine()` 做了什么

这就是 V2 的核心算法。

它不是“一次性贪心分完”，而是按阶段执行。

#### 第一阶段：`runCriticalFullPhase(employeeStats, engine, { allowOvertime: false })`

作用：

- 优先用完整班次、且不允许加班，先填关键角色 `early` 和 `late`

依赖：

- `buildAlternatingCriticalRoleQueue()`
- `createRoleTask()`
- `selectBestCandidate()`
- `assignTask()`

业务含义：

- 开门班和关门班是最高优先级

#### 第二阶段：`repairCriticalCoverage(... allowCoreFallback: false, allowOvertime: false)`

作用：

- 在不允许核心时段兜底、不允许加班的前提下，修补剩余关键缺口

业务含义：

- 在放宽规则前，先尽量用正常结构修补关键缺口

#### 第三阶段：如果关键缺口还存在

`repackTwentyHourCriticalAssignments(...)`

作用：

- 重新整理关键班次分配，更好利用精确 20 小时员工

`runCriticalCoreFallbackPhase(... allowOvertime: false)`

作用：

- 对关键角色允许使用核心时段兜底，但仍不允许加班

然后执行：

- `repairCriticalCoverage(... allowCoreFallback: true, allowOvertime: false)`

业务含义：

- 这是第二层放宽：
  - 还不允许加班
  - 但开始允许核心时段兜底

#### 第四阶段：如果关键缺口还存在

`allocateOvertimeCapacity(employeeStats, getRemainingCriticalDemandHours(engine))`

作用：

- 按加班优先级分配加班容量

然后重新执行：

- `runCriticalFullPhase(... allowOvertime: true)`
- `repairCriticalCoverage(... allowCoreFallback: false, allowOvertime: true)`
- `repackTwentyHourCriticalAssignments(...)`
- `runCriticalCoreFallbackPhase(... allowOvertime: true)`
- `repairCriticalCoverage(... allowCoreFallback: true, allowOvertime: true)`

业务含义：

- 只有当前面所有非加班方案都失败后，V2 才会动用加班解决关键缺口

#### 第五阶段：如果已经没有关键缺口

`calculateMiddlePhaseSurplus(employeeStats, engine)`

作用：

- 计算团队剩余的 soft target 能力是否高于中班剩余需求

`applySoftTargetReduction(employeeStats, surplusHours)`

作用：

- 如果有富余，在进入中班分配前先下调 soft target

业务含义：

- 避免因为中班存在需求，就把过多工时无意义地摊出去

#### 第六阶段：`runMiddlePhase(employeeStats, engine)`

作用：

- 在关键班次稳定之后，再处理 `middle` 班

业务含义：

- 中班是后置处理的，不和 early/late 同级抢资源

#### 第七阶段：`runGlobalRepairPhase(employeeStats, engine)`

作用：

- 做最后的全局修补和精确匹配核心时段收尾

依赖：

- `runExactFitCoreCloseoutPhase()`
- `repairCriticalCoverage(... allowCoreFallback: true, allowOvertime: true)`

#### 第八阶段：`normalizeAllDays(employeeStats, engine)`

作用：

- 做跨天最终归一化和清理

业务含义：

- 确保经过多轮修补、换班、跨天移动后，最终结果仍然一致

---

### 8. 引擎阶段里一些关键函数

#### `createRoleTask(dayKey, role, variant, stage, engine)`

作用：

- 把一个待补位需求标准化成任务对象

字段包括：

- `dayKey`
- `role`
- `shiftId`
- `stage`
- `variant`
- `assignmentId`
- `hours`

为什么重要：

- 候选人评分依赖于阶段、角色和班次变体

#### `selectBestCandidate(employeeStats, task, engine, options = {})`

作用：

- 为一个任务挑选当前最合适的员工

它内部会做：

- `canTakeTask()` 过滤
- 通过 `isReservedForMiddleShift()` 保护中班偏好预留
- 在允许加班时优先挑选仍能落在常规工时内的人
- 通过 `getTaskScore()` 进行阶段化评分
- 通过 `randomChoice()` 做同分打散

为什么重要：

- 这是 V2 的核心候选人选择关口

#### `canTakeTask(entry, task, engine, options = {})`

作用：

- 判断某个员工在当前规则下是否能接这个任务

典型约束包括：

- 当天是否可上班
- 当天是否已经有排班
- 是否超常规工时或超加班容量

#### `getTaskScore(entry, task, engine)`

作用：

- 计算候选人的最终评分

它会分派到不同阶段的评分函数，例如：

- `scoreCriticalFullTask()`
- `scoreMiddleTask()`
- `scoreCoreFallbackTask()`

为什么重要：

- V2 不是所有场景都用同一套评分

#### `assignTask(employeeStats, employeeId, dayKey, assignmentId, source)`

作用：

- 把排班结果写进 `state.schedule`
- 同时更新该员工的已分配工时

为什么重要：

- 这是“排班决策真正落地”的写入点

---

### 9. `updateSummaryAndMessages()` 在排班后做什么

引擎执行完成后，这个函数负责把原始排班结果翻译成用户可读的诊断信息。

#### `buildCoverageMap(planningDays)`

作用：

- 统计每天每班的需求数和已分配数

#### `summarizeCoverage(coverage, planningDays)`

作用：

- 计算整体覆盖率

#### `getTotalCriticalGapCount(engine)`

作用：

- 告诉消息层：当关键缺口还存在时，是否要降低中班缺口提示的优先级

一个重要行为：

- 如果中班缺人，但关键班次缺口还没解决，系统可以先压低中班缺口提示

业务含义：

- V2 明确认为关键班次缺口比中班缺口更重要

#### 它最终写入的输出

- `state.coverage`
- `state.summary.assignedHours`
- `state.summary.targetHours`
- `state.summary.coverageRate`
- `state.summary.lockedAssignments`
- `state.statusMessages`

---

### 10. 推荐理解方式

理解 `generateSchedule()` 最好的心智模型是：

`generateSchedule()` 不是“排班算法本身”。

它是“围绕排班算法的总控函数”。

它负责四件事：

1. 准备状态
2. 决定当前是否允许启动排班
3. 调用 V2 多阶段引擎
4. 把结果翻译成 UI 可用的汇总和提示

如果你要排查“为什么某个员工被分到了这个班”，重点看：

- `runSchedulingEngine()`
- `selectBestCandidate()`
- `getTaskScore()`

如果你要排查“为什么排班根本没启动”，重点看：

- `getPlanningDays()`
- `validateStaticConfig()`
- `hasBlockingMessages()`

如果你要排查“为什么 UI 上显示这个缺口 / 这个 warning / 这个 coverage”，重点看：

- `buildCoverageMap()`
- `summarizeCoverage()`
- `updateSummaryAndMessages()`
