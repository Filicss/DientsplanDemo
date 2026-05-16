# Code Structure and Scheduling Logic

Current note:
For the logic that matches the current working implementation, see [current-scheduling-logic.md](C:\Users\filic\Documents\New project 5\docs\current-scheduling-logic.md).

## Deutsch

### 1. Was sich inzwischen grundlegend geaendert hat
Die erste Version war ein einfacher heuristischer Greedy-Planer:
- Aufgaben wurden grob in Wochenreihenfolge behandelt
- Schichten wurden nicht stark genug nach Geschaeftskritikalitaet unterschieden
- `Kernzeit` wurde zu frueh aktiviert
- manuelle Nachplanung war funktional, aber noch zu nah an der alten Verteilungslogik

Die aktuelle Version in [app.js](C:\Users\filic\Documents\New project 5\app.js) ist eine V2-Engine mit klarerem fachlichem Modell:
- Planungstage werden nach Bedarf priorisiert
- `Frühschicht` und `Spätschicht` sind kritische Schichten
- `Mittelschicht` wird nachrangig behandelt
- `Kernzeit` ist nur ein Fallback fuer exakt `20h` Mitarbeitende
- manuelle Aenderungen werden ueber dieselbe Engine neu ausbalanciert

### 2. Weiterhin gueltige Grundarchitektur
Die Gesamtarchitektur ist unveraendert:
- `state` bleibt die zentrale Quelle der Wahrheit
- `refs` haelt DOM-Referenzen
- `render...` Funktionen zeichnen das UI
- `on...` Funktionen verarbeiten Benutzereingaben
- `generateSchedule()` ist der Einstiegspunkt fuer automatische Planung
- `rebalanceAfterManualChange()` loest eine Neuplanung nach manuellen Aenderungen aus

Das Programm bleibt also eine zustandsgetriebene statische Frontend-Anwendung.

### 3. Wichtige Datenmodelle

#### 3.1 `state`
`state` speichert weiterhin:
- Modus und aktive Tage
- Schichten
- Mitarbeitende
- Nachfrage pro Tag und Schicht
- erzeugten Dienstplan
- Statusmeldungen
- Summary und Coverage

#### 3.2 `schedule`
Der Dienstplan liegt weiterhin in `state.schedule`.

Jede Zelle enthaelt:
- `assignmentId`
- `variant`
- `locked`
- `source`

Beispiele:
- `shift-1::full`
- `shift-3::core`
- `frei`
- `geschlossen`

### 4. Der neue V2-Einstiegspunkt

#### 4.1 `generateSchedule()`
Die aktuelle `generateSchedule()` Funktion wurde fachlich deutlich erweitert.

Sie macht jetzt:
1. Demand-Struktur absichern
2. aktive Tage bestimmen
3. manuelle Sperren in den neuen Plan uebernehmen
4. statische Validierung ausfuehren
5. V2-Engine-Kontext aufbauen
6. Mitarbeitenden-Stats erzeugen
7. V2-Engine laufen lassen
8. Summary, Coverage und Meldungen neu berechnen

Wichtiger Unterschied zur alten Version:
Es wird nicht mehr einfach ein einheitlicher Aufgabenpool aufgebaut und in Wochenreihenfolge abgearbeitet.

### 5. Neue Validierung fuer V2

#### `validateStaticConfig()`
Diese Funktion prueft jetzt nicht nur Zeitlogik, sondern auch die festen Schichtrollen:
- `Frühschicht` muss genau einmal vorhanden sein
- `Mittelschicht` muss genau einmal vorhanden sein
- `Spätschicht` muss genau einmal vorhanden sein
- unbekannte zusaetzliche Schichtnamen blockieren die V2-Planung

Das ist wichtig, weil die neue Engine nicht mehr “irgendwelche” Schichten gleich behandelt, sondern ein festes Rollenmodell verwendet.

### 6. V2-Planungskontext

