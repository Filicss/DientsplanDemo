# Scheduling Improvement Plan

Status: partially implemented in the current working tree.

This document describes the scheduling changes for the next iteration of the V2 heuristic engine in [app.js](C:\Users\filic\Documents\New project 5\app.js).

Current implementation status:

- weekly role-level supply-demand diagnosis: implemented
- planning-pressure-based candidate weighting: implemented
- shortage-aware softer `Mittelschicht` reservation: implemented
- broader `Kernzeit` closeout for non-`20h` employees: implemented
- final global repair phase: implemented in an initial heuristic form
- mathematical optimization / globally optimal balancing: not implemented

## 1. Business problems to solve

- High-hour employees can remain significantly underplanned while critical shifts are still understaffed.
- Shift preference is sometimes protected too early, especially for `Mittelschicht`, even when `Fruehschicht` or `Spaetschicht` has a structural weekly shortage.
- `Kernzeit` is currently too narrow in scope and cannot be used as a general exact-fit tool for employees with small remaining hour budgets.
- Weekly totals and daily feasibility are not combined strongly enough, so the planner can preserve the wrong people for the wrong role.

## 2. Target behavior

The next iteration should follow this business logic:

1. Protect business-critical coverage before protecting preference purity.
2. Detect weekly structural shortage before day-level assignment starts.
3. Give more planning priority to employees who still have many remaining hours and fewer safe assignment opportunities.
4. Treat `Kernzeit` as a late-stage exact-fit instrument, not only as a special rule for `20h` contracts.
5. Add a final global repair step that explicitly tries to reduce both coverage gaps and underplanned employees.

## 3. Weekly supply-demand diagnosis

Before actual assignment starts, the engine should calculate a weekly diagnosis for each fixed role:

- `early`
- `middle`
- `late`

### 3.1 Required metrics per role

For each role, calculate:

- `weeklyDemandHours`
  Sum of all active-day demand for that role multiplied by full-shift net hours.
- `preferredSupplyHours`
  Sum of `remainingHours` from employees whose preferred shift matches that role.
- `flexibleSupplyHours`
  Sum of `remainingHours` from employees with no preference or with a different preference but who are allowed to substitute.
- `shortageHours`
  `max(0, weeklyDemandHours - preferredSupplyHours)`
- `shortageRatio`
  `shortageHours / weeklyDemandHours`

### 3.2 Example from current sample data

For `Spaetschicht` in the sample week:

- demand count: `3 + 3 + 3 + 3 + 4 + 4 = 20`
- full-shift demand hours: `20 * 8 = 160h`
- preferred employees: `H + I + J`
- preferred supply hours: `20 + 30 + 30 = 80h`
- weekly shortage: `160h - 80h = 80h`
- shortage ratio: `80 / 160 = 0.5`

Conclusion:

- `Spaetschicht` is structurally under-supplied by its own preference group.
- The engine should proactively open substitute candidates from no-preference and non-late-preference employees.
- `Mittelschicht` preference should not be protected too aggressively if `Spaetschicht` still has a major weekly shortage.

### 3.3 Important limitation of weekly totals

Weekly totals alone are not sufficient.

The engine must also check day-level feasibility:

- on which active days the employee is still available
- whether the employee is already needed elsewhere on the same day
- whether the employee has enough remaining budget for full or core assignment

So the weekly diagnosis is a steering layer, not the final assignment decision.

## 4. Dynamic preference handling

Preference should remain important, but no longer behave like a hard protected rule when weekly shortage is obvious.

### 4.1 Preferred principle

- If a role has low or no shortage, keep preference weight high.
- If a role has visible weekly shortage, reduce the penalty for substitute assignments into that role.
- If a role has weekly surplus or safe preferred coverage, reduce the protection for employees who are currently reserved for that role.

### 4.2 Practical consequence

This specifically affects cases like employee `F`:

- `F` prefers `Mittelschicht`
- `F` still has a large remaining hour budget
- `Spaetschicht` has a structural weekly shortage

In that case, `F` should be considered a valid substitute candidate for `Spaetschicht` much earlier than in the current V2 behavior.

## 5. Employee planning pressure

The planner should not mainly ask, "Who prefers this shift?"

It should also ask, "Who is at risk of not getting enough hours if we do not place them now?"

### 5.1 New pressure signal

Each employee should receive a dynamic `planningPressure` value, for example:

`planningPressure = remainingHours / max(1, remainingAvailableDays)`

Where:

- `remainingHours` is the current unassigned weekly budget
- `remainingAvailableDays` is the number of active planning days on which the employee can still receive an assignment

