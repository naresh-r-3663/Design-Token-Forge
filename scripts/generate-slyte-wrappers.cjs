#!/usr/bin/env node
/**
 * Generates packages/slyte/src/ — one .html + one .js per DTF component.
 *
 * Each Slyte component:
 *   - Has a <template tag-name="dtf-{name}"> template
 *   - Maps string props → data-* attributes via {{binding}}
 *   - Maps boolean props (disabled/loading/rounded) via toggleAttribute in didConnect + observers
 *   - Uses <lyte-yield yield-name="yield"> for default slot content
 *   - Throws Slyte events (throwEvent) for key interactions
 *
 * Usage:  node scripts/generate-slyte-wrappers.cjs
 */

'use strict';

const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '../packages/slyte/src');
fs.mkdirSync(OUT, { recursive: true });

// ─── Component Specs ──────────────────────────────────────────────────────────

const COMPONENTS = [
  // ── Button family ──────────────────────────────────────────────────────────
  {
    tag: 'dtf-button', cls: 'DtfButton', el: 'button', cssClass: 'btn',
    strProps: [
      { name: 'variant',   default: 'filled',  attr: 'data-variant' },
      { name: 'colorRole', default: 'brand',   attr: 'data-role' },
      { name: 'size',      default: 'base',    attr: 'data-size' },
    ],
    boolProps: ['disabled', 'loading', 'rounded'],
    yields: [{ name: 'yield', label: 'Button label' }],
    events: [],
    note: 'Maps to .btn — full button family roles & variants',
  },
  {
    tag: 'dtf-icon-button', cls: 'DtfIconButton', el: 'button', cssClass: 'icon-btn',
    strProps: [
      { name: 'colorRole', default: 'brand',  attr: 'data-role' },
      { name: 'size',      default: 'base',   attr: 'data-size' },
      { name: 'ariaLabel', default: '',       attr: 'aria-label' },
    ],
    boolProps: ['disabled', 'loading', 'rounded'],
    yields: [{ name: 'yield', label: 'Icon SVG or character' }],
    events: [],
    note: 'Square icon-only button. Pass aria-label for accessibility.',
  },
  {
    tag: 'dtf-menu-button', cls: 'DtfMenuButton', el: 'button', cssClass: 'menu-btn',
    strProps: [
      { name: 'variant',   default: 'filled', attr: 'data-variant' },
      { name: 'colorRole', default: 'brand',  attr: 'data-role' },
      { name: 'size',      default: 'base',   attr: 'data-size' },
    ],
    boolProps: ['disabled', 'loading', 'rounded', 'showChevron'],
    yields: [{ name: 'yield', label: 'Button label' }],
    events: [],
    note: 'Menu trigger button. showChevron adds caret via data-show-chevron.',
    extraBoolAttr: { showChevron: 'data-show-chevron' },
  },

  // ── Form Controls ──────────────────────────────────────────────────────────
  {
    tag: 'dtf-input', cls: 'DtfInput', el: 'div', cssClass: 'input',
    strProps: [
      { name: 'size',        default: 'base',  attr: 'data-size' },
      { name: 'variant',     default: 'outlined', attr: 'data-variant' },
    ],
    boolProps: ['disabled', 'error', 'loading'],
    yields: [],
    events: [],
    template: `
  <div class="input" data-size="{{size}}" data-variant="{{variant}}">
    <% if (label) { %>
    <label class="input__label">{{label}}</label>
    <% } %>
    <input
      class="input__control"
      type="{{type}}"
      placeholder="{{placeholder}}"
      value="{{value}}"
    />
  </div>`,
    extraStrProps: [
      { name: 'label',       default: '',      attr: null },
      { name: 'placeholder', default: '',      attr: null },
      { name: 'value',       default: '',      attr: null },
      { name: 'type',        default: 'text',  attr: null },
    ],
    note: 'Text input. Label is optional.',
  },
  {
    tag: 'dtf-textarea', cls: 'DtfTextarea', el: 'div', cssClass: 'textarea',
    strProps: [
      { name: 'size',    default: 'base',     attr: 'data-size' },
      { name: 'variant', default: 'outlined', attr: 'data-variant' },
    ],
    boolProps: ['disabled', 'error'],
    yields: [],
    events: [],
    template: `
  <div class="textarea" data-size="{{size}}" data-variant="{{variant}}">
    <% if (label) { %>
    <label class="textarea__label">{{label}}</label>
    <% } %>
    <textarea class="textarea__control" placeholder="{{placeholder}}">{{value}}</textarea>
  </div>`,
    extraStrProps: [
      { name: 'label',       default: '', attr: null },
      { name: 'placeholder', default: '', attr: null },
      { name: 'value',       default: '', attr: null },
    ],
    note: 'Multi-line text input.',
  },
  {
    tag: 'dtf-select', cls: 'DtfSelect', el: 'div', cssClass: 'select',
    strProps: [
      { name: 'size',    default: 'base',     attr: 'data-size' },
      { name: 'variant', default: 'outlined', attr: 'data-variant' },
    ],
    boolProps: ['disabled'],
    yields: [{ name: 'yield', label: '<option> elements' }],
    events: [],
    template: `
  <div class="select" data-size="{{size}}" data-variant="{{variant}}">
    <% if (label) { %>
    <label class="select__label">{{label}}</label>
    <% } %>
    <select class="select__control">
      <lyte-yield yield-name="yield"></lyte-yield>
    </select>
    <span class="select__chevron" aria-hidden="true"></span>
  </div>`,
    extraStrProps: [
      { name: 'label', default: '', attr: null },
    ],
    note: 'Native select with chevron. Pass <option> elements as yield.',
  },
  {
    tag: 'dtf-slider', cls: 'DtfSlider', el: 'div', cssClass: 'slider',
    strProps: [
      { name: 'colorRole', default: 'brand', attr: 'data-role' },
      { name: 'size',      default: 'base',  attr: 'data-size' },
    ],
    boolProps: ['disabled'],
    yields: [],
    events: ['change'],
    template: `
  <div class="slider" data-role="{{colorRole}}" data-size="{{size}}">
    <% if (label) { %>
    <label class="slider__label">{{label}}</label>
    <% } %>
    <input
      class="slider__input"
      type="range"
      min="{{min}}"
      max="{{max}}"
      step="{{step}}"
      value="{{value}}"
      oninput="{{action('onInput')}}"
    />
  </div>`,
    extraStrProps: [{ name: 'label', default: '', attr: null }],
    extraNumProps: [
      { name: 'min',   default: 0 },
      { name: 'max',   default: 100 },
      { name: 'value', default: 0 },
      { name: 'step',  default: 1 },
    ],
    note: 'Range slider. Fires on-change with new numeric value.',
    actions: `
      onInput: function(e) {
        var val = Number(e.target.value);
        this.setData('value', val);
        this.throwEvent('change', val);
      }`,
  },
  {
    tag: 'dtf-toggle', cls: 'DtfToggle', el: 'label', cssClass: 'switch',
    strProps: [
      { name: 'colorRole', default: 'brand', attr: 'data-role' },
      { name: 'size',      default: 'base',  attr: 'data-size' },
    ],
    boolProps: ['checked', 'disabled'],
    yields: [],
    events: ['change'],
    template: `
  <label class="switch" data-role="{{colorRole}}" data-size="{{size}}">
    <input
      class="switch__input"
      type="checkbox"
      role="switch"
      oninput="{{action('onChange')}}"
    />
    <span class="switch__track" aria-hidden="true"></span>
    <% if (label) { %>
    <span class="switch__label">{{label}}</span>
    <% } %>
  </label>`,
    extraStrProps: [{ name: 'label', default: '', attr: null }],
    note: 'Toggle switch. checked/disabled synced to input element.',
    actions: `
      onChange: function(e) {
        var val = e.target.checked;
        this.setData('checked', val);
        this.throwEvent('change', val);
      }`,
  },
  {
    tag: 'dtf-checkbox', cls: 'DtfCheckbox', el: 'label', cssClass: 'checkbox',
    strProps: [
      { name: 'colorRole', default: 'brand', attr: 'data-role' },
      { name: 'size',      default: 'base',  attr: 'data-size' },
    ],
    boolProps: ['checked', 'disabled', 'indeterminate'],
    yields: [],
    events: ['change'],
    template: `
  <label class="checkbox" data-role="{{colorRole}}" data-size="{{size}}">
    <input
      class="checkbox__input"
      type="checkbox"
      oninput="{{action('onChange')}}"
    />
    <span class="checkbox__box" aria-hidden="true"></span>
    <% if (label) { %>
    <span class="checkbox__label">{{label}}</span>
    <% } %>
  </label>`,
    extraStrProps: [{ name: 'label', default: '', attr: null }],
    note: 'Checkbox. indeterminate sets aria-checked="mixed" on the input.',
    actions: `
      onChange: function(e) {
        var val = e.target.checked;
        this.setData('checked', val);
        this.throwEvent('change', val);
      }`,
  },
  {
    tag: 'dtf-radio', cls: 'DtfRadio', el: 'label', cssClass: 'radio',
    strProps: [
      { name: 'colorRole', default: 'brand', attr: 'data-role' },
      { name: 'size',      default: 'base',  attr: 'data-size' },
      { name: 'name',      default: '',      attr: null },
      { name: 'value',     default: '',      attr: null },
    ],
    boolProps: ['checked', 'disabled'],
    yields: [],
    events: ['change'],
    template: `
  <label class="radio" data-role="{{colorRole}}" data-size="{{size}}">
    <input
      class="radio__input"
      type="radio"
      name="{{name}}"
      value="{{value}}"
      oninput="{{action('onChange')}}"
    />
    <span class="radio__mark" aria-hidden="true"></span>
    <% if (label) { %>
    <span class="radio__label">{{label}}</span>
    <% } %>
  </label>`,
    extraStrProps: [{ name: 'label', default: '', attr: null }],
    note: 'Radio button. Use name prop for grouping.',
    actions: `
      onChange: function(e) {
        this.setData('checked', e.target.checked);
        this.throwEvent('change', this.getData('value'));
      }`,
  },

  // ── Display ────────────────────────────────────────────────────────────────
  {
    tag: 'dtf-avatar', cls: 'DtfAvatar', el: 'div', cssClass: 'avatar',
    strProps: [
      { name: 'size',     default: 'base',   attr: 'data-size' },
      { name: 'status',   default: '',       attr: 'data-status' },
      { name: 'src',      default: '',       attr: null },
      { name: 'alt',      default: 'Avatar', attr: null },
      { name: 'initials', default: '',       attr: null },
    ],
    boolProps: [],
    yields: [],
    events: [],
    template: `
  <div class="avatar" data-size="{{size}}" data-status="{{status}}">
    <% if (src) { %>
    <img class="avatar__img" src="{{src}}" alt="{{alt}}" />
    <% } else { %>
    <span class="avatar__initials" aria-hidden="true">{{initials}}</span>
    <% } %>
    <% if (badgeCount) { %>
    <span class="avatar__badge">{{badgeCount}}</span>
    <% } %>
  </div>`,
    extraNumProps: [{ name: 'badgeCount', default: 0 }],
    note: 'Avatar with image, initials fallback, status ring, badge count.',
  },
  {
    tag: 'dtf-badge', cls: 'DtfBadge', el: 'span', cssClass: 'badge',
    strProps: [
      { name: 'colorRole', default: 'brand', attr: 'data-role' },
      { name: 'variant',   default: 'filled', attr: 'data-variant' },
      { name: 'size',      default: 'base',   attr: 'data-size' },
    ],
    boolProps: [],
    yields: [{ name: 'yield', label: 'Badge text/content' }],
    events: [],
    note: 'Status badge. Use colorRole for semantic color.',
  },
  {
    tag: 'dtf-tooltip', cls: 'DtfTooltip', el: 'span', cssClass: 'tooltip',
    strProps: [
      { name: 'content',   default: '',    attr: null },
      { name: 'placement', default: 'top', attr: 'data-placement' },
    ],
    boolProps: [],
    yields: [{ name: 'trigger', label: 'The trigger element' }],
    events: [],
    template: `
  <span class="tooltip" data-placement="{{placement}}" data-tip="{{content}}">
    <lyte-yield yield-name="trigger"></lyte-yield>
  </span>`,
    note: 'Tooltip wrapper. content is the tip text; trigger is the wrapped element.',
  },
  {
    tag: 'dtf-kbd', cls: 'DtfKbd', el: 'kbd', cssClass: 'kbd',
    strProps: [
      { name: 'size', default: 'base', attr: 'data-size' },
    ],
    boolProps: [],
    yields: [{ name: 'yield', label: 'Key label (e.g. ⌘, K, Shift)' }],
    events: [],
    note: 'Keyboard key badge.',
  },

  // ── Feedback ───────────────────────────────────────────────────────────────
  {
    tag: 'dtf-alert', cls: 'DtfAlert', el: 'div', cssClass: 'alert',
    strProps: [
      { name: 'colorRole', default: 'brand', attr: 'data-role' },
      { name: 'variant',   default: 'soft',  attr: 'data-variant' },
      { name: 'accent',    default: '',      attr: 'data-accent' },
    ],
    boolProps: ['dismissible'],
    yields: [{ name: 'yield', label: 'Alert body content' }],
    events: ['dismiss'],
    template: `
  <div class="alert" data-role="{{colorRole}}" data-variant="{{variant}}" data-accent="{{accent}}" role="{{colorRole === 'danger' ? 'alert' : 'status'}}">
    <% if (title) { %>
    <header class="alert__header">{{title}}</header>
    <% } %>
    <div class="alert__body">
      <lyte-yield yield-name="yield"></lyte-yield>
    </div>
    <% if (dismissible) { %>
    <button class="alert__dismiss" type="button" aria-label="Dismiss" onclick="{{action('onDismiss')}}"></button>
    <% } %>
  </div>`,
    extraStrProps: [{ name: 'title', default: '', attr: null }],
    note: 'Alert banner. on-dismiss fires when the dismiss button is clicked.',
    actions: `
      onDismiss: function() {
        this.throwEvent('dismiss');
      }`,
  },
  {
    tag: 'dtf-toast', cls: 'DtfToast', el: 'div', cssClass: 'toast',
    strProps: [
      { name: 'colorRole',   default: 'brand', attr: 'data-role' },
      { name: 'actionLabel', default: '',      attr: null },
    ],
    boolProps: ['persistent'],
    yields: [{ name: 'yield', label: 'Toast message text' }],
    events: ['dismiss', 'action'],
    template: `
  <div class="toast" data-role="{{colorRole}}" role="{{colorRole === 'danger' ? 'alert' : 'status'}}">
    <% if (title) { %>
    <header class="toast__header">{{title}}</header>
    <% } %>
    <div class="toast__body">
      <lyte-yield yield-name="yield"></lyte-yield>
    </div>
    <div class="toast__actions">
      <% if (actionLabel) { %>
      <button class="toast__action" type="button" onclick="{{action('onAction')}}">{{actionLabel}}</button>
      <% } %>
      <% if (!persistent) { %>
      <button class="toast__dismiss" type="button" aria-label="Dismiss" onclick="{{action('onDismiss')}}"></button>
      <% } %>
    </div>
  </div>`,
    extraStrProps: [{ name: 'title', default: '', attr: null }],
    note: 'Toast notification. on-dismiss and on-action fire on button clicks.',
    actions: `
      onDismiss: function() { this.throwEvent('dismiss'); },
      onAction:  function() { this.throwEvent('action'); }`,
  },
  {
    tag: 'dtf-progress-bar', cls: 'DtfProgressBar', el: 'div', cssClass: 'progress-bar',
    strProps: [
      { name: 'colorRole', default: 'brand', attr: 'data-role' },
      { name: 'size',      default: 'base',  attr: 'data-size' },
    ],
    boolProps: ['indeterminate'],
    yields: [],
    events: [],
    template: `
  <div class="progress-bar" data-role="{{colorRole}}" data-size="{{size}}" role="progressbar" aria-valuenow="{{value}}" aria-label="{{label}}">
    <% if (!indeterminate) { %>
    <div class="progress-bar__fill" style="width:{{value}}%"></div>
    <% } %>
    <% if (buffer) { %>
    <div class="progress-bar__buffer" style="width:{{buffer}}%" aria-hidden="true"></div>
    <% } %>
  </div>`,
    extraNumProps: [
      { name: 'value',  default: 0 },
      { name: 'buffer', default: 0 },
    ],
    extraStrProps: [{ name: 'label', default: 'Progress', attr: null }],
    note: 'Horizontal progress bar. value 0–100. Use buffer for buffering indicator.',
  },
  {
    tag: 'dtf-progress-ring', cls: 'DtfProgressRing', el: 'div', cssClass: 'progress-ring',
    strProps: [
      { name: 'colorRole', default: 'brand', attr: 'data-role' },
      { name: 'size',      default: 'base',  attr: 'data-size' },
    ],
    boolProps: ['indeterminate'],
    yields: [],
    events: [],
    template: `
  <div class="progress-ring" data-role="{{colorRole}}" data-size="{{size}}" role="progressbar" aria-valuenow="{{value}}" aria-label="{{label}}">
  </div>`,
    extraNumProps: [{ name: 'value', default: 0 }],
    extraStrProps: [{ name: 'label', default: 'Progress', attr: null }],
    note: 'Circular progress ring. CSS --progress var is set via didConnect observer.',
  },
  {
    tag: 'dtf-spinner', cls: 'DtfSpinner', el: 'div', cssClass: 'spinner',
    strProps: [
      { name: 'colorRole', default: 'brand', attr: 'data-role' },
      { name: 'size',      default: 'base',  attr: 'data-size' },
    ],
    boolProps: [],
    yields: [],
    events: [],
    template: `
  <div class="spinner" data-role="{{colorRole}}" data-size="{{size}}" role="status" aria-label="{{label}}">
    <span class="sr-only">{{label}}</span>
  </div>`,
    extraStrProps: [{ name: 'label', default: 'Loading', attr: null }],
    note: 'Indeterminate loading spinner.',
  },
  {
    tag: 'dtf-skeleton', cls: 'DtfSkeleton', el: 'span', cssClass: 'skeleton',
    strProps: [
      { name: 'variant', default: 'rect', attr: 'data-variant' },
      { name: 'width',   default: '',     attr: null },
      { name: 'height',  default: '',     attr: null },
    ],
    boolProps: [],
    yields: [],
    events: [],
    template: `
  <span class="skeleton" data-variant="{{variant}}" role="status" aria-label="Loading"></span>`,
    note: 'Skeleton loader. width/height applied via didConnect style.',
  },

  // ── Layout ─────────────────────────────────────────────────────────────────
  {
    tag: 'dtf-card', cls: 'DtfCard', el: 'div', cssClass: 'card',
    strProps: [
      { name: 'variant', default: 'flat', attr: 'data-variant' },
      { name: 'size',    default: 'base', attr: 'data-size' },
    ],
    boolProps: ['rounded', 'interactive', 'disabled'],
    yields: [{ name: 'yield', label: 'Card content' }],
    events: [],
    note: 'Card container. interactive adds hover/focus states.',
    extraBoolAttr: { interactive: 'data-interactive' },
  },
  {
    tag: 'dtf-divider', cls: 'DtfDivider', el: 'div', cssClass: 'divider',
    strProps: [
      { name: 'variant',     default: 'solid',      attr: 'data-variant' },
      { name: 'orientation', default: 'horizontal', attr: 'data-orientation' },
      { name: 'size',        default: 'base',       attr: 'data-size' },
    ],
    boolProps: [],
    yields: [{ name: 'yield', label: 'Optional label in the middle' }],
    events: [],
    template: `
  <div class="divider" data-variant="{{variant}}" data-orientation="{{orientation}}" data-size="{{size}}" role="separator" aria-orientation="{{orientation}}">
    <lyte-yield yield-name="yield"></lyte-yield>
  </div>`,
    note: 'Horizontal or vertical divider. Pass label as yield for a labeled divider.',
  },
  {
    tag: 'dtf-datepicker', cls: 'DtfDatepicker', el: 'div', cssClass: 'datepicker',
    strProps: [
      { name: 'size',  default: 'base',  attr: 'data-size' },
      { name: 'mode',  default: 'popup', attr: 'data-mode' },
    ],
    boolProps: ['range', 'disabled'],
    yields: [],
    events: ['change'],
    template: `
  <div class="datepicker" data-size="{{size}}" data-mode="{{mode}}">
    <% if (label) { %>
    <label class="datepicker__label">{{label}}</label>
    <% } %>
    <input class="datepicker__input" type="text" placeholder="{{placeholder}}" readonly oninput="{{action('onChange')}}" />
  </div>`,
    extraStrProps: [
      { name: 'label',       default: '',           attr: null },
      { name: 'placeholder', default: 'Pick a date', attr: null },
      { name: 'value',       default: '',           attr: null },
    ],
    note: 'Date picker wrapper. Full calendar JS requires DTF vanilla JS layer.',
    actions: `
      onChange: function(e) {
        this.setData('value', e.target.value);
        this.throwEvent('change', e.target.value);
      }`,
  },
  {
    tag: 'dtf-file-upload', cls: 'DtfFileUpload', el: 'div', cssClass: 'file-upload',
    strProps: [
      { name: 'size',   default: 'base',   attr: 'data-size' },
      { name: 'mode',   default: 'button', attr: 'data-mode' },
      { name: 'accept', default: '*',      attr: null },
    ],
    boolProps: ['multiple', 'disabled'],
    yields: [{ name: 'yield', label: 'Button label or dropzone text' }],
    events: ['files'],
    template: `
  <div class="file-upload" data-size="{{size}}" data-mode="{{mode}}">
    <lyte-yield yield-name="yield"></lyte-yield>
    <input
      class="file-upload__input"
      type="file"
      accept="{{accept}}"
      style="display:none"
      onchange="{{action('onFiles')}}"
    />
  </div>`,
    note: 'File upload. on-files fires with a FileList object.',
    actions: `
      onFiles: function(e) {
        this.throwEvent('files', e.target.files);
      }`,
  },
];

