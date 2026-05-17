# Dienstplan Demo

## Deutsch

### 1. Projektueberblick
Dieses Projekt ist ein rein front-end-basiertes Demo fuer ein deutsches HR- und Dienstplan-System.

Der aktuelle Stand soll zeigen:
- Verstaendnis fuer reale Schichtplanungsregeln
- eine editierbare Konfiguration fuer Schichten, Bedarfe und Mitarbeitende
- automatische Erzeugung eines Wochenplans
- manuelle Eingriffe durch die Filialleitung
- automatische Neuplanung nach Raster-Aenderungen
- gezielte manuelle Zusatzschichten ohne Neuplanung

Alle sichtbaren Inhalte der Anwendung bleiben auf Deutsch.

### 2. Technischer Rahmen
Die Anwendung besteht aktuell aus:
- `index.html`
- `styles.css`
- `app.js`

Es gibt:
- keine Datenbank
- kein Backend
- keine Authentifizierung

Die Daten leben im Frontend-Zustand und koennen als JSON importiert oder exportiert werden.

### 3. Aktueller Funktionsumfang

#### Planungsmodus
- `Wochenplanung` fuer Montag bis Samstag
- Sonntag ist immer ausgeschlossen
- einzelne Tage koennen in der Wochenplanung deaktiviert werden, z. B. fuer Feiertage

#### Schichtverwaltung
- Schichten koennen hinzugefuegt und entfernt werden
- Schichtzeiten und Kernzeiten sind editierbar
- Bedarfe pro Schicht sind editierbar
- pro Wochentag koennen Bedarfe ueberschrieben werden

#### Mitarbeitendenverwaltung
- Mitarbeitende koennen hinzugefuegt und entfernt werden
- Vertragsstunden / Wochenstunden koennen gepflegt werden
- verfuegbare Stunden fuer die aktuelle Woche koennen gepflegt werden
- bevorzugte Schicht kann gesetzt werden
- `Überstunden-Priorität` und `Planungs-Priorität` koennen gesetzt werden

#### Auto-Planung
- automatischer Dienstplan auf Basis von Schichten, Bedarfen und Mitarbeitenden
- Priorisierung der Tage nach Gesamtbedarf in Netto-Stunden
- feste Rollen fuer `Frühschicht`, `Mittelschicht`, `Spätschicht`
- bevorzugte Behandlung von `Früh` und `Spät` als kritische Schichten
- `Mittel` wird erst nach den kritischen Schichten geplant
- `Kernzeit` wird nur fuer exakt `20h` Mitarbeitende als Fallback genutzt
- Ueberstunden werden nur nach Prioritaet freigegeben

#### Manuelle Aenderung
- jede Zelle im Dienstplan ist manuell editierbar
- direkte Raster-Aenderungen werden gesperrt
- direkte Raster-Aenderungen berechnen den Rest des Plans neu
- unter dem Dienstplan gibt es ein separates Panel fuer manuelle Zusatzschichten
- dieses Panel darf nur auf Zellen mit `frei` schreiben
- Zusatzschichten koennen als `voll` oder `Kernzeit` gesetzt werden
- Zusatzschichten erscheinen sofort im Dienstplan sowie in `Bedarf gegen Ist`
- Zusatzschichten loesen keine Neuplanung des restlichen Wochenplans aus
- manuell auf `frei` gesetzte Felder bleiben respektiert

#### Datenexport
- Import / Export als JSON
- manuelle Zusatzschichten bleiben im JSON erhalten, weil sie direkt in `state.schedule` gespeichert werden

### 4. V2 Scheduling Engine
Die aktuelle Version verwendet nicht mehr den alten einfachen Wochenreihenfolge-Greedy-Planer.

Stattdessen arbeitet sie mit einer V2-Engine:

#### Tagesreihenfolge
- aktive Tage werden zuerst nach Gesamtbedarf in Netto-Stunden sortiert
- bei Gleichstand gilt:
  `Samstag > Freitag > Donnerstag > Mittwoch > Dienstag > Montag`

#### Feste Schichtrollen
Die Engine erwartet genau diese drei Schichttypen:
- `Frühschicht`
- `Mittelschicht`
- `Spätschicht`

Diese Rollen sind aktuell fest im Code hinterlegt.