#### `createSchedulingEngineContext(planningDays)`
Diese Funktion baut den Planungsrahmen:
- `roleMap` fuer `early | middle | late`
- `orderedDays` in priorisierter Reihenfolge
- `dayPriority`

Die Tagesreihenfolge entsteht ueber:
- `sortPlanningDaysByPriority(...)`
- `getDayDemandHours(...)`
- `compareDayFallbackPriority(...)`

Fachlich bedeutet das:
Der Planer denkt zuerst in “welcher Tag ist aktuell am kritischsten”, nicht mehr in “welcher Wochentag kommt als naechstes”.

### 7. Neue Mitarbeitenden-Stats

#### `createEmployeeStats()`
Hier liegt eine wichtige fachliche Aenderung.

Frueher gab es im Wesentlichen nur:
- `assignedHours`
- `allowedHours`
- `overtimeCapacity`

Jetzt gibt es:
- `assignedHours`
- `hardCap`
- `softTarget`
- `overtimeCapacity`

Mentales Modell:
- `hardCap` = absolute Obergrenze
- `softTarget` = Wunsch- oder Zielbudget vor harter Eskalation

Das verhindert, dass Mitarbeitende zu frueh aus dem Kandidatenpool verschwinden.

### 8. V2-Engine als Phasenmodell

#### `runSchedulingEngine(employeeStats, engine)`
Das ist der wichtigste neue Block im gesamten Code.

Die Engine arbeitet in Phasen:
1. `runCriticalFullPhase(...)`
2. `repairCriticalCoverage(...)`
3. `repackTwentyHourCriticalAssignments(...)`
4. `runCriticalCoreFallbackPhase(...)`
5. erneute Coverage-Reparatur
6. falls noetig Ueberstunden freigeben
7. `runMiddlePhase(...)`
8. `normalizeAllDays(...)`

Das ist ein grosser Unterschied zur alten Struktur.

### 9. Kritische Schichten zuerst

#### `runCriticalFullPhase(...)`
Diese Phase bearbeitet nur:
- `Früh`
- `Spät`

Und zwar nicht blockweise, sondern ueber eine abwechselnde Queue.

#### `buildAlternatingCriticalRoleQueue(...)`
Diese Funktion erzeugt Reihenfolgen wie:
- `Früh -> Spät -> Früh -> Spät`

Damit wird verhindert, dass eine Seite komplett vollgeladen wird, bevor die andere Seite ueberhaupt bedient wurde.

### 10. `Mittelschicht` ist bewusst nachrangig

#### `runMiddlePhase(...)`
`Mittelschicht` wird erst dann normal geplant, wenn fuer den jeweiligen Tag keine kritischen Luecken mehr offen sind.

Das bildet deine Fachregel ab:
- `Früh` und `Spät` muessen zuerst stabil sein
- `Mittel` ist wichtig, aber nicht gleich kritisch

### 11. Kandidatenauswahl in V2

#### `selectBestCandidate(...)`
Die Kandidatenauswahl ist jetzt phasenabhaengig.

Sie prueft:
- Verfuegbarkeit
- ob an dem Tag schon eine Belegung existiert
- ob die Stundenlogik eingehalten wird
- ob jemand fuer `Mittel` reserviert bleiben muss

#### `canTakeTask(...)`
Diese Funktion ist jetzt strenger:
- ohne Ueberstunden darf nur innerhalb der regulaeren Wochenstunden geplant werden
- mit Ueberstunden darf bis `hardCap` gegangen werden
- fuer `critical-core` sind nur exakt `20h` Mitarbeitende zulaessig

### 12. Neue Scoring-Funktionen

Es gibt jetzt nicht mehr nur eine universelle Bewertungsfunktion.

#### `scoreCriticalFullTask(...)`
Verwendet fuer kritische Vollzeit-Schichten.