// ── SplitButton is complex enough to be hand-written but generated in template form ──
COMPONENTS.push({
  tag: 'dtf-split-button', cls: 'DtfSplitButton', el: 'div', cssClass: 'split-btn',
  strProps: [
    { name: 'variant',   default: 'filled', attr: 'data-variant' },
    { name: 'colorRole', default: 'brand',  attr: 'data-role' },
    { name: 'size',      default: 'base',   attr: 'data-size' },
    { name: 'menuLabel', default: 'More options', attr: null },
  ],
  boolProps: ['disabled', 'loading', 'rounded'],
  yields: [
    { name: 'label', label: 'Main action label' },
    { name: 'icon',  label: 'Optional leading icon' },
  ],
  events: ['action-click', 'menu-click'],
  template: `
  <div class="split-btn" data-variant="{{variant}}" data-role="{{colorRole}}" data-size="{{size}}">
    <button class="split-btn__action" type="button" onclick="{{action('onAction')}}">
      <lyte-yield yield-name="icon"></lyte-yield>
      <lyte-yield yield-name="label"></lyte-yield>
    </button>
    <button class="split-btn__trigger" type="button" aria-label="{{menuLabel}}" aria-haspopup="menu" onclick="{{action('onMenu')}}">
      <span class="split-btn__caret" aria-hidden="true"></span>
    </button>
  </div>`,
  note: 'Two-zone split button. on-action-click and on-menu-click fire separately.',
  actions: `
    onAction: function() { this.throwEvent('action-click'); },
    onMenu:   function() { this.throwEvent('menu-click'); }`,
});