This can later be refined, but it is already much closer to real scheduling logic than contract hours alone.

### 5.2 Business effect

This prevents situations like:

- low-hour employees get planned too early
- high-hour employees remain underplanned
- the week ends with obvious unused labor capacity

## 6. Revised planning phases

The next version should use the following phase order.

### Phase 1: Weekly diagnosis

- build role-level weekly demand and supply summary
- derive shortage ratios
- derive substitution pressure for each critical role

### Phase 2: Critical full-shift assignment

- assign `Fruehschicht` and `Spaetschicht` full shifts first
- use dynamic scoring based on:
  - role shortage urgency
  - employee planning pressure
  - preference fit
  - planning priority
  - spacing and worked-day balance
  - overtime penalty

### Phase 3: Critical repair

- attempt same-day swaps
- attempt cross-day moves
- attempt additional substitute candidates if shortage remains

### Phase 4: Controlled middle assignment

- do not block `Mittelschicht` for the whole week just because another day still has a critical gap
- instead, allow middle assignment day by day after the given day's critical options are exhausted or stabilized
- middle reservation must become soft, not hard

### Phase 5: Exact-fit core assignment

- first try full-shift placement
- then use `Kernzeit` as a targeted exact-fit option
- allow non-`20h` employees to use `Kernzeit` if:
  - they cannot reasonably take a full shift
  - the core shift matches their remaining budget well
  - using core improves coverage or reduces underplanning

### Phase 6: Global repair pass

- after the first full-week plan exists, run a dedicated repair phase
- objective:
  - reduce uncovered `Frueh` and `Spaet`
  - reduce large underplanning gaps
  - improve exact-fit usage
- allowed actions:
  - cross-day reassignment
  - same-day swap
  - `full -> core` conversion
  - releasing overly protected preference reservations

## 7. New role of `Kernzeit`

`Kernzeit` should move from a contract-specific fallback to a generic precision tool.

### 7.1 Current problem

At the moment, `Kernzeit` is strongly tied to exact `20h` employees.

This is too restrictive for real scheduling because:

- employees can end the week with `6h` remaining
- a `Spaetschicht` core assignment can be a very good fit
- otherwise the engine wastes usable capacity

### 7.2 Planned rule

Use `Kernzeit` mainly in these cases:

- exact-fit closeout for small remaining budgets
- critical coverage that cannot be filled by full-shift assignment
- repair after cross-day balancing

This should stay later in the process to avoid over-fragmenting the plan too early.

## 8. Candidate scoring direction

The next scoring model should shift from:

- strong preference first
- hours as a weak tie-breaker

To:

- critical shortage first
- employee planning pressure second
- preference fit third
- planning priority fourth

This does not remove preference.
It makes preference conditional on business feasibility.

## 9. Expected impact on current observed cases

### Case A: `F` still has `16h` open while critical shifts remain uncovered

Expected improvement:

- `F` is no longer protected too strongly for `Mittelschicht`
- the engine sees the weekly `Spaetschicht` shortage early
- `F` becomes a reasonable substitute candidate for late shifts
- underplanning for `F` should drop materially

### Case B: `I` and `J` have around `6h` left

Expected improvement:

- `I` and `J` can be considered for `Spaetschicht (Kernzeit)`
- the planner can use the remaining `6h` more precisely
- fewer small unused hour fragments remain at week end

## 10. Implementation order

Recommended implementation sequence:

1. Add weekly role diagnosis and shortage ratio calculation.
2. Introduce employee `planningPressure`.
3. Replace hard `Mittelschicht` reservation with shortage-aware soft reservation.
4. Change `Kernzeit` from `20h`-only fallback to general exact-fit logic.
5. Add final global repair pass.

This order keeps the risk controlled and allows each step to be verified separately.

## 11. Scope notes

This planned change does not yet include:

- labor law optimization
- vacation and absence calendars
- mathematically optimal solver integration
- long-term fairness across multiple weeks

The goal is to make the current heuristic much more aligned with real branch scheduling logic before moving to a heavier optimization model.

---

# 排班改进方案

状态：当前工作区中已部分实现。

本文档描述的是这轮 V2 排班引擎改造方案，用于解决当前 [app.js](C:\Users\filic\Documents\New project 5\app.js) 中几个明显弱点。

当前实现状态：

- 整周角色供需诊断：已实现
- 基于 `planningPressure` 的候选人权重：已实现
- 缺口感知的 `Mittelschicht` 软保留：已实现
- 面向非 `20h` 员工的 `Kernzeit` 收尾：已实现
- 最终全局修复阶段：已实现初版启发式逻辑
- 数学优化器 / 全局最优平衡：尚未实现