Beruecksichtigt unter anderem:
- Schichtpraeferenz
- Planungsprioritaet
- verbleibende Zielstunden
- ob reguläre Stunden oder Ueberstunden benoetigt werden
- Wochenverteilung

#### `scoreMiddleTask(...)`
Verwendet fuer `Mittelschicht`.

Diese Funktion ist konservativer, weil `Mittel` nachrangig ist.

#### `scoreCoreFallbackTask(...)`
Verwendet fuer Kernzeit-Fallbacks.

Wichtige Fachregel:
- nur fuer exakt `20h` Mitarbeitende
- nur als Fallback

### 13. `Kernzeit` in V2

#### `repackTwentyHourCriticalAssignments(...)`
Das ist einer der wichtigsten neuen Blöcke.

Fachlich passiert hier:
- wenn ein `20h` Mitarbeitender bereits eine kritische `Vollzeit`-Schicht hat
- und dieselbe Schicht eine kuerzere Kernzeit besitzt
- dann kann die Belegung auf `core` umgebaut werden

Ziel:
- weniger Stunden pro Tag
- dafuer moeglichst mehr einsatzfaehige Tage fuer kritische Deckung

Das ist wesentlich naeher an deiner beschriebenen Fachlogik als die alte Version.

### 14. Schutz fuer seltene `Mittelschicht`-Praeferenzen

#### `isReservedForMiddleShift(...)`
Diese Funktion schuetzt Mitarbeitende mit seltener `Mittelschicht`-Praeferenz.

Die Logik ist:
- wenn `Mittelschicht` noch offen ist
- und eine Person eine relevante `Mittel`-Praeferenz hat
- dann wird sie moeglichst nicht schon vorher fuer `Früh` oder `Spät` verbraucht

So wird verhindert, dass die einzige sinnvolle `Mittel`-Person zufaellig in einer anderen Schicht landet.

### 15. Repair-Phase und Neuverteilung

#### `repairCriticalCoverage(...)`
Diese Funktion versucht, offene kritische Luecken nach der ersten Verteilung erneut zu schliessen.

#### `repairCoverageForDayV2(...)`
Diese Funktion arbeitet auf Tagesebene.

Sie versucht:
- lokale Nachbesetzung
- direkte neue Kandidatensuche
- optionalen Kernzeit-Fallback

#### `repairCoverageAcrossDays(...)`
Neu in V2:
Es wird nicht nur innerhalb eines Tages umverteilt, sondern auch zwischen Tagen niedrigerer Prioritaet und hoeherer Prioritaet verschoben.

Das ist besonders wichtig fuer Samstage und Feiertags-Verschiebungen.

### 16. Umbesetzung und Rueckfall

#### `tryReassignWithinDayV2(...)`
Diese Funktion verschiebt Mitarbeitende innerhalb desselben Tages zwischen Schichten, wenn das fachlich sinnvoll ist.

#### `backfillOriginalTaskV2(...)`
Wenn durch eine Verschiebung eine alte Belegung frei wird, versucht diese Funktion einen Rueckfill.

Das bleibt weiterhin heuristisch, ist aber strukturierter als in der alten Version.

### 17. Ueberplanung abbauen

#### `normalizeDayOverfillV2(...)`
Wenn eine Schicht ueberfuellt ist, entfernt diese Funktion die am wenigsten passende Person zuerst.

#### `overfillRemovalScoreV2(...)`
Die Bewertungslogik bevorzugt:
- Personen mit echter Schichtpraeferenz
- hoehere Planungsprioritaet
- loest eher unpassende Zuordnungen auf

### 18. Manuelle Aenderung in V2

#### `rebalanceAfterManualChange(...)`
Die alte spezielle Nachplanungsfunktion wurde jetzt vereinfacht:
- sie ruft direkt wieder `generateSchedule({ preserveManualLocks: true })` auf

Das bedeutet:
- manuelle Sperren bleiben erhalten
- dieselbe V2-Engine wird erneut angewendet
- automatische und manuelle Planung nutzen dieselbe Logikbasis