#### Phasen der Planung
1. `Früh` und `Spät` werden als kritische Schichten zuerst geplant
2. innerhalb eines Tages werden `Früh` und `Spät` abwechselnd vergeben
3. `Mittelschicht` wird erst danach gefuellt
4. `Kernzeit` wird nur fuer exakt `20h` Mitarbeitende als Fallback genutzt
5. erst wenn kritische Schichten sonst nicht mehr gedeckt werden koennen, wird Ueberstundenkapazitaet freigegeben

#### Schutz fuer seltene Praeferenzen
Wenn eine Person eine seltene `Mittelschicht`-Praeferenz hat, wird sie nicht leichtfertig fuer `Früh` oder `Spät` verbraucht.

#### SoftTarget vs. HardCap
Die Engine unterscheidet intern zwischen:
- `hardCap`: harte Obergrenze inkl. freigegebener Ueberstunden
- `softTarget`: gewuenschtes Stundenbudget ohne vorschnelles Wegkuerzen von Kandidaten

Dadurch werden Mitarbeitende nicht schon vorzeitig aus dem Kandidatenpool entfernt, nur weil das Team insgesamt genug Stunden haette.

### 5. Aktueller Stand gegenueber der alten Version
Im Vergleich zur ersten Version wurden bereits verbessert:
- keine starre Planung von Montag nach Samstag mehr
- `Früh` / `Spät` werden als kritische Schichten priorisiert
- `Mittel` ist nachgelagert
- `Kernzeit` wird nicht mehr pauschal auf beliebige Mitarbeitende angewandt
- direkte Raster-Aenderungen laufen ueber dieselbe V2-Logik wie die automatische Planung
- manuelle Zusatzschichten koennen jetzt bewusst ausserhalb der Neuplanung gesetzt werden
- typische Fehlbilder wie komplett freie 20h-Mitarbeitende trotz offener kritischer Bedarfe wurden reduziert

### 6. Bekannte Grenzen
Die aktuelle Engine ist bereits naeher an der gewuenschten Fachlogik, aber noch kein global optimaler Planer.

Aktuelle Grenzen:
- das Ergebnis ist weiterhin heuristisch
- einzelne Ueberstunden- oder Verteilungsentscheidungen sind noch nicht optimal
- die Engine nutzt feste Schichtnamen statt frei konfigurierbarer Rollentypen
- komplexe Abwesenheiten, Urlaub, Termin-Sperren oder Arbeitsrechtsregeln sind noch nicht voll implementiert
- es gibt noch keinen mathematischen Optimierer / Solver

### 7. Dateistruktur
```text
/
├─ index.html
├─ styles.css
├─ app.js
├─ README.md
├─ docs/
└─ temp/
```

### 8. Wichtige naechste Schritte
- weitere Verbesserung der Heuristik fuer fairere Stundenverteilung
- bessere globale Umverteilung zwischen Tagen mit Restkapazitaet
- explizite Abwesenheiten / Urlaub / Termine
- Begruendung pro Zuweisung im UI
- spaetere Migration auf Backend oder Solver-basierte Engine

### 9. Demo starten
- `index.html` direkt im Browser oeffnen
- alternativ einen einfachen statischen Server verwenden

Es ist aktuell kein Build-Schritt erforderlich.

---

## 中文

### 1. 项目概述
这是一个纯前端的人事排班系统 Demo，面向德国本地化的人事管理和门店排班场景。

当前版本主要用于展示：
- 对真实排班规则的理解
- 可编辑的班次、需求和员工配置
- 自动生成周排班
- 店长手动干预
- 在排班表内手动改班后的自动重新排班
- 在独立补班面板中追加班次且不重排

应用里用户能看到的内容仍然全部使用德语。

### 2. 技术范围
当前应用由以下文件组成：
- `index.html`
- `styles.css`
- `app.js`

目前没有：
- 数据库
- 后端服务
- 登录和权限系统

数据完全保存在前端状态中，并支持 JSON 导入导出。

### 3. 当前功能

#### 排班模式
- `Wochenplanung`：对周一到周六生成排班
- 周日始终不排班
- 周模式下可以关闭某些天，例如模拟节假日

#### 班次管理
- 支持新增和删除班次
- 班次时间和核心时间可编辑
- 每个班次的需求人数可编辑
- 每个星期几都可以单独覆盖需求

