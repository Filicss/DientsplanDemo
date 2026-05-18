const DAYS = [
  { key: "monday", label: "Montag" },
  { key: "tuesday", label: "Dienstag" },
  { key: "wednesday", label: "Mittwoch" },
  { key: "thursday", label: "Donnerstag" },
  { key: "friday", label: "Freitag" },
  { key: "saturday", label: "Samstag" },
];

const LEGACY_MODE_DAY = "day";
const MODE_WEEK = "week";
const ASSIGNMENT_FREE = "frei";
const ASSIGNMENT_CLOSED = "geschlossen";

let nextShiftId = 4;
let nextEmployeeId = 11;

const sampleData = createSampleData();

const state = {
  mode: MODE_WEEK,
  selectedDay: "monday",
  activeDays: DAYS.reduce((acc, day) => {
    acc[day.key] = true;
    return acc;
  }, {}),
  shifts: sampleData.shifts,
  employees: sampleData.employees,
  demandOverrides: sampleData.demandOverrides,
  schedule: {},
  statusMessages: [],
  summary: {},
  coverage: {},
  generationRevision: 0,
  manualAddForm: {
    employeeId: "",
    dayKey: "",
    assignmentId: "",
  },
  manualAddFeedback: null,
};

const refs = {
  heroActions: document.querySelector(".hero-actions"),
  modeControls: document.querySelector("#modeControls"),
  shiftTableBody: document.querySelector("#shiftTableBody"),
  demandTableBody: document.querySelector("#demandTableBody"),
  employeeTableBody: document.querySelector("#employeeTableBody"),
  scheduleTableHead: document.querySelector("#scheduleTableHead"),
  scheduleTableBody: document.querySelector("#scheduleTableBody"),
  summaryCards: document.querySelector("#summaryCards"),
  coverageTableBody: document.querySelector("#coverageTableBody"),
  statusList: document.querySelector("#statusList"),
  manualAddEmployee: document.querySelector("#manualAddEmployee"),
  manualAddDay: document.querySelector("#manualAddDay"),
  manualAddAssignment: document.querySelector("#manualAddAssignment"),
  manualAddButton: document.querySelector("#manualAddButton"),
  manualAddFeedback: document.querySelector("#manualAddFeedback"),
  generateButton: document.querySelector("#generateButton"),
  resultSecondaryActionsMount: document.querySelector("#resultSecondaryActionsMount"),
  resetLocksButton: document.querySelector("#resetLocksButton"),
  loadSampleButton: document.querySelector("#loadSampleButton"),
  exportButton: document.querySelector("#exportButton"),
  importButton: document.querySelector("#importButton"),
  importFileInput: document.querySelector("#importFileInput"),
  addShiftButton: document.querySelector("#addShiftButton"),
  addEmployeeButton: document.querySelector("#addEmployeeButton"),
  syncDemandButton: document.querySelector("#syncDemandButton"),
};

boot();

function boot() {
  mountResultActions();
  bindActions();
  renderAll();
  generateSchedule();
}

function mountResultActions() {
  if (!refs.heroActions || !refs.resultSecondaryActionsMount) {
    return;
  }

  refs.heroActions.classList.add("result-secondary-actions");
  refs.resultSecondaryActionsMount.appendChild(refs.heroActions);
}

function bindActions() {
  refs.generateButton.addEventListener("click", generateSchedule);
  refs.resetLocksButton.addEventListener("click", resetManualLocks);
  refs.loadSampleButton.addEventListener("click", loadSampleData);
  refs.exportButton.addEventListener("click", exportJson);
  refs.importButton.addEventListener("click", () => refs.importFileInput.click());
  refs.importFileInput.addEventListener("change", importJson);
  refs.addShiftButton?.addEventListener("click", addShift);
  refs.addEmployeeButton.addEventListener("click", addEmployee);
  refs.syncDemandButton?.addEventListener("click", syncDemandToDefault);
  refs.manualAddButton.addEventListener("click", onManualAddSubmit);
  refs.manualAddEmployee.addEventListener("change", onManualAddFieldChange);
  refs.manualAddDay.addEventListener("change", onManualAddFieldChange);
  refs.manualAddAssignment.addEventListener("change", onManualAddFieldChange);
}

function createSampleData() {
  const shifts = [
    createShift({
      id: "shift-1",
      name: "Frühschicht",
      start: "06:00",
      end: "14:30",
      coreStart: "08:00",
      coreEnd: "13:30",
      demand: 3,
    }),
    createShift({
      id: "shift-2",
      name: "Mittelschicht",
      start: "09:00",
      end: "17:30",
      coreStart: "09:00",
      coreEnd: "17:30",
      demand: 1,
    }),
    createShift({
      id: "shift-3",
      name: "Spätschicht",
      start: "13:00",
      end: "21:30",
      coreStart: "14:30",
      coreEnd: "21:00",
      demand: 3,
    }),
  ];

  const employees = [
    createEmployee({
      id: "emp-1",
      name: "A",
      weeklyHours: 20,
      remainingHours: 20,
      preferredShiftId: "shift-1",
      overtimePriority: 0,
      planningPriority: 1,
    }),
    createEmployee({
      id: "emp-2",
      name: "B",
      weeklyHours: 35,
      remainingHours: 35,
      preferredShiftId: "shift-1",
      overtimePriority: 1,
      planningPriority: 1,
    }),
    createEmployee({
      id: "emp-3",
      name: "C",
      weeklyHours: 40,
      remainingHours: 40,
      preferredShiftId: "shift-1",
      overtimePriority: 2,
      planningPriority: 2,
    }),
    createEmployee({
      id: "emp-4",
      name: "D",
      weeklyHours: 37.5,
      remainingHours: 37.5,
      preferredShiftId: "",
      overtimePriority: 3,
      planningPriority: 3,
    }),
    createEmployee({
      id: "emp-5",
      name: "E",
      weeklyHours: 20,
      remainingHours: 20,
      preferredShiftId: "shift-2",
      overtimePriority: 0,
      planningPriority: 1,
    }),
    createEmployee({
      id: "emp-6",
      name: "F",
      weeklyHours: 40,
      remainingHours: 40,
      preferredShiftId: "shift-2",
      overtimePriority: 2,
      planningPriority: 2,
    }),
    createEmployee({
      id: "emp-7",
      name: "G",
      weeklyHours: 30,
      remainingHours: 30,
      preferredShiftId: "",
      overtimePriority: 3,
      planningPriority: 3,
    }),
    createEmployee({
      id: "emp-8",
      name: "H",
      weeklyHours: 20,
      remainingHours: 20,
      preferredShiftId: "shift-3",
      overtimePriority: 0,
      planningPriority: 1,
    }),
    createEmployee({
      id: "emp-9",
      name: "I",
      weeklyHours: 30,
      remainingHours: 30,
      preferredShiftId: "shift-3",
      overtimePriority: 1,
      planningPriority: 2,
    }),
    createEmployee({
      id: "emp-10",
      name: "J",
      weeklyHours: 30,
      remainingHours: 30,
      preferredShiftId: "shift-3",
      overtimePriority: 2,
      planningPriority: 2,
    }),
  ];

  const demandOverrides = {};

  for (const day of DAYS) {
    demandOverrides[day.key] = {
      "shift-1": 3,
      "shift-2": day.key === "saturday" ? 2 : 1,
      "shift-3": day.key === "friday" || day.key === "saturday" ? 4 : 3,
    };
  }

  return { shifts, employees, demandOverrides };
}

function createShift(shift) {
  return {
    id: shift.id,
    name: shift.name,
    start: shift.start,
    end: shift.end,
    coreStart: shift.coreStart,
    coreEnd: shift.coreEnd,
    demand: Number(shift.demand) || 0,
  };
}

function createEmployee(employee) {
  return {
    id: employee.id,
    name: employee.name,
    weeklyHours: Number(employee.weeklyHours) || 0,
    remainingHours:
      employee.remainingHours === "" || employee.remainingHours === undefined
        ? Number(employee.weeklyHours) || 0
        : Number(employee.remainingHours) || 0,
    preferredShiftId: employee.preferredShiftId || "",
    overtimePriority: clamp(Number(employee.overtimePriority) || 0, 0, 3),
    planningPriority: clamp(Number(employee.planningPriority) || 1, 1, 3),
  };
}

function renderAll() {
  ensureDemandShape();
  renderModeControls();
  renderShiftTable();
  renderDemandTable();
  renderEmployeeTable();
  renderScheduleTable();
  renderSummaryCards();
  renderCoverageTable();
  renderManualAddPanel();
  renderStatusMessages();
}

function renderModeControls() {
  refs.modeControls.innerHTML = `
    <div class="mode-row">
      <div class="mode-selector is-active" aria-hidden="true">
        <span class="selector-dot"></span>
        <span>Wochenplanung</span>
      </div>
      <div class="day-chip-row">
        ${DAYS.map((day) => `
          <button
            type="button"
            class="day-chip ${state.activeDays[day.key] ? "is-active" : "is-closed"}"
            data-day="${day.key}"
          >
            ${day.label}
          </button>
        `).join("")}
      </div>
    </div>
  `;

  refs.modeControls.querySelectorAll("[data-day]").forEach((element) => {
    element.addEventListener("click", () => {
      const day = element.dataset.day;
      state.mode = MODE_WEEK;
      state.activeDays[day] = !state.activeDays[day];
      renderModeControls();
      renderDemandTable();
      renderScheduleTable();
      renderManualAddPanel();
    });
  });
}

function renderShiftTable() {
  refs.shiftTableBody.innerHTML = state.shifts
    .map((shift) => {
      const fullHours = netHoursBetween(shift.start, shift.end);
      const coreHours = netHoursBetween(shift.coreStart, shift.coreEnd);

      return `
        <tr>
          <td>${escapeHtml(shift.name)}</td>
          <td><input type="time" value="${shift.start}" data-shift-id="${shift.id}" data-field="start" /></td>
          <td><input type="time" value="${shift.end}" data-shift-id="${shift.id}" data-field="end" /></td>
          <td><input type="time" value="${shift.coreStart}" data-shift-id="${shift.id}" data-field="coreStart" /></td>
          <td><input type="time" value="${shift.coreEnd}" data-shift-id="${shift.id}" data-field="coreEnd" /></td>
          <td><input type="number" min="0" step="1" value="${shift.demand}" data-shift-id="${shift.id}" data-field="demand" /></td>
          <td class="metric-cell">${formatHours(fullHours)} h</td>
          <td class="metric-cell">${formatHours(coreHours)} h</td>
          <td><button type="button" class="remove-button" data-remove-shift="${shift.id}">x</button></td>
        </tr>
      `;
    })
    .join("");

  refs.shiftTableBody.querySelectorAll("[data-shift-id]").forEach((input) => {
    input.addEventListener("change", onShiftFieldChange);
  });

  refs.shiftTableBody.querySelectorAll("[data-remove-shift]").forEach((button) => {
    button.addEventListener("click", () => removeShift(button.dataset.removeShift));
  });
}