Das ist fachlich sauberer als zwei unterschiedliche Planungswege.

### 19. Wichtige Stellen fuer ein Interview

Wenn du die aktuelle Version erklaeren willst, sind diese Abschnitte die wichtigsten:
- `generateSchedule()`
- `createSchedulingEngineContext()`
- `runSchedulingEngine()`
- `runCriticalFullPhase()`
- `runMiddlePhase()`
- `repackTwentyHourCriticalAssignments()`
- `isReservedForMiddleShift()`
- `repairCriticalCoverage()`
- `rebalanceAfterManualChange()`

### 20. Aktueller ehrlicher Zustand
Die jetzige V2-Engine ist bereits fachlich wesentlich naeher an der gewuenschten Logik.

Sie kann jetzt besser:
- Hochlasttage priorisieren
- kritische Schichten bevorzugen
- `Mittel` spaeter behandeln
- `Kernzeit` gezielter einsetzen
- manuelle Sperren ueber dieselbe Engine respektieren

Aber:
- sie ist weiterhin heuristisch
- nicht jeder Fall ist global optimal
- einzelne Mehrarbeits- oder Verteilungsentscheidungen koennen noch verbessert werden

Die richtige Denkweise ist deshalb:
Das System ist jetzt keine rohe Demo-Heuristik mehr, sondern eine strukturierte V2-Planungsengine mit klarer Fachlogik, aber noch kein perfekter Optimierer.

---

## 中文

### 1. 目前最重要的变化是什么
第一版是一个比较简单的启发式贪心排班器：
- 任务大体上按周顺序处理
- 对关键班次的业务优先级处理不够强
- `Kernzeit` 启动得太早
- 手动改班后的重平衡虽然能用，但本质上还很接近旧逻辑

现在 [app.js](C:\Users\filic\Documents\New project 5\app.js) 里的版本已经变成了 V2 引擎：
- 会先按需求高低排序日期
- `Frühschicht` 和 `Spätschicht` 被视为关键班次
- `Mittelschicht` 后置处理
- `Kernzeit` 只对精确 `20h` 员工作为兜底策略使用
- 手动改班后的重平衡已经切到同一套引擎

### 2. 整体架构没有变
整体架构仍然保持不变：
- `state` 仍然是唯一真实数据源
- `refs` 保存 DOM 引用
- `render...` 函数负责绘制 UI
- `on...` 函数负责处理用户输入
- `generateSchedule()` 是自动排班入口
- `rebalanceAfterManualChange()` 负责手动修改后的自动重排

也就是说，这个项目依旧是“状态驱动的静态前端应用”。

### 3. 重要数据结构仍然是什么

#### 3.1 `state`
`state` 仍然保存这些内容：
- 当前模式和激活天数
- 所有班次
- 所有员工
- 每天每班次需求
- 当前生成的排班表
- 提示信息
- 汇总数据和覆盖率数据

#### 3.2 `schedule`
排班结果依旧保存在 `state.schedule` 里。

每个单元格仍然包含：
- `assignmentId`
- `variant`
- `locked`
- `source`

例如：
- `shift-1::full`
- `shift-3::core`
- `frei`
- `geschlossen`

### 4. V2 的新入口

#### 4.1 `generateSchedule()`
当前版本的 `generateSchedule()` 已经明显升级。

现在它负责：
1. 先确保需求数据结构完整
2. 找出本次要排的工作日
3. 把手动锁定内容带入新排班
4. 执行静态校验
5. 构建 V2 引擎上下文
6. 为员工建立本次排班统计对象
7. 运行整套 V2 引擎
8. 重新计算汇总、覆盖率和提示信息

和旧版本最大的区别是：
现在不再只是简单构造统一任务池，再按固定周顺序一个个贪心分配。

### 5. V2 新增了什么校验

