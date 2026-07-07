/**
 * CSS styles untuk react-big-calendar
 * Responsif terhadap dark mode
 * @param {string} colorMode - 'light' atau 'dark'
 * @returns {string} CSS string untuk kalender
 */
export const getCalendarStyles = (colorMode) => {
  // Calendar colors based on color mode
  const calendarBg = colorMode === "dark" ? "#2D3748" : "white";
  const calendarText = colorMode === "dark" ? "#E2E8F0" : "#333";
  const calendarBorder = colorMode === "dark" ? "#4A5568" : "#e5e7eb";
  const calendarOffRange = colorMode === "dark" ? "#1A202C" : "#f7f7f7";
  const calendarToolbarBg = colorMode === "dark" ? "#2D3748" : "white";
  const calendarToolbarButtonBg = colorMode === "dark" ? "#2D3748" : "white";
  const calendarToolbarButtonHover =
    colorMode === "dark" ? "#4A5568" : "rgba(212, 39, 39, 0.1)";
  const calendarTimeSlot = colorMode === "dark" ? "#4A5568" : "#f3f4f6";

  return `
    .rbc-calendar {
      font-family: inherit;
      background: ${calendarBg};
    }
    .rbc-header {
      padding: 12px 8px;
      background: linear-gradient(to bottom, rgba(212, 39, 39, 0.1), rgba(212, 39, 39, 0.05));
      border-bottom: 2px solid rgba(212, 39, 39, 0.2);
      font-weight: 600;
      color: rgba(212, 39, 39, 1);
      text-transform: capitalize;
    }
    .rbc-today {
      background-color: rgba(212, 39, 39, 0.05) !important;
    }
    .rbc-off-range-bg {
      background: ${calendarOffRange};
    }
    .rbc-date-cell {
      padding: 4px;
    }
    .rbc-date-cell > a {
      color: ${calendarText};
      font-weight: 500;
    }
    .rbc-date-cell.rbc-now > a {
      color: rgba(212, 39, 39, 1);
      font-weight: 700;
    }
    .rbc-toolbar {
      margin-bottom: 20px;
      padding: 16px;
      background: ${calendarToolbarBg};
      border-radius: 8px 8px 0 0;
      border-bottom: 2px solid rgba(212, 39, 39, 0.1);
    }
    .rbc-toolbar button {
      color: rgba(212, 39, 39, 1);
      border: 1px solid rgba(212, 39, 39, 0.3);
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 500;
      transition: all 0.2s ease;
      background: ${calendarToolbarButtonBg};
    }
    .rbc-toolbar button:hover {
      background: ${calendarToolbarButtonHover};
      border-color: rgba(212, 39, 39, 0.5);
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .rbc-toolbar button:active,
    .rbc-toolbar button.rbc-active {
      background: rgba(212, 39, 39, 1);
      color: white;
      border-color: rgba(212, 39, 39, 1);
    }
    .rbc-toolbar-label {
      font-size: 18px;
      font-weight: 700;
      color: rgba(212, 39, 39, 1);
      text-transform: capitalize;
    }
    .rbc-month-view {
      border: none;
    }
    .rbc-month-row {
      border-color: ${calendarBorder};
      min-height: 120px;
    }
    .rbc-day-bg {
      border-color: ${calendarBorder};
    }
    .rbc-day-bg.rbc-today {
      background-color: rgba(212, 39, 39, 0.05);
      position: relative;
    }
    .rbc-day-bg.rbc-today::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: rgba(212, 39, 39, 1);
    }
    .rbc-event {
      border-radius: 6px;
      padding: 6px 10px;
      margin: 2px 0;
      border: none;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      transition: all 0.2s ease;
      position: relative;
      overflow: hidden;
    }
    .rbc-event::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      background: rgba(255, 255, 255, 0.5);
    }
    .rbc-event:hover {
      box-shadow: 0 4px 12px rgba(212, 39, 39, 0.3);
      transform: translateY(-2px) scale(1.02);
      z-index: 10;
    }
    .rbc-event-content {
      font-size: 12px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .rbc-event-content::before {
      content: '📍';
      margin-right: 4px;
      font-size: 10px;
    }
    .rbc-agenda-view table {
      border: 1px solid ${calendarBorder};
      border-radius: 8px;
      overflow: hidden;
    }
    .rbc-agenda-date-cell,
    .rbc-agenda-time-cell {
      padding: 12px;
      border-color: ${calendarBorder};
    }
    .rbc-agenda-event-cell {
      padding: 12px;
      border-color: ${calendarBorder};
    }
    .rbc-time-view {
      border: 1px solid ${calendarBorder};
      border-radius: 8px;
    }
    .rbc-time-header-content {
      border-color: ${calendarBorder};
    }
    .rbc-time-content {
      border-color: ${calendarBorder};
    }
    .rbc-time-slot {
      border-color: ${calendarTimeSlot};
    }
    .rbc-current-time-indicator {
      background-color: rgba(212, 39, 39, 1);
      height: 2px;
    }
    .rbc-current-time-indicator::before {
      background-color: rgba(212, 39, 39, 1);
      border-color: rgba(212, 39, 39, 1);
    }
    @media (max-width: 768px) {
      .rbc-toolbar {
        flex-direction: column;
        gap: 12px;
      }
      .rbc-toolbar button {
        width: 100%;
      }
      .rbc-toolbar-label {
        order: -1;
        width: 100%;
        text-align: center;
        margin-bottom: 8px;
      }
    }
  `;
};