function renderDemandTable() {
  refs.demandTableBody.innerHTML = state.shifts
    .map((shift) => {
      return `
        <tr>
          <td>${shift.name}</td>
          ${DAYS.map((day) => {
            const value = getDemandValue(day.key, shift.id);
            const disabled = !state.activeDays[day.key];
            return `
              <td>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value="${value}"
                  data-demand-day="${day.key}"
                  data-demand-shift="${shift.id}"
                  ${disabled ? "disabled" : ""}
                />
              </td>
            `;
          }).join("")}
        </tr>
      `;
    })
    .join("");

  refs.demandTableBody.querySelectorAll("[data-demand-day]").forEach((input) => {
    input.addEventListener("change", onDemandFieldChange);
  });
}

function renderEmployeeTable() {
  refs.employeeTableBody.innerHTML = state.employees
    .map((employee) => {
      return `
        <tr>
          <td><input type="text" value="${escapeAttr(employee.name)}" data-employee-id="${employee.id}" data-field="name" /></td>
          <td><input type="number" min="0" step="0.5" value="${employee.weeklyHours}" data-employee-id="${employee.id}" data-field="weeklyHours" /></td>
          <td><input type="number" min="0" step="0.5" value="${employee.remainingHours}" data-employee-id="${employee.id}" data-field="remainingHours" /></td>
          <td>
            <select data-employee-id="${employee.id}" data-field="preferredShiftId">
              <option value="">Keine Präferenz</option>
              ${state.shifts
                .map(
                  (shift) => `
                    <option value="${shift.id}" ${employee.preferredShiftId === shift.id ? "selected" : ""}>
                      ${shift.name}
                    </option>
                  `,
                )
                .join("")}
            </select>
          </td>
          <td>
            <select data-employee-id="${employee.id}" data-field="overtimePriority">
              ${[0, 1, 2, 3]
                .map(
                  (value) => `
                    <option value="${value}" ${employee.overtimePriority === value ? "selected" : ""}>${value}</option>
                  `,
                )
                .join("")}
            </select>
          </td>
          <td>
            <select data-employee-id="${employee.id}" data-field="planningPriority">
              ${[1, 2, 3]
                .map(
                  (value) => `
                    <option value="${value}" ${employee.planningPriority === value ? "selected" : ""}>${value}</option>
                  `,
                )
                .join("")}
            </select>
          </td>
          <td><button type="button" class="remove-button" data-remove-employee="${employee.id}">x</button></td>
        </tr>
      `;
    })
    .join("");

  refs.employeeTableBody.querySelectorAll("[data-employee-id]").forEach((input) => {
    input.addEventListener("change", onEmployeeFieldChange);
  });

  refs.employeeTableBody
    .querySelectorAll("[data-remove-employee]")
    .forEach((button) => {
      button.addEventListener("click", () => removeEmployee(button.dataset.removeEmployee));
    });
}

//??????
function renderScheduleTable() {
  const activeDays = getPlanningDays();
  refs.scheduleTableHead.innerHTML = `
    <tr>
      <th>Name</th>
      ${DAYS.map((day) => `<th>${day.label}</th>`).join("")}
      <th>Gesamte Stunden</th>
      <th>Saldo</th>
    </tr>
  `;

  refs.scheduleTableBody.innerHTML = state.employees
    .map((employee) => {
      const total = getAssignedHoursForEmployee(employee.id);
      const saldo = roundToHalfHour(total - employee.weeklyHours);
      return `
        <tr>
          <td class="schedule-name-cell">
            <strong>${escapeHtml(employee.name)}</strong>
            <div class="muted">${formatHours(employee.weeklyHours)} h Vertrag</div>
          </td>
          ${DAYS.map((day) => renderScheduleCell(employee, day.key, activeDays)).join("")}
          <td class="metric-cell">${formatHours(total)} h</td>
          <td class="metric-cell">${saldo >= 0 ? "+" : ""}${formatHours(saldo)} h</td>
        </tr>
      `;
    })
    .join("");

  refs.scheduleTableBody.querySelectorAll("[data-schedule-employee]").forEach((select) => {
    select.addEventListener("change", onManualScheduleChange);
  });
}