#### `validateStaticConfig()`
这个函数现在不仅检查时间合法性，还检查固定班次角色：
- `Frühschicht` 必须存在且只能有一个
- `Mittelschicht` 必须存在且只能有一个
- `Spätschicht` 必须存在且只能有一个
- 未识别的额外班次名称会直接阻止 V2 运行

这是因为新引擎不是把所有班次都一视同仁，而是依赖固定角色模型。

### 6. V2 排班上下文

#### `createSchedulingEngineContext(planningDays)`
这个函数会构建排班时需要的上下文：
- `roleMap`，把班次映射为 `early | middle | late`
- `orderedDays`，按优先级排好的天
- `dayPriority`

日期排序依赖：
- `sortPlanningDaysByPriority(...)`
- `getDayDemandHours(...)`
- `compareDayFallbackPriority(...)`

业务含义是：
引擎不再按“星期几先后”思考，而是先思考“哪一天现在最缺人、最关键”。

### 7. 新的员工统计对象

#### `createEmployeeStats()`
这部分是很关键的变化。

以前大致只有：
- `assignedHours`
- `allowedHours`
- `overtimeCapacity`

现在变成：
- `assignedHours`
- `hardCap`
- `softTarget`
- `overtimeCapacity`

可以这样理解：
- `hardCap` 是绝对硬上限
- `softTarget` 是期望目标工时

这样做的好处是：
不会因为团队整体看起来工时够了，就把某些员工过早踢出候选池。

### 8. V2 引擎是一个分阶段模型

#### `runSchedulingEngine(employeeStats, engine)`
这是当前代码里最重要的新函数之一。

整个引擎按阶段执行：
1. `runCriticalFullPhase(...)`
2. `repairCriticalCoverage(...)`
3. `repackTwentyHourCriticalAssignments(...)`
4. `runCriticalCoreFallbackPhase(...)`
5. 再次修复关键缺口
6. 如有必要再释放加班
7. `runMiddlePhase(...)`
8. `normalizeAllDays(...)`

这和旧版本那种“统一任务池 + 一次性贪心”相比，结构清楚得多。

### 9. 为什么先排关键班次

#### `runCriticalFullPhase(...)`
这个阶段只处理两类班次：
- `Früh`
- `Spät`

并且不是一口气先排完早班再排晚班，而是交替排。

#### `buildAlternatingCriticalRoleQueue(...)`
它会生成类似这样的顺序：
- `Früh -> Spät -> Früh -> Spät`

这样就能避免“某一边先被堆满，另一边根本没人”的问题。

### 10. `Mittelschicht` 为什么后排

#### `runMiddlePhase(...)`
`Mittelschicht` 只有在当天关键班次缺口已经清零后，才会进入正常分配。

这直接体现了你定义的业务规则：
- `Früh` 和 `Spät` 更关键
- `Mittel` 重要，但优先级更低

### 11. V2 的候选人选择怎么做

#### `selectBestCandidate(...)`
当前候选人选择已经是“按阶段”的。

它会检查：
- 员工当天是否可用
- 当天是否已经排了别的班
- 工时是否还能容纳这个任务
- 是否需要为 `Mittel` 做偏好保留

#### `canTakeTask(...)`
这个函数现在更严格：
- 不允许加班时，只能在正常周工时内排
- 允许加班后，才可以使用 `hardCap`
- `critical-core` 只允许精确 `20h` 员工进入

### 12. 评分函数已经拆开
现在不再只有一个统一评分函数。

#### `scoreCriticalFullTask(...)`
用于关键班次的 `Vollzeit` 分配。

会考虑：
- 偏好班次
- 排班优先级
- 剩余目标工时
- 是否需要动用加班
- 一周分布是否均衡

#### `scoreMiddleTask(...)`
专门用于 `Mittelschicht`。

这个评分比关键班次更保守，因为 `Mittel` 是次级班次。