#### 员工管理
- 支持新增和删除员工
- 可维护每周工时
- 可维护本周可用工时
- 可维护偏好班次
- 可设置 `Überstunden-Priorität` 和 `Planungs-Priorität`

#### 自动排班
- 根据班次、需求和员工信息自动生成排班
- 按“每日总净工时”优先安排高需求日
- 固定识别 `Frühschicht / Mittelschicht / Spätschicht`
- 把 `Früh` 和 `Spät` 作为关键班次优先处理
- `Mittel` 在关键班次之后再处理
- `Kernzeit` 只对精确 `20h` 员工作为兜底策略使用
- 加班只在必要时按优先级放开

#### 手动改班
- 排班表中每个单元格都可手动修改
- 直接在排班表内修改后，单元格会锁定
- 直接在排班表内修改后，系统会基于锁定结果重新计算其余排班
- 在 `Automatisch erzeugter Dienstplan` 下方还有一个独立的手动补班区域
- 该区域只允许给当前为 `frei` 的格子补班
- 补班可以直接选择 `voll` 或 `Kernzeit`
- 补班后会立刻同步到上方排班表和下方 `Bedarf gegen Ist`
- 这类补班不会触发整周重新排班
- 手动设置为 `frei` 的格子不会被自动覆盖

#### 数据导出
- 支持 JSON 导入导出
- 手动补班结果也会跟随 JSON 一起保存和恢复

### 4. 当前 V2 排班引擎
当前版本已经不再使用最初那个“按周一到周六顺序排、逐任务贪心”的旧引擎。

现在使用的是 V2 引擎：

#### 日期优先级
- 先按当天总净工时排序
- 如果相同，则按固定顺序：
  `Samstag > Freitag > Donnerstag > Mittwoch > Dienstag > Montag`

#### 固定班次角色
当前引擎要求存在且只识别这三个班次：
- `Frühschicht`
- `Mittelschicht`
- `Spätschicht`

这些角色目前是直接写死在代码中的。

#### 排班阶段
1. 先排关键班次 `Früh` 和 `Spät`
2. 同一天内按 `Früh -> Spät -> Früh -> Spät` 交替处理
3. 然后再处理 `Mittel`
4. `Kernzeit` 只对精确 `20h` 员工作为兜底策略使用
5. 如果关键班次还无法覆盖，才释放加班能力

#### 稀缺偏好保护
如果某个员工是少数或唯一的 `Mittelschicht` 偏好者，系统不会轻易把他先消耗在 `Früh` 或 `Spät` 上。

#### SoftTarget 与 HardCap
当前引擎内部区分两类工时约束：
- `hardCap`：真实硬上限，包含必要时放开的加班
- `softTarget`：期望目标工时，不会过早把员工排除出候选池

这样可以避免“明明后面关键班次还缺人，但前面就先把员工排除掉”的旧问题。

### 5. 相比旧版本的已完成改进
和第一版相比，目前已经完成的改进包括：
- 不再固定按周一到周六顺排
- `Früh` / `Spät` 被当作关键班次优先保障
- `Mittel` 被放到后处理
- `Kernzeit` 不再随意套用到任意员工
- 表格内手动改班后的重平衡已经切到同一套 V2 引擎
- 另外新增了“不重排的手动补班入口”，用于现实场景下的小范围微调
- 像“20h 员工整周全 frei，但关键需求还没满足”这种明显错误已经被显著削弱

### 6. 当前已知局限
当前引擎已经明显更接近你要的业务逻辑，但还不是全局最优排班器。

目前的局限包括：
- 结果仍然是启发式，不是全局最优
- 某些加班和跨天平衡决策还不够理想
- 目前仍然依赖固定班次名称，而不是完全自由配置的角色系统
- 请假、休假、预约、劳动法等复杂约束还没有完全加入
- 还没有引入数学求解器 / 优化器

### 7. 文件结构
```text
/
├─ index.html
├─ styles.css
├─ app.js
├─ README.md
├─ docs/
└─ temp/
```

### 8. 建议的下一步
- 继续优化启发式算法，让工时分配更公平
- 进一步增强跨天全局调配能力
- 加入请假 / 休假 / Termin 约束
- 在 UI 中展示“为什么这样排”的解释
- 后续可迁移到后端或求解器方案

### 9. 如何运行 Demo
- 直接用浏览器打开 `index.html`
- 或者使用任意简单静态服务器

当前版本不需要构建步骤。