//?????????????
function renderScheduleCell(employee, dayKey, activeDays) {
  // ????ID????????????
  const cell = getScheduleCell(employee.id, dayKey);
  const options = buildAssignmentOptionsForDay(dayKey);
  const inactive = !activeDays.includes(dayKey);
  const optionMarkup = options
    .map(
      (option) => `
        <option value="${option.value}" ${cell.assignmentId === option.value ? "selected" : ""}>
          ${option.label}
        </option>
      `,
    )
    .join("");

  const classNames = [
    "assignment-select",
    `is-${cell.variant || "free"}`,
    cell.locked ? "is-manual" : "",
    inactive ? "is-closed" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return `
    <td>
      <div class="assignment-wrapper">
        <select
          class="${classNames}"
          data-schedule-employee="${employee.id}"
          data-schedule-day="${dayKey}"
          ${inactive ? "disabled" : ""}
        >
          ${optionMarkup}
        </select>
        <div class="assignment-meta">
          ${cell.locked ? '<span class="mini-tag manual">manuell fixiert</span>' : ""}
          ${
            cell.variant === "core"
              ? '<span class="mini-tag core">Kernzeit</span>'
              : ""
          }
        </div>
      </div>
    </td>
  `;
}

function renderSummaryCards() {
  const summary = state.summary;
  const cards = [
    { label: "Geplante Stunden", value: `${formatHours(summary.assignedHours || 0)} h` },
    { label: "Sollstunden Team", value: `${formatHours(summary.targetHours || 0)} h` },
    { label: "Deckungsquote", value: `${summary.coverageRate || 0}%` },
    { label: "Manuelle Sperren", value: String(summary.lockedAssignments || 0) },
  ];

  refs.summaryCards.innerHTML = cards
    .map(
      (card) => `
        <div class="stat-card">
          <span class="stat-label">${card.label}</span>
          <div class="stat-value">${card.value}</div>
        </div>
      `,
    )
    .join("");
}

function renderCoverageTable() {
  refs.coverageTableBody.innerHTML = state.shifts
    .map((shift) => {
      return `
        <tr>
          <td>${shift.name}</td>
          ${DAYS.map((day) => {
            const coverage = state.coverage[day.key]?.[shift.id] || {
              required: 0,
              assigned: 0,
            };
            const diff = coverage.assigned - coverage.required;
            const statusClass =
              diff === 0 ? "ok" : diff > 0 ? "warn" : "bad";
            return `
              <td>
                <span class="coverage-chip ${statusClass}">
                  ${coverage.assigned} / ${coverage.required}
                </span>
              </td>
            `;
          }).join("")}
        </tr>
      `;
    })
    .join("");
}

function renderManualAddPanel() {
  const employeeOptions = state.employees.map((employee) => ({
    value: employee.id,
    label: employee.name,
  }));
  const dayOptions = getPlanningDays().map((dayKey) => ({
    value: dayKey,
    label: findDayLabel(dayKey),
  }));
  const assignmentOptions = buildManualAddAssignmentOptions();

  syncManualAddFormState(employeeOptions, dayOptions, assignmentOptions);

  refs.manualAddEmployee.innerHTML = buildManualAddSelectMarkup(
    employeeOptions,
    state.manualAddForm.employeeId,
    "Mitarbeitende auswählen",
  );
  refs.manualAddDay.innerHTML = buildManualAddSelectMarkup(
    dayOptions,
    state.manualAddForm.dayKey,
    "Wochentag auswählen",
  );
  refs.manualAddAssignment.innerHTML = buildManualAddSelectMarkup(
    assignmentOptions,
    state.manualAddForm.assignmentId,
    "Schicht auswählen",
  );
  refs.manualAddButton.disabled = !isManualAddFormReady();
  renderManualAddFeedback();
}

function buildManualAddSelectMarkup(options, selectedValue, placeholder) {
  const rows = [
    {
      value: "",
      label: placeholder,
    },
    ...options,
  ];

  return rows
    .map(
      (option) => `
        <option value="${escapeAttr(option.value)}" ${option.value === selectedValue ? "selected" : ""}>
          ${escapeHtml(option.label)}
        </option>
      `,
    )
    .join("");
}

function buildManualAddAssignmentOptions() {
  const seen = new Set();
  const options = [];

  for (const day of DAYS) {
    for (const option of buildAssignmentOptionsForDay(day.key)) {
      if (!option.value || option.value === ASSIGNMENT_FREE || option.value === ASSIGNMENT_CLOSED) {
        continue;
      }
      if (seen.has(option.value)) continue;
      seen.add(option.value);
      options.push(option);
    }
  }

  return options;
}

function syncManualAddFormState(employeeOptions, dayOptions, assignmentOptions) {
  const ensureValue = (currentValue, options) => {
    if (!options.length) return "";
    if (options.some((option) => option.value === currentValue)) {
      return currentValue;
    }
    return options[0].value;
  };

  state.manualAddForm.employeeId = ensureValue(
    state.manualAddForm.employeeId,
    employeeOptions,
  );
  state.manualAddForm.dayKey = ensureValue(state.manualAddForm.dayKey, dayOptions);
  state.manualAddForm.assignmentId = ensureValue(
    state.manualAddForm.assignmentId,
    assignmentOptions,
  );
}

function renderManualAddFeedback() {
  const feedback = state.manualAddFeedback;
  if (!feedback) {
    refs.manualAddFeedback.className = "manual-add-feedback";
    refs.manualAddFeedback.textContent = "";
    return;
  }

  refs.manualAddFeedback.className = `manual-add-feedback is-${feedback.level}`;
  refs.manualAddFeedback.textContent = feedback.text;
}

function renderStatusMessages() {
  const messages =
    state.statusMessages.length > 0
      ? state.statusMessages
      : [{ level: "info", text: "Noch keine Hinweise. Bitte zuerst planen." }];

  refs.statusList.innerHTML = messages
    .map(
      (message) => `
        <div class="status-item ${message.level}">
          ${escapeHtml(message.text)}
        </div>
      `,
    )
    .join("");
}

function onShiftFieldChange(event) {
  const shiftId = event.target.dataset.shiftId;
  const field = event.target.dataset.field;
  const shift = state.shifts.find((entry) => entry.id === shiftId);
  if (!shift) return;

  shift[field] = field === "demand" ? Math.max(0, Number(event.target.value) || 0) : event.target.value;

  if (field === "demand") {
    for (const day of DAYS) {
      if (!state.demandOverrides[day.key]) {
        state.demandOverrides[day.key] = {};
      }
      if (state.demandOverrides[day.key][shift.id] === undefined) {
        state.demandOverrides[day.key][shift.id] = shift.demand;
      }
    }
  }

  renderShiftTable();
  renderDemandTable();
  renderManualAddPanel();
  validateAndReportStaticState();
}

function onDemandFieldChange(event) {
  const day = event.target.dataset.demandDay;
  const shiftId = event.target.dataset.demandShift;
  const value = Math.max(0, Number(event.target.value) || 0);
  state.demandOverrides[day][shiftId] = value;
  validateAndReportStaticState();
}

function onEmployeeFieldChange(event) {
  const employeeId = event.target.dataset.employeeId;
  const field = event.target.dataset.field;
  const employee = state.employees.find((entry) => entry.id === employeeId);
  if (!employee) return;

  if (field === "name") {
    employee.name = event.target.value;
  } else if (field === "preferredShiftId") {
    employee.preferredShiftId = event.target.value;
  } else if (field === "overtimePriority") {
    employee.overtimePriority = clamp(Number(event.target.value) || 0, 0, 3);
  } else if (field === "planningPriority") {
    employee.planningPriority = clamp(Number(event.target.value) || 1, 1, 3);
  } else {
    employee[field] = Math.max(0, Number(event.target.value) || 0);
  }

  renderEmployeeTable();
  renderManualAddPanel();
  validateAndReportStaticState();
}

function onManualAddFieldChange(event) {
  const field = event.target.dataset.manualAddField;
  if (!field) return;
  state.manualAddForm[field] = event.target.value;
  clearManualAddFeedback();
  renderManualAddPanel();
}

function onManualScheduleChange(event) {
  const employeeId = event.target.dataset.scheduleEmployee;
  const dayKey = event.target.dataset.scheduleDay;
  const assignmentId = event.target.value;
  const cell = getScheduleCell(employeeId, dayKey);

  cell.assignmentId = assignmentId;
  cell.variant = resolveVariantFromAssignmentId(assignmentId);
  cell.locked = true;
  cell.source = "manual";

  rebalanceAfterManualChange(employeeId, dayKey);
}

function onManualAddSubmit() {
  if (!isManualAddFormReady()) {
    setManualAddFeedback("error", "Bitte Name, Wochentag und Schicht vollständig auswählen.");
    renderManualAddPanel();
    return;
  }

  const { employeeId, dayKey, assignmentId } = state.manualAddForm;
  const employee = state.employees.find((entry) => entry.id === employeeId);
  const cell = getScheduleCell(employeeId, dayKey);

  if (!employee) {
    setManualAddFeedback("error", "Die ausgewählte Person konnte nicht gefunden werden.");
    renderManualAddPanel();
    return;
  }

  if (cell.assignmentId !== ASSIGNMENT_FREE) {
    setManualAddFeedback(
      "error",
      `${employee.name} hat am ${findDayLabel(dayKey)} bereits eine Schicht. Manuelle Ergänzungen sind nur für frei erlaubt.`,
    );
    renderManualAddPanel();
    return;
  }

  cell.assignmentId = assignmentId;
  cell.variant = resolveVariantFromAssignmentId(assignmentId);
  cell.locked = true;
  cell.source = "manual";

  setManualAddFeedback(
    "success",
    `${employee.name} wurde am ${findDayLabel(dayKey)} für ${findAssignmentLabel(assignmentId)} ergänzt.`,
  );
  refreshDerivedScheduleState();
}

function addShift() {
  const shiftId = `shift-${nextShiftId++}`;
  state.shifts.push(
    createShift({
      id: shiftId,
      name: `Neue Schicht ${state.shifts.length + 1}`,
      start: "08:00",
      end: "16:30",
      coreStart: "09:00",
      coreEnd: "15:30",
      demand: 1,
    }),
  );

  for (const day of DAYS) {
    if (!state.demandOverrides[day.key]) {
      state.demandOverrides[day.key] = {};
    }
    state.demandOverrides[day.key][shiftId] = 1;
  }

  renderAll();
}

function removeShift(shiftId) {
  state.shifts = state.shifts.filter((shift) => shift.id !== shiftId);

  for (const employee of state.employees) {
    if (employee.preferredShiftId === shiftId) {
      employee.preferredShiftId = "";
    }
  }

  for (const day of DAYS) {
    if (state.demandOverrides[day.key]) {
      delete state.demandOverrides[day.key][shiftId];
    }
  }

  for (const employeeId of Object.keys(state.schedule)) {
    for (const dayKey of Object.keys(state.schedule[employeeId])) {
      const cell = state.schedule[employeeId][dayKey];
      if (getShiftIdFromAssignmentId(cell.assignmentId) === shiftId) {
        state.schedule[employeeId][dayKey] = createEmptyCell();
      }
    }
  }

  renderAll();
}

function addEmployee() {
  state.employees.push(
    createEmployee({
      id: `emp-${nextEmployeeId++}`,
      name: `Neu ${state.employees.length + 1}`,
      weeklyHours: 20,
      remainingHours: 20,
      preferredShiftId: "",
      overtimePriority: 2,
      planningPriority: 1,
    }),
  );
  clearManualAddFeedback();
  renderAll();
}

function removeEmployee(employeeId) {
  state.employees = state.employees.filter((employee) => employee.id !== employeeId);
  delete state.schedule[employeeId];
  clearManualAddFeedback();
  renderAll();
}

function syncDemandToDefault() {
  ensureDemandShape();
  for (const day of DAYS) {
    for (const shift of state.shifts) {
      state.demandOverrides[day.key][shift.id] = shift.demand;
    }
  }
  renderDemandTable();
  validateAndReportStaticState();
}

function loadSampleData() {
  const next = createSampleData();
  state.mode = MODE_WEEK;
  state.selectedDay = "monday";
  state.activeDays = DAYS.reduce((acc, day) => {
    acc[day.key] = true;
    return acc;
  }, {});
  state.shifts = next.shifts;
  state.employees = next.employees;
  state.demandOverrides = next.demandOverrides;
  state.schedule = {};
  state.statusMessages = [];
  state.summary = {};
  state.coverage = {};
  resetManualAddState();
  renderAll();
  generateSchedule();
}

function exportJson() {
  const payload = {
    mode: MODE_WEEK,
    selectedDay: state.selectedDay,
    activeDays: state.activeDays,
    shifts: state.shifts,
    employees: state.employees,
    demandOverrides: state.demandOverrides,
    schedule: state.schedule,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "dienstplan-demo.json";
  link.click();
  URL.revokeObjectURL(url);
}

function importJson(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const payload = JSON.parse(String(reader.result));
      hydrateState(payload);
      renderAll();
      generateSchedule({ preserveManualLocks: true });
    } catch (error) {
      state.statusMessages = [
        {
          level: "error",
          text: "Die JSON-Datei konnte nicht gelesen werden. Bitte Format prüfen.",
        },
      ];
      renderStatusMessages();
    } finally {
      refs.importFileInput.value = "";
    }
  };
  reader.readAsText(file);
}

function hydrateState(payload) {
  state.mode = MODE_WEEK;
  state.selectedDay = DAYS.some((day) => day.key === payload.selectedDay)
    ? payload.selectedDay
    : "monday";
  state.activeDays = DAYS.reduce((acc, day) => {
    acc[day.key] = Boolean(payload.activeDays?.[day.key]);
    return acc;
  }, {});
  if (!Object.values(state.activeDays).some(Boolean)) {
    if (payload.mode === LEGACY_MODE_DAY && DAYS.some((day) => day.key === state.selectedDay)) {
      // 中文注释：兼容旧版“日模式”导入，把它映射成只启用单天的周计划。
      state.activeDays[state.selectedDay] = true;
    } else {
      for (const day of DAYS) {
        state.activeDays[day.key] = true;
      }
    }
  }
  state.shifts = (payload.shifts || []).map((shift) => createShift(shift));
  state.employees = (payload.employees || []).map((employee) =>
    createEmployee(employee),
  );
  state.demandOverrides = payload.demandOverrides || {};
  state.schedule = payload.schedule || {};
  ensureDemandShape();
  state.manualAddFeedback = null;
}

function resetManualLocks() {
  for (const employeeId of Object.keys(state.schedule)) {
    for (const dayKey of Object.keys(state.schedule[employeeId])) {
      state.schedule[employeeId][dayKey].locked = false;
      if (state.schedule[employeeId][dayKey].source === "manual") {
        state.schedule[employeeId][dayKey].source = "auto";
      }
    }
  }
  clearManualAddFeedback();
  generateSchedule({ preserveManualLocks: false });
}

function initializeSchedule(seedSchedule, preserveManualLocks) {
  const nextSchedule = {};
  for (const employee of state.employees) {
    nextSchedule[employee.id] = {};
    for (const day of DAYS) {
      const existing = seedSchedule?.[employee.id]?.[day.key];
      if (existing && existing.locked && preserveManualLocks) {
        nextSchedule[employee.id][day.key] = {
          assignmentId: existing.assignmentId,
          variant: resolveVariantFromAssignmentId(existing.assignmentId),
          locked: true,
          source: existing.source || "manual",
        };
      } else {
        nextSchedule[employee.id][day.key] = createEmptyCell();
      }
    }
  }
  return nextSchedule;
}

function assignTask(employeeStats, employeeId, dayKey, assignmentId, source) {
  const stat = employeeStats.find((entry) => entry.employee.id === employeeId);
  const cell = getScheduleCell(employeeId, dayKey);
  const hours = getHoursForAssignmentId(assignmentId);

  if (!stat) return;

  if (cell.assignmentId !== ASSIGNMENT_FREE && cell.assignmentId !== ASSIGNMENT_CLOSED) {
    const previousHours = getHoursForAssignmentId(cell.assignmentId);
    stat.assignedHours = roundToHalfHour(stat.assignedHours - previousHours);
  }

  cell.assignmentId = assignmentId;
  cell.variant = resolveVariantFromAssignmentId(assignmentId);
  if (!cell.locked) {
    cell.source = source;
  }
  stat.assignedHours = roundToHalfHour(stat.assignedHours + hours);
}

function validateAndReportStaticState() {
  state.statusMessages = validateStaticConfig();
  renderStatusMessages();
}

function buildCoverageMap(planningDays) {
  const coverage = {};
  for (const day of DAYS) {
    coverage[day.key] = {};
    for (const shift of state.shifts) {
      const required = planningDays.includes(day.key) ? getDemandValue(day.key, shift.id) : 0;
      const assigned = planningDays.includes(day.key)
        ? countAssignments(day.key, shift.id)
        : 0;
      coverage[day.key][shift.id] = { required, assigned };
    }
  }
  return coverage;
}