#### `scoreCoreFallbackTask(...)`
专门用于 `Kernzeit` 兜底。

最重要的业务规则是：
- 只给精确 `20h` 员工
- 只作为兜底，不作为默认优先策略

### 13. `Kernzeit` 在 V2 里的真实角色

#### `repackTwentyHourCriticalAssignments(...)`
这是这轮改动里非常重要的一个函数。

它做的事是：
- 如果一个 `20h` 员工已经排到了关键班次的 `Vollzeit`
- 而这个班次存在更短的 `Kernzeit`
- 那么系统可以把这条排班压缩成 `core`

业务意义：
- 员工单天少工作一点
- 但能换来覆盖更多工作日的可能性

这比旧版那种“随便给低工时员工打个核心时段标签”更接近你真正的业务想法。

### 14. 稀缺 `Mittelschicht` 偏好保护

#### `isReservedForMiddleShift(...)`
这个函数的目的是保护少数 `Mittelschicht` 偏好员工。

逻辑是：
- 如果 `Mittelschicht` 还没有排满
- 且某人是对 `Mittel` 有价值的偏好者
- 那么不要太早把他拿去填 `Früh` 或 `Spät`

这样可以避免“唯一一个合适中班的人被随手排去关键班次”的问题。

### 15. 关键缺口修复

#### `repairCriticalCoverage(...)`
这一步负责在第一轮分配之后继续修复关键缺口。

#### `repairCoverageForDayV2(...)`
这是按天进行修复的逻辑。

它会尝试：
- 当天内部调换
- 直接重新分配
- 必要时启用 `Kernzeit` 兜底

#### `repairCoverageAcrossDays(...)`
V2 新增了跨天修复：
- 不只在当天内部调整
- 还会尝试把低优先级日的人挪到高优先级日

这一点对于周六高峰和节假日前移需求尤其关键。

### 16. 调班和回退

#### `tryReassignWithinDayV2(...)`
这个函数会在同一天内做岗位互换。

#### `backfillOriginalTaskV2(...)`
如果因为调换造成原来的任务空出来，它会尝试补回。

这部分仍然是启发式，但比第一版有更清晰的阶段边界。

### 17. 如果排多了怎么回收

#### `normalizeDayOverfillV2(...)`
如果某个班次超额分配，这个函数会移除最不合适的员工。

#### `overfillRemovalScoreV2(...)`
打分逻辑会更倾向于保留：
- 真正偏好这个班的人
- 排班优先级更高的人

### 18. 手动改班现在怎么走

#### `rebalanceAfterManualChange(...)`
当前版本里，这个函数已经不再走一条单独的旧重排路径，而是直接调用：
- `generateSchedule({ preserveManualLocks: true })`

含义是：
- 手动锁定内容保留
- 自动生成与手动重平衡使用同一套 V2 引擎

这比“两套逻辑并存”更干净。

### 19. 面试时最值得讲哪些代码
如果你现在要讲当前版本，最值得讲的是：
- `generateSchedule()`
- `createSchedulingEngineContext()`
- `runSchedulingEngine()`
- `runCriticalFullPhase()`
- `runMiddlePhase()`
- `repackTwentyHourCriticalAssignments()`
- `isReservedForMiddleShift()`
- `repairCriticalCoverage()`
- `rebalanceAfterManualChange()`

### 20. 当前的真实状态
现在的 V2 引擎已经明显比旧版更接近目标业务逻辑。

它已经更擅长：
- 先处理高需求日
- 优先处理关键班次
- 把 `Mittel` 后置
- 更谨慎地使用 `Kernzeit`
- 在同一套引擎里处理手动改班

但也要诚实说明：
- 它仍然是启发式，不是全局最优
- 某些跨天平衡和加班决策还可以继续优化

所以最准确的描述是：
当前系统已经不是早期草稿式 demo，而是一套有明确业务分层的 V2 排班引擎，只是离“最优排班器”还有进一步优化空间。