// ─── Code Templates ───────────────────────────────────────────────────────────

function toPascalCase(str) {
  return str.replace(/(^|[-_])([a-z])/g, (_, __, c) => c.toUpperCase());
}

/**
 * Generate the <template> HTML for a component.
 */
function genTemplate(c) {
  if (c.template) return c.template.trim();

  const attrs = c.strProps
    .map(p => `${p.attr}="{{${p.name}}}"`).join('\n      ');

  const yields = c.yields.map(y =>
    `<lyte-yield yield-name="${y.name}"></lyte-yield>`
  ).join('\n      ');

  return `<${c.el} class="${c.cssClass}" ${attrs}>
    ${yields}
  </${c.el}>`;
}

/**
 * Generate the JavaScript class for a component.
 */
function genJS(c) {
  const allStrProps = [
    ...c.strProps,
    ...(c.extraStrProps || []),
  ];
  const allNumProps = c.extraNumProps || [];

  // Build data() block
  const strLines = allStrProps.map(p =>
    `      ${p.name}: prop("string", { default: ${JSON.stringify(p.default)} }),`
  );
  const boolLines = c.boolProps.map(p =>
    `      ${p}: prop("boolean", { default: false }),`
  );
  const numLines = allNumProps.map(p =>
    `      ${p.name}: prop("number", { default: ${p.default} }),`
  );

  // Build bool-attr sync
  const standardBools = c.boolProps.filter(p => !['showChevron', 'interactive', 'indeterminate', 'dismissible', 'persistent', 'range', 'multiple', 'checked', 'indeterminate'].includes(p));
  const extraBoolAttrs = c.extraBoolAttr || {};

  const allBoolSyncs = [];
  // Standard bools (disabled, loading, rounded → same-name data attr)
  for (const p of standardBools) {
    allBoolSyncs.push(`el.toggleAttribute("data-${p}", this.getData("${p}"));`);
  }
  // Extra bool attrs
  for (const [propName, attrName] of Object.entries(extraBoolAttrs)) {
    allBoolSyncs.push(`el.toggleAttribute("${attrName}", this.getData("${propName}"));`);
  }

  // Build observers for bool props
  const boolObservers = [];
  for (const p of standardBools) {
    boolObservers.push(`
      ${p}Changed: function() {
        var el = this.$node.querySelector(".${c.cssClass}");
        if (el) el.toggleAttribute("data-${p}", this.getData("${p}"));
      }.observes("${p}"),`);
  }
  for (const [propName, attrName] of Object.entries(extraBoolAttrs)) {
    boolObservers.push(`
      ${propName}Changed: function() {
        var el = this.$node.querySelector(".${c.cssClass}");
        if (el) el.toggleAttribute("${attrName}", this.getData("${propName}"));
      }.observes("${propName}"),`);
  }

  // Special: progress-ring value → CSS custom property
  let didConnectExtra = '';
  let valueObserver = '';
  if (c.tag === 'dtf-progress-ring') {
    didConnectExtra = `\n    this._syncProgress();`;
    valueObserver = `
      valueChanged: function() {
        this._syncProgress();
      }.observes("value"),
      indeterminateChanged: function() {
        var el = this.$node.querySelector(".progress-ring");
        if (el) el.toggleAttribute("data-indeterminate", this.getData("indeterminate"));
      }.observes("indeterminate"),`;
  }

  // Special: skeleton width/height → inline style
  let skeletonInit = '';
  if (c.tag === 'dtf-skeleton') {
    skeletonInit = `\n    this._syncSize();`;
  }

  // Special: toggle/checkbox/radio checked → input property
  let checkedInit = '';
  let checkedObserver = '';
  if (['dtf-toggle', 'dtf-checkbox', 'dtf-radio'].includes(c.tag)) {
    checkedInit = `
    var input = this.$node.querySelector("input");
    if (input) {
      input.checked = this.getData("checked");
      input.disabled = this.getData("disabled");
    }`;
    checkedObserver = `
      checkedChanged: function() {
        var input = this.$node.querySelector("input");
        if (input) input.checked = this.getData("checked");
      }.observes("checked"),
      disabledChanged: function() {
        var input = this.$node.querySelector("input");
        if (input) input.disabled = this.getData("disabled");
      }.observes("disabled"),`;
  }

  // Special: checkbox indeterminate
  let indeterminateObserver = '';
  if (c.tag === 'dtf-checkbox') {
    indeterminateObserver = `
      indeterminateChanged: function() {
        var input = this.$node.querySelector("input");
        if (input) {
          input.indeterminate = this.getData("indeterminate");
          input.setAttribute("aria-checked", this.getData("indeterminate") ? "mixed" : (this.getData("checked") ? "true" : "false"));
        }
      }.observes("indeterminate"),`;
  }

  const actionsBlock = c.actions
    ? `
  static actions() {
    return {${c.actions}
    };
  }
` : '';

  const allObservers = [
    ...boolObservers,
    checkedObserver,
    indeterminateObserver,
    valueObserver,
  ].filter(Boolean);

  const observersBlock = allObservers.length
    ? `
  static observers() {
    return {${allObservers.join('')}
    };
  }
` : '';

  const helperMethods = [];
  if (allBoolSyncs.length) {
    helperMethods.push(`
  _syncBoolAttrs() {
    var el = this.$node.querySelector(".${c.cssClass}");
    if (!el) return;
    ${allBoolSyncs.join('\n    ')}
  }`);
  }
  if (c.tag === 'dtf-progress-ring') {
    helperMethods.push(`
  _syncProgress() {
    var el = this.$node.querySelector(".progress-ring");
    if (el) {
      el.style.setProperty("--progress", this.getData("value") + "%");
      el.toggleAttribute("data-indeterminate", this.getData("indeterminate"));
    }
  }`);
  }
  if (c.tag === 'dtf-skeleton') {
    helperMethods.push(`
  _syncSize() {
    var el = this.$node.querySelector(".skeleton");
    if (!el) return;
    var w = this.getData("width");
    var h = this.getData("height");
    if (w) el.style.width = w;
    if (h) el.style.height = h;
  }`);
  }

  const didConnectBody = [
    allBoolSyncs.length ? 'this._syncBoolAttrs();' : null,
    checkedInit.trim() || null,
    didConnectExtra.trim() || null,
    skeletonInit.trim() || null,
  ].filter(Boolean);

  const didConnectBlock = didConnectBody.length
    ? `
  didConnect() {
    ${didConnectBody.join('\n    ')}
  }
` : '';

  return `import { prop } from "@slyte/core";
import { Component } from "@slyte/component";

/**
 * ${c.tag} — DTF Slyte wrapper
 * ${c.note || ''}
 *
 * Usage:
 *   <${c.tag} lt-prop-variant="filled" lt-prop-color-role="brand">
 *     <template is="registerYield" yield-name="yield">Label</template>
 *   </${c.tag}>
 */
class ${c.cls} extends Component {
  data() {
    return {
${[...strLines, ...boolLines, ...numLines].join('\n')}
    };
  }
${helperMethods.join('\n')}
${didConnectBlock}${actionsBlock}${observersBlock}}

export { ${c.cls} };
`;
}