## 1. 本轮要解决的业务问题

- 高工时员工可能明显没有排满，但关键班次仍然缺人。
- 班次偏好有时被保护得太早，尤其是 `Mittelschicht`，即使 `Fruehschicht` 或 `Spaetschicht` 在整周层面已经明显缺人。
- `Kernzeit` 目前用途太窄，不能作为“小剩余工时员工”的通用精确补位工具。
- 整周总量和单天可行性结合得还不够强，导致系统可能把错误的人保留给错误的班次。

## 2. 目标行为

下一轮逻辑应遵循以下业务原则：

1. 先保护业务关键覆盖率，再保护偏好纯度。
2. 在逐天分配之前，先识别整周层面的结构性缺口。
3. 对“剩余工时多、但后续安全可排机会少”的员工，提高排班优先级。
4. 把 `Kernzeit` 当作后置的精确补差工具，而不是只服务于 `20h` 合同员工的特殊规则。
5. 在初排完成后增加一个全局修复阶段，明确去减少“缺口”和“员工未排满工时”。

## 3. 整周供需诊断

在真正开始分配前，系统应先对每个固定角色做一轮整周诊断：

- `early`
- `middle`
- `late`

### 3.1 每个角色要计算的指标

对每个角色，先计算：

- `weeklyDemandHours`
  所有启用日期上，该角色需求人数乘以完整班次净工时后的总和。
- `preferredSupplyHours`
  偏好正好匹配该角色的员工，其 `remainingHours` 之和。
- `flexibleSupplyHours`
  无偏好员工，或偏好其他班次但允许替补的员工，其 `remainingHours` 之和。
- `shortageHours`
  `max(0, weeklyDemandHours - preferredSupplyHours)`
- `shortageRatio`
  `shortageHours / weeklyDemandHours`

### 3.2 当前示例数据里的 `Spaetschicht`

示例周中的 `Spaetschicht`：

- 需求班次数：`3 + 3 + 3 + 3 + 4 + 4 = 20`
- 完整班次需求工时：`20 * 8 = 160h`
- 偏好员工：`H + I + J`
- 偏好供给工时：`20 + 30 + 30 = 80h`
- 整周缺口：`160h - 80h = 80h`
- 缺口比例：`80 / 160 = 0.5`

这说明：

- `Spaetschicht` 仅靠自己偏好组，整周供给明显不够。
- 系统应该尽早开放无偏好员工和非夜班偏好员工作为替补候选人。
- 如果 `Spaetschicht` 仍然存在明显结构性缺口，那么 `Mittelschicht` 偏好就不应该被过早强保护。

### 3.3 仅看整周总量还不够

整周总量只能说明趋势，不能直接决定最终排班。

系统还必须继续检查单天可行性：

- 员工在哪些启用日仍然可用
- 员工当天是否已经被其他班次占用
- 员工剩余工时是否足够支撑 full 或 core

因此，整周诊断是“引导层”，不是最终分配结果本身。

## 4. 动态偏好处理

偏好仍然重要，但在整周缺口已经很明显的时候，偏好不应继续表现为“接近硬保护”的规则。

### 4.1 期望原则

- 如果某个角色几乎不缺人，偏好权重应保持较高。
- 如果某个角色整周明显缺人，那么进入该角色的替补惩罚应降低。
- 如果某个角色本周供给安全甚至富余，那么为这个角色保留员工的保护力度应降低。

### 4.2 对当前问题的实际意义

这会直接影响像 `F` 这样的情况：

- `F` 偏好 `Mittelschicht`
- `F` 仍然有较大的剩余工时预算
- `Spaetschicht` 存在整周结构性缺口

在这种情况下，`F` 应该更早被视为 `Spaetschicht` 的有效替补候选人，而不是像当前 V2 一样被过早保留给 `Mittelschicht`。

## 5. 员工排班压力

下一轮排班不应该主要只问一句：“谁偏好这个班？”

还要问一句：“如果现在不安排这个人，他后面是不是更容易排不满？”

### 5.1 新的压力指标

为每位员工计算动态 `planningPressure`，例如：

`planningPressure = remainingHours / max(1, remainingAvailableDays)`

其中：

- `remainingHours` 表示当前还没排掉的本周工时预算
- `remainingAvailableDays` 表示在当前启用日中，该员工还可以被安排的天数

这个定义后续还可以继续细化，但已经比单纯看合同工时更接近真实排班逻辑。

### 5.2 业务效果