function summarizeCoverage(coverage, planningDays) {
  let required = 0;
  let assigned = 0;

  for (const dayKey of planningDays) {
    for (const shift of state.shifts) {
      const item = coverage[dayKey]?.[shift.id];
      if (!item) continue;
      required += item.required;
      assigned += Math.min(item.assigned, item.required);
    }
  }

  return {
    coverageRate: required === 0 ? 100 : Math.round((assigned / required) * 100),
  };
}

function buildEmptySummary() {
  return {
    assignedHours: 0,
    targetHours: 0,
    coverageRate: 0,
    lockedAssignments: 0,
  };
}

function getPlanningDays() {
  return DAYS.filter((day) => state.activeDays[day.key]).map((day) => day.key);
}

function buildAssignmentOptionsForDay(dayKey) {
  const inactive = !getPlanningDays().includes(dayKey);
  const options = [
    {
      value: inactive ? ASSIGNMENT_CLOSED : ASSIGNMENT_FREE,
      label: inactive ? "geschlossen" : "frei",
    },
  ];

  for (const shift of state.shifts) {
    options.push({
      value: `${shift.id}::full`,
      label: `${shift.name} (voll)`,
    });
    if (netHoursBetween(shift.coreStart, shift.coreEnd) < netHoursBetween(shift.start, shift.end)) {
      options.push({
        value: `${shift.id}::core`,
        label: `${shift.name} (Kernzeit)`,
      });
    }
  }

  return options;
}

function isManualAddFormReady() {
  const { employeeId, dayKey, assignmentId } = state.manualAddForm;
  return Boolean(employeeId && dayKey && assignmentId);
}

function setManualAddFeedback(level, text) {
  state.manualAddFeedback = { level, text };
}

function clearManualAddFeedback() {
  state.manualAddFeedback = null;
}

function resetManualAddState() {
  state.manualAddForm = {
    employeeId: "",
    dayKey: "",
    assignmentId: "",
  };
  clearManualAddFeedback();
}

//?????????????????????
function getScheduleCell(employeeId, dayKey) {
  if (!state.schedule[employeeId]) {
    state.schedule[employeeId] = {};
  }
  if (!state.schedule[employeeId][dayKey]) {
    state.schedule[employeeId][dayKey] = createEmptyCell();
  }
  return state.schedule[employeeId][dayKey];
}

function createEmptyCell() {
  return {
    assignmentId: ASSIGNMENT_FREE,
    variant: "free",
    locked: false,
    source: "auto",
  };
}

function getDemandValue(dayKey, shiftId) {
  const fallbackShift = state.shifts.find((shift) => shift.id === shiftId);
  return Number(state.demandOverrides?.[dayKey]?.[shiftId] ?? fallbackShift?.demand ?? 0) || 0;
}

function ensureDemandShape() {
  for (const day of DAYS) {
    if (!state.demandOverrides[day.key]) {
      state.demandOverrides[day.key] = {};
    }
    for (const shift of state.shifts) {
      if (state.demandOverrides[day.key][shift.id] === undefined) {
        state.demandOverrides[day.key][shift.id] = shift.demand;
      }
    }
  }
}

function getShiftIdFromAssignmentId(assignmentId) {
  if (!assignmentId || assignmentId === ASSIGNMENT_FREE || assignmentId === ASSIGNMENT_CLOSED) {
    return "";
  }
  return assignmentId.split("::")[0];
}

function resolveVariantFromAssignmentId(assignmentId) {
  if (!assignmentId || assignmentId === ASSIGNMENT_FREE) return "free";
  if (assignmentId === ASSIGNMENT_CLOSED) return "closed";
  return assignmentId.endsWith("::core") ? "core" : "full";
}

function getHoursForAssignmentId(assignmentId) {
  const shiftId = getShiftIdFromAssignmentId(assignmentId);
  const shift = state.shifts.find((entry) => entry.id === shiftId);
  if (!shift) return 0;
  if (assignmentId.endsWith("::core")) {
    return netHoursBetween(shift.coreStart, shift.coreEnd);
  }
  return netHoursBetween(shift.start, shift.end);
}

function netHoursBetween(start, end) {
  return roundToHalfHour(Math.max(0, (diffMinutes(start, end) - 30) / 60));
}

function diffMinutes(start, end) {
  return Math.max(0, toMinutes(end) - toMinutes(start));
}