/**
 * Generate the HTML template file.
 */
function genHTML(c) {
  const body = genTemplate(c);
  return `<template tag-name="${c.tag}">
  ${body}
</template>
`;
}

// ─── Write Files ──────────────────────────────────────────────────────────────

let count = 0;
for (const c of COMPONENTS) {
  const htmlPath = path.join(OUT, `${c.tag}.html`);
  const jsPath   = path.join(OUT, `${c.tag}.js`);

  fs.writeFileSync(htmlPath, genHTML(c), 'utf8');
  fs.writeFileSync(jsPath,   genJS(c),   'utf8');
  count++;
}

// ─── Index ────────────────────────────────────────────────────────────────────

const indexLines = COMPONENTS.map(c =>
  `export { ${c.cls} } from './${c.tag}.js';`
).join('\n');

const indexContent = `/**
 * @design-token-forge/slyte
 * Slyte (Zoho Lyte framework) wrapper components for the DTF design system.
 *
 * Register these in your ComponentRegistry:
 *   import { DtfButton, DtfInput, ... } from '@design-token-forge/slyte';
 *
 *   class AppRegistry extends ComponentRegistry {
 *     components() { return [DtfButton, DtfInput, ...]; }
 *   }
 *
 * Also import DTF CSS in your app's global stylesheet:
 *   @import '@design-token-forge/tokens/dist/index.css';
 *   @import '@design-token-forge/components/dist/index.css';
 */

${indexLines}
`;

fs.writeFileSync(path.join(OUT, 'index.js'), indexContent, 'utf8');

console.log(`✅ packages/slyte/src/ — ${count} components (${count * 2} files) + index.js`);