它主要是为了避免这种情况：

- 低工时员工过早被排掉
- 高工时员工反而留到后面排不满
- 最终一周结束时出现明显没用掉的劳动力容量

## 6. 新的分阶段流程

下一版建议采用以下阶段顺序。

### 阶段 1：整周诊断

- 先建立每个角色的整周需求和供给汇总
- 计算缺口比例
- 生成关键角色的替补压力信息

### 阶段 2：关键班次 full 分配

- 优先分配 `Fruehschicht` 和 `Spaetschicht` 的完整班次
- 动态打分应至少综合：
  - 角色缺口紧迫度
  - 员工排班压力
  - 偏好匹配程度
  - 排班优先级
  - 间隔与已工作天数平衡
  - 加班惩罚

### 阶段 3：关键班次修复

- 尝试日内交换
- 尝试跨天挪动
- 如果缺口还在，再放宽更多替补候选人

### 阶段 4：受控的 `Mittelschicht` 分配

- 不再因为“整周别的某一天还存在关键缺口”，就把 `Mittelschicht` 整周一起阻塞
- 改成按天放行：某一天的关键班次如果已经没有更好的修复空间，就允许这一天进入 `Mittelschicht`
- `Mittelschicht` 的保留必须变成软保留，而不是硬保留

### 阶段 5：精确补差的 `Kernzeit`

- 先尝试 full shift
- full 不适合时，再使用 `Kernzeit` 做定向补差
- 非 `20h` 员工也可以使用 `Kernzeit`，前提是：
  - 继续安排 full 已经不合理
  - core 与其剩余工时高度匹配
  - 使用 core 能改善覆盖率或减少未排满工时

### 阶段 6：全局修复

- 当整周初排结果已经出来后，再跑一个专门的全局修复阶段
- 目标：
  - 继续减少 `Frueh` 和 `Spaet` 的缺口
  - 继续减少明显未排满的员工
  - 提高 `Kernzeit` 的精确利用率
- 允许的动作：
  - 跨天重分配
  - 日内交换
  - `full -> core` 转换
  - 释放被过度保护的偏好保留

## 7. `Kernzeit` 的新角色

`Kernzeit` 应该从“合同类型专用兜底”升级为“通用精确补位工具”。

### 7.1 当前问题

目前 `Kernzeit` 基本被绑定在精确 `20h` 员工身上。

这个限制在真实排班里过于保守，因为：

- 员工一周末尾可能只剩 `6h`
- 这时 `Spaetschicht` 的 core 班往往刚好匹配
- 如果不用，系统就会浪费一部分本可利用的工时

### 7.2 计划规则

`Kernzeit` 主要用在以下三类场景：

- 小剩余工时的精确收尾
- full 无法覆盖时的关键班次兜底
- 跨天平衡后的修复补位

同时，它仍然应放在流程后段，避免过早把整周计划切得过碎。

## 8. 候选人打分方向

下一版的打分方向应从：

- 强偏好优先
- 工时只是弱辅助

调整为：

- 关键缺口优先
- 员工排班压力第二
- 偏好匹配第三
- 排班优先级第四

这并不是取消偏好。
而是让偏好服从业务可行性。

## 9. 对当前观察问题的预期改善

### 情况 A：`F` 还差 `16h`，但关键班次仍未补齐

预期改善：

- `F` 不会再被过强地保留给 `Mittelschicht`
- 系统会更早看到 `Spaetschicht` 的整周缺口
- `F` 会更早进入晚班替补候选池
- `F` 未排满的问题应明显下降

### 情况 B：`I` 和 `J` 还剩大约 `6h`

预期改善：

- `I` 和 `J` 可以被纳入 `Spaetschicht (Kernzeit)` 候选
- 系统可以更精细地吃掉这 `6h`
- 一周结束后，尾部碎片工时会更少

## 10. 实现顺序

建议的实现顺序：

1. 先加入整周角色诊断和缺口比例计算。
2. 再加入员工 `planningPressure`。
3. 把 `Mittelschicht` 的硬保留改成缺口感知的软保留。
4. 把 `Kernzeit` 从 `20h` 专用兜底改成通用精确补差逻辑。
5. 最后加入全局修复阶段。

这样做的好处是风险更可控，也更容易逐步验证每一步带来的改善。

## 11. 范围说明

这次计划中的改动暂时不包含：

- 劳动法级别的优化
- 请假、缺勤、休假日历
- 数学最优解求解器
- 跨多周的长期公平性

本轮目标是先把当前启发式算法明显拉近真实门店排班逻辑，再考虑更重的优化器方案。