function toMinutes(value) {
  const [hours, minutes] = String(value).split(":").map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

function isCoreInsideShift(shift) {
  const start = toMinutes(shift.start);
  const end = toMinutes(shift.end);
  const coreStart = toMinutes(shift.coreStart);
  const coreEnd = toMinutes(shift.coreEnd);
  return coreStart >= start && coreEnd <= end && coreStart < coreEnd;
}

function getAssignedHoursForEmployee(employeeId) {
  return roundToHalfHour(
    DAYS.reduce((sum, day) => {
      const cell = getScheduleCell(employeeId, day.key);
      return sum + getHoursForAssignmentId(cell.assignmentId);
    }, 0),
  );
}

function getLockedAssignedHours(employeeId) {
  return roundToHalfHour(
    DAYS.reduce((sum, day) => {
      const cell = getScheduleCell(employeeId, day.key);
      if (!cell.locked) return sum;
      return sum + getHoursForAssignmentId(cell.assignmentId);
    }, 0),
  );
}

function getEmployeeRemainingFromSchedule(employeeId) {
  const employee = state.employees.find((entry) => entry.id === employeeId);
  if (!employee) return 0;
  const remaining = roundToHalfHour(employee.remainingHours - getAssignedHoursForEmployee(employeeId));
  return remaining;
}

function hasAssignment(employeeId, dayKey) {
  const assignmentId = getScheduleCell(employeeId, dayKey).assignmentId;
  return assignmentId !== ASSIGNMENT_FREE && assignmentId !== ASSIGNMENT_CLOSED;
}

function isEmployeeAvailable(employeeId, dayKey) {
  const cell = getScheduleCell(employeeId, dayKey);
  if (cell.locked) {
    return false;
  }
  return getPlanningDays().includes(dayKey);
}

function findLockedOwnerForTask(dayKey, assignmentId) {
  return state.employees.find((employee) => {
    const cell = getScheduleCell(employee.id, dayKey);
    return cell.locked && cell.assignmentId === assignmentId;
  })?.id;
}

function countAssignments(dayKey, shiftId) {
  return state.employees.filter((employee) => {
    const assignment = getShiftIdFromAssignmentId(getScheduleCell(employee.id, dayKey).assignmentId);
    return assignment === shiftId;
  }).length;
}

function countLockedAssignments() {
  let count = 0;
  for (const employee of state.employees) {
    for (const day of DAYS) {
      if (getScheduleCell(employee.id, day.key).locked) {
        count += 1;
      }
    }
  }
  return count;
}

function getDaySpacingBonus(employeeId, dayKey) {
  const dayIndex = DAYS.findIndex((day) => day.key === dayKey);
  const prevDay = DAYS[dayIndex - 1]?.key;
  const nextDay = DAYS[dayIndex + 1]?.key;
  let bonus = 0;
  if (prevDay && !hasAssignment(employeeId, prevDay)) bonus += 1;
  if (nextDay && !hasAssignment(employeeId, nextDay)) bonus += 1;
  return bonus;
}

function randomChoice(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function findDayLabel(dayKey) {
  return DAYS.find((day) => day.key === dayKey)?.label || dayKey;
}

function roundToHalfHour(value) {
  return Math.round(value * 2) / 2;
}

function formatHours(value) {
  return Number(value).toFixed(Number.isInteger(value) ? 0 : 1);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function cloneSchedule(schedule) {
  return JSON.parse(JSON.stringify(schedule || {}));
}

function findAssignmentLabel(assignmentId) {
  for (const day of DAYS) {
    const option = buildAssignmentOptionsForDay(day.key).find(
      (entry) => entry.value === assignmentId,
    );
    if (option) return option.label;
  }
  return assignmentId;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}

function findDuplicates(items) {
  const counts = new Map();
  for (const item of items) {
    counts.set(item, (counts.get(item) || 0) + 1);
  }
  return [...counts.entries()].filter(([, count]) => count > 1).map(([name]) => name);
}

// V2 scheduling engine.
function generateSchedule(options = {}) {
  const { preserveManualLocks = true } = options;
  ensureDemandShape();
  state.generationRevision += 1;

  const planningDays = getPlanningDays();
  const seedSchedule = preserveManualLocks ? cloneSchedule(state.schedule) : {};
  state.schedule = initializeSchedule(seedSchedule, preserveManualLocks);
  const staticMessages = validateStaticConfig();

  if (planningDays.length === 0) {
    state.statusMessages = [
      ...staticMessages,
      {
        level: "warn",
        text: "Es ist kein Planungstag aktiv. Bitte mindestens einen Tag wählen.",
      },
    ];
    state.summary = buildEmptySummary();
    state.coverage = buildCoverageMap([]);
    renderAll();
    return;
  }

  if (hasBlockingMessages(staticMessages)) {
    state.statusMessages = staticMessages;
    state.summary = buildEmptySummary();
    state.coverage = buildCoverageMap([]);
    renderAll();
    return;
  }

  const engine = createSchedulingEngineContext(planningDays);
  const employeeStats = createEmployeeStats();
  runSchedulingEngine(employeeStats, engine);
  updateSummaryAndMessages(employeeStats, staticMessages, planningDays, engine);
  renderAll();
}

function createEmployeeStats() {
  return state.employees.map((employee) => {
    const lockedHours = getLockedAssignedHours(employee.id);
    const baseline = Math.max(employee.remainingHours, lockedHours);
    return {
      employee,
      assignedHours: lockedHours,
      hardCap: baseline,
      softTarget: baseline,
      overtimeCapacity: 0,
      dayPriority: 0,
      criticalGap: 0,
      reservedForPreferredShift: false,
    };
  });
}

function allocateOvertimeCapacity(employeeStats, missingHours) {
  let remaining = roundToHalfHour(missingHours);
  for (const priority of [3, 2, 1]) {
    const group = employeeStats
      .filter((entry) => entry.employee.overtimePriority === priority)
      .sort((left, right) => left.employee.name.localeCompare(right.employee.name));

    for (const entry of group) {
      if (remaining <= 0) break;
      const capacity = Math.min(remaining, 8);
      entry.overtimeCapacity = roundToHalfHour(entry.overtimeCapacity + capacity);
      entry.hardCap = roundToHalfHour(entry.hardCap + capacity);
      remaining = roundToHalfHour(remaining - capacity);
    }
  }
}

function rebalanceAfterManualChange(employeeId, dayKey) {
  generateSchedule({ preserveManualLocks: true });
}

function refreshDerivedScheduleState() {
  const planningDays = getPlanningDays();
  const staticMessages = validateStaticConfig();

  if (planningDays.length === 0) {
    state.statusMessages = [
      ...staticMessages,
      {
        level: "warn",
        text: "Es ist kein Planungstag aktiv. Bitte mindestens einen Tag wählen.",
      },
    ];
    state.summary = buildEmptySummary();
    state.coverage = buildCoverageMap([]);
    renderAll();
    return;
  }

  if (hasBlockingMessages(staticMessages)) {
    state.statusMessages = staticMessages;
    state.summary = buildEmptySummary();
    state.coverage = buildCoverageMap([]);
    renderAll();
    return;
  }

  const engine = createSchedulingEngineContext(planningDays);
  const employeeStats = createEmployeeStats();
  updateSummaryAndMessages(employeeStats, staticMessages, planningDays, engine);
  renderAll();
}

function updateSummaryAndMessages(employeeStats, staticMessages, planningDays, engine) {
  const coverage = buildCoverageMap(planningDays);
  const coverageStats = summarizeCoverage(coverage, planningDays);
  const assignedHours = state.employees.reduce(
    (sum, employee) => sum + getAssignedHoursForEmployee(employee.id),
    0,
  );
  const targetHours = planningDays.reduce((sum, dayKey) => {
    return (
      sum +
      state.shifts.reduce((daySum, shift) => {
        return daySum + getDemandValue(dayKey, shift.id) * getShiftFullHours(shift.id);
      }, 0)
    );
  }, 0);
  const lockedAssignments = countLockedAssignments();
  const criticalGapTotal = getTotalCriticalGapCount(engine);

  state.coverage = coverage;
  state.summary = {
    assignedHours: roundToHalfHour(assignedHours),
    targetHours: roundToHalfHour(targetHours),
    coverageRate: coverageStats.coverageRate,
    lockedAssignments,
  };

  const dynamicMessages = [];

  for (const employee of state.employees) {
    const assigned = getAssignedHoursForEmployee(employee.id);
    const delta = roundToHalfHour(assigned - employee.remainingHours);
    if (delta > 0) {
      dynamicMessages.push({
        level: employee.overtimePriority === 0 ? "error" : "warn",
        text: `${employee.name} liegt ${formatHours(delta)} h über den verfügbaren Wochenstunden.`,
      });
    } else if (delta < -4) {
      dynamicMessages.push({
        level: "info",
        text: `${employee.name} liegt ${formatHours(Math.abs(delta))} h unter den verfügbaren Wochenstunden.`,
      });
    }
  }

  for (const dayKey of planningDays) {
    for (const shift of state.shifts) {
      const item = coverage[dayKey]?.[shift.id];
      if (!item) continue;

      const role = getRoleFromShiftId(shift.id, engine);
      if (item.assigned < item.required) {
        if (role === "middle" && criticalGapTotal > 0) {
          continue;
        }
        dynamicMessages.push({
          level: "error",
          text: `${findDayLabel(dayKey)}: ${shift.name} ist mit ${item.assigned}/${item.required} unterbesetzt.`,
        });
      } else if (item.assigned > item.required) {
        dynamicMessages.push({
          level: "warn",
          text: `${findDayLabel(dayKey)}: ${shift.name} ist mit ${item.assigned}/${item.required} überplant.`,
        });
      }
    }
  }

  if (staticMessages.length === 0 && dynamicMessages.length === 0) {
    dynamicMessages.push({
      level: "info",
      text: "Der Dienstplan ist ohne erkennbare Regelverletzung erzeugt worden.",
    });
  }

  state.statusMessages = [...staticMessages, ...dynamicMessages];
}

function validateStaticConfig() {
  const messages = [];
  const inspection = inspectFixedShiftRoles();

  for (const shift of state.shifts) {
    const fullMinutes = diffMinutes(shift.start, shift.end);
    const coreMinutes = diffMinutes(shift.coreStart, shift.coreEnd);

    if (fullMinutes <= 30) {
      messages.push({
        level: "error",
        blocking: true,
        text: `${shift.name}: Die Schichtdauer muss länger als 30 Minuten sein.`,
      });
    }

    if (coreMinutes <= 30) {
      messages.push({
        level: "error",
        blocking: true,
        text: `${shift.name}: Die Kernzeit muss länger als 30 Minuten sein.`,
      });
    }

    if (!isCoreInsideShift(shift)) {
      messages.push({
        level: "error",
        blocking: true,
        text: `${shift.name}: Die Kernzeit muss innerhalb der Schicht liegen.`,
      });
    }
  }

  const requiredRoles = [
    ["early", "Frühschicht"],
    ["middle", "Mittelschicht"],
    ["late", "Spätschicht"],
  ];

  for (const [role, label] of requiredRoles) {
    const count = inspection[role].length;
    if (count === 0) {
      messages.push({
        level: "error",
        blocking: true,
        text: `${label} ist erforderlich, damit die V2-Planung gestartet werden kann.`,
      });
    } else if (count > 1) {
      messages.push({
        level: "error",
        blocking: true,
        text: `${label} darf in der V2-Planung nur einmal vorkommen.`,
      });
    }
  }

  if (inspection.unknown.length > 0) {
    messages.push({
      level: "error",
      blocking: true,
      text: `Nur Frühschicht, Mittelschicht und Spätschicht werden in der V2-Planung unterstützt. Nicht erkannt: ${inspection.unknown
        .map((shift) => shift.name)
        .join(", ")}.`,
    });
  }

  const duplicateNames = findDuplicates(
    state.employees.map((employee) => employee.name.trim()).filter(Boolean),
  );
  if (duplicateNames.length > 0) {
    messages.push({
      level: "warn",
      text: `Doppelte Mitarbeitenden-Namen erkannt: ${duplicateNames.join(", ")}.`,
    });
  }

  if (state.shifts.length === 0) {
    messages.push({
      level: "error",
      blocking: true,
      text: "Mindestens eine Schicht ist erforderlich.",
    });
  }

  if (state.employees.length === 0) {
    messages.push({
      level: "error",
      blocking: true,
      text: "Mindestens eine mitarbeitende Person ist erforderlich.",
    });
  }

  return messages;
}

function runSchedulingEngine(employeeStats, engine) {
  runCriticalFullPhase(employeeStats, engine, { allowOvertime: false });
  repairCriticalCoverage(employeeStats, engine, {
    allowCoreFallback: false,
    allowOvertime: false,
  });

  if (getTotalCriticalGapCount(engine) > 0) {
    repackTwentyHourCriticalAssignments(employeeStats, engine);
    runCriticalCoreFallbackPhase(employeeStats, engine, { allowOvertime: false });
    repairCriticalCoverage(employeeStats, engine, {
      allowCoreFallback: true,
      allowOvertime: false,
    });
  }

  if (getTotalCriticalGapCount(engine) > 0) {
    allocateOvertimeCapacity(employeeStats, getRemainingCriticalDemandHours(engine));
    runCriticalFullPhase(employeeStats, engine, { allowOvertime: true });
    repairCriticalCoverage(employeeStats, engine, {
      allowCoreFallback: false,
      allowOvertime: true,
    });
    repackTwentyHourCriticalAssignments(employeeStats, engine);
    runCriticalCoreFallbackPhase(employeeStats, engine, { allowOvertime: true });
    repairCriticalCoverage(employeeStats, engine, {
      allowCoreFallback: true,
      allowOvertime: true,
    });
  }

  if (getTotalCriticalGapCount(engine) === 0) {
    const surplusHours = calculateMiddlePhaseSurplus(employeeStats, engine);
    if (surplusHours > 0) {
      applySoftTargetReduction(employeeStats, surplusHours);
    }
  }

  runMiddlePhase(employeeStats, engine);
  runGlobalRepairPhase(employeeStats, engine);
  normalizeAllDays(employeeStats, engine);
}

function createSchedulingEngineContext(planningDays) {
  const roleMap = getRequiredShiftRoleMap();
  const orderedDays = sortPlanningDaysByPriority(planningDays, roleMap);
  return {
    planningDays: [...planningDays],
    orderedDays,
    roleMap,
    roleDiagnostics: buildWeeklyRoleDiagnostics(planningDays, roleMap),
    dayPriority: Object.fromEntries(
      orderedDays.map((dayKey, index) => [dayKey, index]),
    ),
  };
}

function inspectFixedShiftRoles() {
  const buckets = {
    early: [],
    middle: [],
    late: [],
    unknown: [],
  };

  for (const shift of state.shifts) {
    const role = getFixedShiftRole(shift.name);
    if (!role) {
      buckets.unknown.push(shift);
    } else {
      buckets[role].push(shift);
    }
  }

  return buckets;
}

function getRequiredShiftRoleMap() {
  const inspection = inspectFixedShiftRoles();
  return {
    early: inspection.early[0] || null,
    middle: inspection.middle[0] || null,
    late: inspection.late[0] || null,
  };
}

function getFixedShiftRole(value) {
  const normalized = normalizeShiftName(value);
  if (normalized === "fruehschicht" || normalized === "fruhschicht") {
    return "early";
  }
  if (normalized === "mittelschicht" || normalized === "mitteschicht") {
    return "middle";
  }
  if (normalized === "spaetschicht" || normalized === "spatschicht") {
    return "late";
  }
  return "";
}

function normalizeShiftName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replaceAll("ä", "ae")
    .replaceAll("ö", "oe")
    .replaceAll("ü", "ue")
    .replaceAll("ß", "ss");
}

function sortPlanningDaysByPriority(planningDays, roleMap) {
  return [...planningDays].sort((left, right) => {
    const hoursDiff =
      getDayDemandHours(right, roleMap) - getDayDemandHours(left, roleMap);
    if (hoursDiff !== 0) return hoursDiff;
    return compareDayFallbackPriority(left, right);
  });
}

function getDayDemandHours(dayKey, roleMap) {
  return ["early", "middle", "late"].reduce((sum, role) => {
    const shift = roleMap[role];
    if (!shift) return sum;
    return sum + getDemandValue(dayKey, shift.id) * getShiftFullHours(shift.id);
  }, 0);
}

function compareDayFallbackPriority(leftDayKey, rightDayKey) {
  const priority = [
    "saturday",
    "friday",
    "thursday",
    "wednesday",
    "tuesday",
    "monday",
  ];
  return priority.indexOf(leftDayKey) - priority.indexOf(rightDayKey);
}

// 周级供需诊断：先判断每个固定角色是否存在结构性缺口，
// 后续评分再决定偏好应保护到什么程度。
function buildWeeklyRoleDiagnostics(planningDays, roleMap) {
  const diagnostics = {};

  for (const role of ["early", "middle", "late"]) {
    const shift = roleMap[role];
    if (!shift) {
      diagnostics[role] = {
        role,
        shiftId: "",
        weeklyDemandHours: 0,
        preferredSupplyHours: 0,
        flexibleSupplyHours: 0,
        shortageHours: 0,
        shortageRatio: 0,
      };
      continue;
    }

    const weeklyDemandHours = roundToHalfHour(
      planningDays.reduce((sum, dayKey) => {
        return sum + getDemandValue(dayKey, shift.id) * getShiftFullHours(shift.id);
      }, 0),
    );
    const preferredSupplyHours = roundToHalfHour(
      state.employees
        .filter((employee) => employee.preferredShiftId === shift.id)
        .reduce((sum, employee) => sum + employee.remainingHours, 0),
    );
    const flexibleSupplyHours = roundToHalfHour(
      state.employees
        .filter((employee) => employee.preferredShiftId !== shift.id)
        .reduce((sum, employee) => sum + employee.remainingHours, 0),
    );
    const shortageHours = Math.max(
      0,
      roundToHalfHour(weeklyDemandHours - preferredSupplyHours),
    );
    const shortageRatio =
      weeklyDemandHours === 0 ? 0 : shortageHours / weeklyDemandHours;

    diagnostics[role] = {
      role,
      shiftId: shift.id,
      weeklyDemandHours,
      preferredSupplyHours,
      flexibleSupplyHours,
      shortageHours,
      shortageRatio,
    };
  }

  return diagnostics;
}

function getRoleShortageRatio(role, engine) {
  return engine.roleDiagnostics?.[role]?.shortageRatio || 0;
}

function getRoleShortageHours(role, engine) {
  return engine.roleDiagnostics?.[role]?.shortageHours || 0;
}

function runCriticalFullPhase(employeeStats, engine, options = {}) {
  for (const dayKey of engine.orderedDays) {
    const queue = buildAlternatingCriticalRoleQueue(dayKey, engine);
    for (const role of queue) {
      const task = createRoleTask(dayKey, role, "full", "critical-full", engine);
      if (!task) continue;
      const candidate = selectBestCandidate(employeeStats, task, engine, options);
      if (candidate) {
        assignTask(employeeStats, candidate.employee.id, dayKey, task.assignmentId, "auto");
      }
    }
  }
}

function runCriticalCoreFallbackPhase(employeeStats, engine, options = {}) {
  for (const dayKey of engine.orderedDays) {
    const queue = buildAlternatingCriticalRoleQueue(dayKey, engine);
    for (const role of queue) {
      const task = createRoleTask(dayKey, role, "core", "critical-core", engine);
      if (!task) continue;
      const candidate = selectBestCandidate(employeeStats, task, engine, options);
      if (candidate) {
        assignTask(employeeStats, candidate.employee.id, dayKey, task.assignmentId, "auto");
      }
    }
  }
}

function runMiddlePhase(employeeStats, engine) {
  for (const dayKey of engine.orderedDays) {
    if (getDayCriticalGapCount(dayKey, engine) > 0) continue;

    const middleShift = engine.roleMap.middle;
    const remaining = getGapCount(dayKey, middleShift.id);

    for (let index = 0; index < remaining; index += 1) {
      const task = createRoleTask(dayKey, "middle", "full", "middle", engine);
      const candidate = selectBestCandidate(employeeStats, task, engine, {
        allowOvertime: false,
      });
      if (!candidate) break;
      assignTask(employeeStats, candidate.employee.id, dayKey, task.assignmentId, "auto");
    }
  }
}

function runExactFitCoreCloseoutPhase(employeeStats, engine, options = {}) {
  for (const dayKey of engine.orderedDays) {
    for (const role of ["early", "late", "middle"]) {
      while (getRoleGapCount(dayKey, role, engine) > 0) {
        const task = createRoleTask(dayKey, role, "core", "core-closeout", engine);
        if (!task) break;

        const candidate = selectBestCandidate(employeeStats, task, engine, options);
        if (!candidate) break;

        assignTask(employeeStats, candidate.employee.id, dayKey, task.assignmentId, "auto");
      }
    }
  }
}

function runGlobalRepairPhase(employeeStats, engine) {
  runExactFitCoreCloseoutPhase(employeeStats, engine, { allowOvertime: false });
  repairCriticalCoverage(employeeStats, engine, {
    allowCoreFallback: true,
    allowOvertime: true,
  });
}

function buildAlternatingCriticalRoleQueue(dayKey, engine) {
  const queue = [];
  let earlyRemaining = getRoleGapCount(dayKey, "early", engine);
  let lateRemaining = getRoleGapCount(dayKey, "late", engine);

  while (earlyRemaining > 0 || lateRemaining > 0) {
    if (earlyRemaining > 0) {
      queue.push("early");
      earlyRemaining -= 1;
    }
    if (lateRemaining > 0) {
      queue.push("late");
      lateRemaining -= 1;
    }
  }

  return queue;
}

function createRoleTask(dayKey, role, variant, stage, engine) {
  const shift = engine.roleMap[role];
  if (!shift) return null;
  if (variant === "core" && !canShiftUseCore(shift.id)) {
    return null;
  }

  const assignmentId = `${shift.id}::${variant}`;
  return {
    dayKey,
    role,
    shiftId: shift.id,
    stage,
    variant,
    assignmentId,
    hours: getHoursForAssignmentId(assignmentId),
  };
}

function canShiftUseCore(shiftId) {
  const fullHours = getShiftFullHours(shiftId);
  const coreHours = getShiftCoreHours(shiftId);
  return coreHours > 0 && coreHours < fullHours;
}

function selectBestCandidate(employeeStats, task, engine, options = {}) {
  let candidates = employeeStats.filter((entry) =>
    canTakeTask(entry, task, engine, options),
  );

  if (task.stage !== "middle") {
    const nonReserved = candidates.filter(
      (entry) => !isReservedForMiddleShift(employeeStats, entry, task.dayKey, engine),
    );
    if (nonReserved.length > 0) {
      candidates = nonReserved;
    }
  }

  if (options.allowOvertime) {
    const regularHourCandidates = candidates.filter((entry) =>
      staysWithinRegularHours(entry, task),
    );
    if (regularHourCandidates.length > 0) {
      candidates = regularHourCandidates;
    }
  }

  if (candidates.length === 0) return null;

  const scored = candidates
    .map((entry) => ({
      entry,
      score: getTaskScore(entry, task, engine),
    }))
    .sort((left, right) => right.score - left.score);

  const topScore = scored[0].score;
  const topCandidates = scored.filter((candidate) => candidate.score === topScore);
  return randomChoice(topCandidates).entry;
}

function canTakeTask(entry, task, engine, options = {}) {
  if (!isEmployeeAvailable(entry.employee.id, task.dayKey)) return false;
  if (hasAssignment(entry.employee.id, task.dayKey)) return false;

  const nextHours = roundToHalfHour(entry.assignedHours + task.hours);
  const remainingBudget = roundToHalfHour(entry.employee.remainingHours - entry.assignedHours);

  if (task.stage === "middle") {
    const middleCap = Math.max(entry.employee.remainingHours, entry.assignedHours);
    return nextHours <= roundToHalfHour(middleCap);
  }

  if (task.stage === "critical-core" || task.stage === "core-closeout") {
    if (!canShiftUseCore(task.shiftId)) return false;

    if (task.stage === "core-closeout") {
      if (remainingBudget <= 0) return false;
      return nextHours <= roundToHalfHour(entry.hardCap);
    }

    if (remainingBudget < task.hours - 1 && !options.allowOvertime) {
      return false;
    }
  }

  if (options.allowOvertime) {
    return nextHours <= roundToHalfHour(entry.hardCap);
  }

  return nextHours <= roundToHalfHour(entry.employee.remainingHours);
}

function staysWithinRegularHours(entry, task) {
  const nextHours = roundToHalfHour(entry.assignedHours + task.hours);
  return nextHours <= roundToHalfHour(entry.employee.remainingHours);
}

function getTaskScore(entry, task, engine) {
  if (task.stage === "middle") {
    return scoreMiddleTask(entry.employee, entry, task, engine);
  }
  if (task.stage === "critical-core" || task.stage === "core-closeout") {
    return scoreCoreFallbackTask(entry.employee, entry, task, engine);
  }
  return scoreCriticalFullTask(entry.employee, entry, task, engine);
}

function scoreCriticalFullTask(employee, entry, task, engine) {
  const preferredShiftId = employee.preferredShiftId;
  const nextHours = roundToHalfHour(entry.assignedHours + task.hours);
  const softRemaining = roundToHalfHour(entry.softTarget - entry.assignedHours);
  const overtimeHours = Math.max(0, nextHours - employee.remainingHours);
  const planningPressure = getPlanningPressure(entry, engine);
  const shortageRatio = getRoleShortageRatio(task.role, engine);
  let score = 0;

  if (preferredShiftId === task.shiftId) {
    score += 170 + employee.planningPriority * 20 + shortageRatio * 90;
  } else if (!preferredShiftId) {
    score += 135 + shortageRatio * 120;
  } else {
    score += 25 + shortageRatio * 170;
  }

  if (employee.weeklyHours > 20) {
    score += 18;
  }

  if (softRemaining >= task.hours) {
    score += Math.max(0, 80 - Math.abs(softRemaining - task.hours) * 3);
  } else {
    score -= Math.abs(softRemaining - task.hours) * 6;
  }

  if (overtimeHours > 0) {
    score -= 90 + overtimeHours * 5;
    score += employee.overtimePriority * 18;
  } else {
    score += 70;
  }

  score += planningPressure * 34;
  score += Math.max(0, employee.remainingHours - entry.assignedHours) * 1.5;

  score += getDaySpacingBonus(employee.id, task.dayKey) * 8;
  score += Math.max(0, 24 - countWorkedDays(employee.id) * 4);
  score += Math.random() * 3;

  return score;
}

function scoreMiddleTask(employee, entry, task, engine) {
  const preferredShiftId = employee.preferredShiftId;
  const softRemaining = roundToHalfHour(entry.softTarget - entry.assignedHours);
  const planningPressure = getPlanningPressure(entry, engine);
  const middleShortageRatio = getRoleShortageRatio("middle", engine);
  let score = 0;

  if (preferredShiftId === task.shiftId) {
    score += 220 + employee.planningPriority * 22 + middleShortageRatio * 60;
  } else if (!preferredShiftId) {
    score += 95 + middleShortageRatio * 40;
  } else {
    score += 30 + middleShortageRatio * 20;
  }

  if (getDayCriticalGapCount(task.dayKey, engine) > 0) {
    score -= 140;
  }

  if (softRemaining >= task.hours) {
    score += Math.max(0, 60 - Math.abs(softRemaining - task.hours) * 3);
  } else {
    score -= Math.abs(softRemaining - task.hours) * 8;
  }

  score += planningPressure * 18;
  score += getDaySpacingBonus(employee.id, task.dayKey) * 6;
  score += Math.random() * 2;
  return score;
}

function scoreCoreFallbackTask(employee, entry, task, engine) {
  const preferredShiftId = employee.preferredShiftId;
  const softRemaining = roundToHalfHour(entry.softTarget - entry.assignedHours);
  const overtimeHours = Math.max(
    0,
    roundToHalfHour(entry.assignedHours + task.hours - employee.remainingHours),
  );
  const remainingBudget = roundToHalfHour(employee.remainingHours - entry.assignedHours);
  const planningPressure = getPlanningPressure(entry, engine);
  const shortageRatio = getRoleShortageRatio(task.role, engine);
  const exactFitPenalty = Math.abs(remainingBudget - task.hours);
  let score = 0;

  if (preferredShiftId === task.shiftId) {
    score += 185 + employee.planningPriority * 20 + shortageRatio * 90;
  } else if (!preferredShiftId) {
    score += 120 + shortageRatio * 110;
  } else {
    score += 45 + shortageRatio * 140;
  }

  if (softRemaining >= task.hours) {
    score += Math.max(0, 70 - Math.abs(softRemaining - task.hours) * 2);
  } else {
    score -= Math.abs(softRemaining - task.hours) * 5;
  }

  if (overtimeHours > 0) {
    score -= 80 + overtimeHours * 5;
    score += employee.overtimePriority * 18;
  } else {
    score += 60;
  }

  if (task.stage === "core-closeout") {
    score += Math.max(0, 120 - exactFitPenalty * 20);
  } else {
    score += Math.max(0, 70 - exactFitPenalty * 10);
  }

  score += planningPressure * 26;
  score += Math.max(0, employee.remainingHours - entry.assignedHours) * 1.5;

  score += getDaySpacingBonus(employee.id, task.dayKey) * 8;
  score += Math.max(0, 20 - countWorkedDays(employee.id) * 3);
  score += Math.random() * 2;
  return score;
}

function repairCriticalCoverage(employeeStats, engine, options = {}) {
  repairCoverageAcrossDays(employeeStats, engine, options);

  const repairDays = [...engine.orderedDays].sort((left, right) => {
    const hoursDiff =
      getDayCriticalGapHours(right, engine) - getDayCriticalGapHours(left, engine);
    if (hoursDiff !== 0) return hoursDiff;
    return compareDayFallbackPriority(left, right);
  });

  for (const dayKey of repairDays) {
    repairCoverageForDayV2(dayKey, employeeStats, engine, options);
  }
}

function repairCoverageForDayV2(dayKey, employeeStats, engine, options = {}) {
  const queue = buildAlternatingCriticalRoleQueue(dayKey, engine);

  for (const role of queue) {
    if (getRoleGapCount(dayKey, role, engine) <= 0) continue;

    const fullTask = createRoleTask(dayKey, role, "full", "critical-full", engine);
    if (!fullTask) continue;

    let resolved = tryReassignWithinDayV2(dayKey, fullTask, employeeStats, engine);
    if (!resolved) {
      const candidate = selectBestCandidate(employeeStats, fullTask, engine, options);
      if (candidate) {
        assignTask(employeeStats, candidate.employee.id, dayKey, fullTask.assignmentId, "auto");
        resolved = true;
      }
    }

    if (!resolved && options.allowCoreFallback) {
      const coreTask = createRoleTask(dayKey, role, "core", "critical-core", engine);
      if (coreTask) {
        const candidate = selectBestCandidate(employeeStats, coreTask, engine, options);
        if (candidate) {
          assignTask(employeeStats, candidate.employee.id, dayKey, coreTask.assignmentId, "auto");
        }
      }
    }
  }

  normalizeDayOverfillV2(dayKey, employeeStats);
}

function tryReassignWithinDayV2(dayKey, targetTask, employeeStats, engine) {
  const sameDayEmployees = state.employees
    .map((employee) => ({ employee, cell: getScheduleCell(employee.id, dayKey) }))
    .filter(({ cell }) => cell.assignmentId !== ASSIGNMENT_FREE && cell.assignmentId !== ASSIGNMENT_CLOSED)
    .filter(({ employee }) => !getScheduleCell(employee.id, dayKey).locked)
    .filter(({ cell }) => getShiftIdFromAssignmentId(cell.assignmentId) !== targetTask.shiftId)
    .map(({ employee, cell }) => ({
      employee,
      cell,
      stat: employeeStats.find((entry) => entry.employee.id === employee.id),
      originalTask: createTaskFromAssignment(dayKey, cell.assignmentId, engine),
    }))
    .filter((candidate) => candidate.stat && candidate.originalTask)
    .sort((left, right) => {
      const scoreDiff =
        scoreSwapCandidateForCritical(right.employee, right.originalTask, targetTask) -
        scoreSwapCandidateForCritical(left.employee, left.originalTask, targetTask);
      if (scoreDiff !== 0) return scoreDiff;
      return right.employee.planningPriority - left.employee.planningPriority;
    });

  for (const candidate of sameDayEmployees) {
    if (!canSwapEmployeeToTaskV2(candidate.stat, candidate.originalTask, targetTask)) continue;

    assignTask(employeeStats, candidate.employee.id, dayKey, targetTask.assignmentId, "auto");

    const backfilled =
      candidate.originalTask.role === "middle"
        ? true
        : backfillOriginalTaskV2(
            candidate.originalTask,
            employeeStats,
            engine,
            { allowOvertime: false },
            [candidate.employee.id],
          );

    if (backfilled) {
      return true;
    }

    assignTask(
      employeeStats,
      candidate.employee.id,
      dayKey,
      candidate.originalTask.assignmentId,
      "auto",
    );
  }

  return false;
}

function repackTwentyHourCriticalAssignments(employeeStats, engine) {
  for (const entry of employeeStats) {
    for (const dayKey of engine.orderedDays) {
      const cell = getScheduleCell(entry.employee.id, dayKey);
      if (cell.locked) continue;
      if (resolveVariantFromAssignmentId(cell.assignmentId) !== "full") continue;

      const shiftId = getShiftIdFromAssignmentId(cell.assignmentId);
      const role = getRoleFromShiftId(shiftId, engine);
      if (role !== "early" && role !== "late") continue;
      if (!canShiftUseCore(shiftId)) continue;

      const fullHours = getShiftFullHours(shiftId);
      const coreHours = getShiftCoreHours(shiftId);
      if (coreHours >= fullHours) continue;
      const remainingNeed = roundToHalfHour(entry.employee.remainingHours - entry.assignedHours);
      const canBenefitFromCore =
        entry.employee.weeklyHours === 20 ||
        (remainingNeed < 0 && Math.abs(remainingNeed) >= fullHours - coreHours) ||
        (remainingNeed >= 0 && remainingNeed < fullHours);
      if (!canBenefitFromCore) continue;

      cell.assignmentId = `${shiftId}::core`;
      cell.variant = "core";
      entry.assignedHours = roundToHalfHour(
        entry.assignedHours - (fullHours - coreHours),
      );
    }
  }
}

function backfillOriginalTaskV2(
  task,
  employeeStats,
  engine,
  options = {},
  excludedEmployeeIds = [],
) {
  let candidates = employeeStats.filter(
    (entry) =>
      !excludedEmployeeIds.includes(entry.employee.id) &&
      isEmployeeAvailable(entry.employee.id, task.dayKey) &&
      !hasAssignment(entry.employee.id, task.dayKey) &&
      canTakeTask(entry, task, engine, options),
  );

  if (task.stage !== "middle") {
    const nonReserved = candidates.filter(
      (entry) => !isReservedForMiddleShift(employeeStats, entry, task.dayKey, engine),
    );
    if (nonReserved.length > 0) {
      candidates = nonReserved;
    }
  }

  if (candidates.length === 0) return false;

  const best = candidates
    .map((entry) => ({
      entry,
      score: getTaskScore(entry, task, engine),
    }))
    .sort((left, right) => right.score - left.score)[0];

  assignTask(employeeStats, best.entry.employee.id, task.dayKey, task.assignmentId, "auto");
  return true;
}

function createTaskFromAssignment(dayKey, assignmentId, engine) {
  const shiftId = getShiftIdFromAssignmentId(assignmentId);
  const role = getRoleFromShiftId(shiftId, engine);
  if (!role) return null;

  return {
    dayKey,
    role,
    shiftId,
    assignmentId,
    variant: resolveVariantFromAssignmentId(assignmentId),
    stage:
      role === "middle"
        ? "middle"
        : assignmentId.endsWith("::core")
          ? "critical-core"
          : "critical-full",
    hours: getHoursForAssignmentId(assignmentId),
  };
}

function scoreSwapCandidateForCritical(employee, originalTask, targetTask) {
  let score = 0;
  if (originalTask.role === "middle") {
    score += 160;
  } else if (employee.preferredShiftId !== originalTask.shiftId) {
    score += 100;
  } else {
    score += 20;
  }

  if (employee.preferredShiftId === targetTask.shiftId) {
    score += 140 + employee.planningPriority * 20;
  } else if (!employee.preferredShiftId) {
    score += 80;
  }

  return score;
}

function canSwapEmployeeToTaskV2(entry, originalTask, nextTask) {
  const nextHours = roundToHalfHour(
    entry.assignedHours - originalTask.hours + nextTask.hours,
  );
  return nextHours <= roundToHalfHour(entry.hardCap);
}

function normalizeAllDays(employeeStats, engine) {
  for (const dayKey of engine.orderedDays) {
    normalizeDayOverfillV2(dayKey, employeeStats);
  }
}

function repairCoverageAcrossDays(employeeStats, engine, options = {}) {
  const deficitDays = engine.orderedDays.filter(
    (dayKey) => getDayCriticalGapCount(dayKey, engine) > 0,
  );

  for (const targetDayKey of deficitDays) {
    for (const role of ["early", "late"]) {
      while (getRoleGapCount(targetDayKey, role, engine) > 0) {
        const moved = tryMoveAssignmentFromOtherDay(
          targetDayKey,
          role,
          employeeStats,
          engine,
          options,
        );
        if (!moved) break;
      }
    }
  }
}

function tryMoveAssignmentFromOtherDay(targetDayKey, role, employeeStats, engine, options = {}) {
  const targetTask = createRoleTask(targetDayKey, role, "full", "critical-full", engine);
  if (!targetTask) return false;

  const donorCandidates = state.employees
    .map((employee) => ({
      employee,
      stat: employeeStats.find((entry) => entry.employee.id === employee.id),
    }))
    .filter(({ stat }) => Boolean(stat))
    .flatMap(({ employee, stat }) =>
      engine.orderedDays
        .filter((dayKey) => compareDayFallbackPriority(dayKey, targetDayKey) > 0)
        .map((dayKey) => {
          const cell = getScheduleCell(employee.id, dayKey);
          return {
            employee,
            stat,
            sourceDayKey: dayKey,
            cell,
            task: createTaskFromAssignment(dayKey, cell.assignmentId, engine),
          };
        }),
    )
    .filter(({ cell, task }) => cell.assignmentId !== ASSIGNMENT_FREE && cell.assignmentId !== ASSIGNMENT_CLOSED && task)
    .filter(({ employee, task }) => !getScheduleCell(employee.id, targetDayKey).locked)
    .filter(({ task }) => task.role === role || task.role === "middle")
    .filter(({ stat, task }) => canSwapEmployeeToTaskV2(stat, task, targetTask))
    .sort((left, right) => {
      const leftScore = scoreCrossDayMove(left, targetTask);
      const rightScore = scoreCrossDayMove(right, targetTask);
      return rightScore - leftScore;
    });

  const best = donorCandidates[0];
  if (!best) return false;

  const sourceCell = getScheduleCell(best.employee.id, best.sourceDayKey);
  sourceCell.assignmentId = ASSIGNMENT_FREE;
  sourceCell.variant = "free";
  sourceCell.source = "auto";
  best.stat.assignedHours = roundToHalfHour(best.stat.assignedHours - best.task.hours);

  assignTask(
    employeeStats,
    best.employee.id,
    targetDayKey,
    targetTask.assignmentId,
    "auto",
  );

  const backfilled =
    best.task.role === "middle"
      ? true
      : backfillOriginalTaskV2(best.task, employeeStats, engine, options, [
          best.employee.id,
        ]);

  if (backfilled) {
    return true;
  }

  const rollbackCell = getScheduleCell(best.employee.id, targetDayKey);
  rollbackCell.assignmentId = ASSIGNMENT_FREE;
  rollbackCell.variant = "free";
  rollbackCell.source = "auto";
  best.stat.assignedHours = roundToHalfHour(best.stat.assignedHours - targetTask.hours);

  assignTask(
    employeeStats,
    best.employee.id,
    best.sourceDayKey,
    best.task.assignmentId,
    "auto",
  );

  return false;
}

function scoreCrossDayMove(candidate, targetTask) {
  let score = 0;

  if (candidate.employee.preferredShiftId === targetTask.shiftId) {
    score += 200 + candidate.employee.planningPriority * 20;
  } else if (!candidate.employee.preferredShiftId) {
    score += 120;
  } else {
    score += 30;
  }

  if (candidate.task.role === "middle") {
    score += 90;
  } else if (candidate.employee.preferredShiftId !== candidate.task.shiftId) {
    score += 70;
  }

  score += compareDayFallbackPriority(targetTask.dayKey, candidate.sourceDayKey) * 10;
  return score;
}

function normalizeDayOverfillV2(dayKey, employeeStats) {
  for (const shift of state.shifts) {
    const required = getDemandValue(dayKey, shift.id);
    let assignedEmployees = state.employees.filter((employee) => {
      const cell = getScheduleCell(employee.id, dayKey);
      return getShiftIdFromAssignmentId(cell.assignmentId) === shift.id;
    });

    while (assignedEmployees.length > required) {
      const removable = assignedEmployees
        .filter((employee) => !getScheduleCell(employee.id, dayKey).locked)
        .sort((left, right) => {
          const leftScore = overfillRemovalScoreV2(left, shift.id);
          const rightScore = overfillRemovalScoreV2(right, shift.id);
          return leftScore - rightScore;
        })[0];

      if (!removable) break;

      const stat = employeeStats.find((entry) => entry.employee.id === removable.id);
      const cell = getScheduleCell(removable.id, dayKey);
      if (stat) {
        stat.assignedHours = roundToHalfHour(
          stat.assignedHours - getHoursForAssignmentId(cell.assignmentId),
        );
      }
      state.schedule[removable.id][dayKey] = createEmptyCell();
      assignedEmployees = state.employees.filter((employee) => {
        const nextCell = getScheduleCell(employee.id, dayKey);
        return getShiftIdFromAssignmentId(nextCell.assignmentId) === shift.id;
      });
    }
  }
}

function overfillRemovalScoreV2(employee, shiftId) {
  let score = 0;
  if (employee.preferredShiftId === shiftId) {
    score += 120 + employee.planningPriority * 20;
  } else if (!employee.preferredShiftId) {
    score += 70;
  } else {
    score += 20;
  }
  return score;
}

function isReservedForMiddleShift(employeeStats, entry, dayKey, engine) {
  const middleShift = engine.roleMap.middle;
  if (!middleShift) return false;
  if (entry.employee.preferredShiftId !== middleShift.id) return false;

  const remainingMiddleDemand = getGapCount(dayKey, middleShift.id);
  if (remainingMiddleDemand <= 0) return false;
  if (getRoleShortageRatio("late", engine) >= 0.2) return false;
  if (getRoleShortageRatio("early", engine) >= 0.2) return false;
  if (getRoleShortageHours("middle", engine) === 0) return false;

  const middleTask = createRoleTask(dayKey, "middle", "full", "middle", engine);
  if (!middleTask || !canTakeTask(entry, middleTask, engine)) return false;

  const preferredCandidates = employeeStats
    .filter((candidate) => candidate.employee.preferredShiftId === middleShift.id)
    .filter((candidate) => isEmployeeAvailable(candidate.employee.id, dayKey))
    .filter((candidate) => !hasAssignment(candidate.employee.id, dayKey))
    .filter((candidate) => canTakeTask(candidate, middleTask, engine))
    .sort(compareMiddleReservationCandidates);

  const reserveCount = Math.min(remainingMiddleDemand, preferredCandidates.length);
  return preferredCandidates
    .slice(0, reserveCount)
    .some((candidate) => candidate.employee.id === entry.employee.id);
}

function compareMiddleReservationCandidates(left, right) {
  const pressureDiff = getPlanningPressure(right) - getPlanningPressure(left);
  if (pressureDiff !== 0) return pressureDiff;

  const priorityDiff = right.employee.planningPriority - left.employee.planningPriority;
  if (priorityDiff !== 0) return priorityDiff;

  const leftRemaining = roundToHalfHour(left.softTarget - left.assignedHours);
  const rightRemaining = roundToHalfHour(right.softTarget - right.assignedHours);
  if (rightRemaining !== leftRemaining) {
    return rightRemaining - leftRemaining;
  }

  return left.employee.name.localeCompare(right.employee.name);
}

function getRoleFromShiftId(shiftId, engine) {
  if (engine.roleMap.early?.id === shiftId) return "early";
  if (engine.roleMap.middle?.id === shiftId) return "middle";
  if (engine.roleMap.late?.id === shiftId) return "late";
  return "";
}

function getGapCount(dayKey, shiftId) {
  return Math.max(0, getDemandValue(dayKey, shiftId) - countAssignments(dayKey, shiftId));
}

function getRoleGapCount(dayKey, role, engine) {
  const shift = engine.roleMap[role];
  if (!shift) return 0;
  return getGapCount(dayKey, shift.id);
}

function getDayCriticalGapCount(dayKey, engine) {
  return getRoleGapCount(dayKey, "early", engine) + getRoleGapCount(dayKey, "late", engine);
}

function getDayCriticalGapHours(dayKey, engine) {
  return (
    getRoleGapCount(dayKey, "early", engine) * getShiftFullHours(engine.roleMap.early.id) +
    getRoleGapCount(dayKey, "late", engine) * getShiftFullHours(engine.roleMap.late.id)
  );
}

function getTotalCriticalGapCount(engine) {
  return engine.orderedDays.reduce(
    (sum, dayKey) => sum + getDayCriticalGapCount(dayKey, engine),
    0,
  );
}

function getRemainingCriticalDemandHours(engine) {
  return engine.orderedDays.reduce((sum, dayKey) => {
    return sum + getDayCriticalGapHours(dayKey, engine);
  }, 0);
}

function calculateMiddlePhaseSurplus(employeeStats, engine) {
  const middleDemandHours = engine.orderedDays.reduce((sum, dayKey) => {
    return sum + getGapCount(dayKey, engine.roleMap.middle.id) * getShiftFullHours(engine.roleMap.middle.id);
  }, 0);

  const remainingSoftCapacity = employeeStats.reduce((sum, entry) => {
    return sum + Math.max(0, roundToHalfHour(entry.softTarget - entry.assignedHours));
  }, 0);

  return Math.max(0, roundToHalfHour(remainingSoftCapacity - middleDemandHours));
}

function applySoftTargetReduction(employeeStats, surplusHours) {
  let remaining = roundToHalfHour(surplusHours);

  for (const priority of [0, 1, 2, 3]) {
    const group = employeeStats.filter(
      (entry) => entry.employee.overtimePriority === priority,
    );
    for (const entry of group) {
      if (remaining <= 0) break;
      const availableToReduce = Math.max(
        0,
        roundToHalfHour(entry.softTarget - entry.assignedHours),
      );
      const removable = Math.min(remaining, availableToReduce);
      entry.softTarget = roundToHalfHour(entry.softTarget - removable);
      remaining = roundToHalfHour(remaining - removable);
    }
  }
}

function getRemainingAvailableDays(entry, engine) {
  const dayKeys = engine?.planningDays || getPlanningDays();
  let count = 0;

  for (const dayKey of dayKeys) {
    if (!isEmployeeAvailable(entry.employee.id, dayKey)) continue;
    if (hasAssignment(entry.employee.id, dayKey)) continue;
    count += 1;
  }

  return count;
}

function getPlanningPressure(entry, engine) {
  const remainingHours = Math.max(
    0,
    roundToHalfHour(entry.employee.remainingHours - entry.assignedHours),
  );
  const remainingDays = Math.max(1, getRemainingAvailableDays(entry, engine));
  return remainingHours / remainingDays;
}

function getShiftFullHours(shiftId) {
  return getHoursForAssignmentId(`${shiftId}::full`);
}

function getShiftCoreHours(shiftId) {
  return getHoursForAssignmentId(`${shiftId}::core`);
}

function countWorkedDays(employeeId) {
  return DAYS.filter((day) => hasAssignment(employeeId, day.key)).length;
}

function hasBlockingMessages(messages) {
  return messages.some((message) => message.blocking);
}
