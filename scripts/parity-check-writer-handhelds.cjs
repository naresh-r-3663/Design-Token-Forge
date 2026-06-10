'use strict';
// Full parity check: writer-handhelds vs dev Kotlin spec
// Covers: primitives.css, semantic.css, surfaces.css, config.json t1Picks
// Usage: node scripts/parity-check-writer-handhelds.cjs

const fs   = require('fs');
const path = require('path');

// ─── 1. COLOR LOOKUP TABLE (from "-- Brand Colors.txt") ───────────────────────
const C = {
  Brand:   { white:'#FFFFFF', black:'#000000', 25:'#F6F9FF', 50:'#EAF1FF', 75:'#DDE9FF', 100:'#CDDDFF', 150:'#B8CFFF', 175:'#A3C1FE', 200:'#8FB2FE', 250:'#7AA3FD', 300:'#6593FE', 350:'#5586FD', 400:'#4579FC', 450:'#3B6FF6', 500:'#3366F0', 550:'#2A5BE3', 600:'#204ED1', 700:'#133BB9', 750:'#0828A0', 800:'#021587', 850:'#01016C', 900:'#010045' },
  Danger:  { white:'#FFFFFF', black:'#000000', 25:'#FFF7F6', 50:'#FFEBE8', 75:'#FFDFDB', 100:'#FFCFC8', 150:'#FFBAB1', 175:'#FFA499', 200:'#FE8D80', 250:'#FE7266', 300:'#F45D53', 350:'#EB4D44', 400:'#E13B35', 450:'#DA2B29', 500:'#DC2626', 550:'#C30A15', 600:'#AE0711', 700:'#92020B', 750:'#760408', 800:'#5B0205', 850:'#430002', 900:'#290001' },
  Warning: { white:'#FFFFFF', black:'#000000', 25:'#FFF9F4', 50:'#FFF1E4', 75:'#FFE9D4', 100:'#FFDDBE', 150:'#FFCFA2', 175:'#FFBF83', 200:'#FEB062', 250:'#F5A44F', 300:'#ED9739', 350:'#E68D22', 400:'#DD850C', 450:'#D57F0A', 500:'#D97706', 550:'#BA6F0D', 600:'#A56207', 700:'#894F00', 750:'#6D3E00', 800:'#522E01', 850:'#391E00', 900:'#210F00' },
  Info:    { white:'#FFFFFF', black:'#000000', 25:'#F7FCFF', 50:'#ECF7FF', 75:'#E1F2FF', 100:'#D1EBFF', 150:'#BDE2FF', 175:'#AADAFF', 200:'#95D1FF', 250:'#7FC8FF', 300:'#68BFFE', 350:'#4FB8FF', 400:'#3FB0FA', 450:'#30AAF7', 500:'#0EA5E9', 550:'#1196E0', 600:'#0984C7', 700:'#0A6CA3', 750:'#055582', 800:'#003F62', 850:'#002A44', 900:'#001627' },
  Success: { white:'#FFFFFF', black:'#000000', 25:'#F0FFF0', 50:'#DBFFDB', 75:'#C2FFC3', 100:'#AFF9B1', 150:'#9FEFA1', 175:'#8EE592', 200:'#7EDB82', 250:'#6DD173', 300:'#5CC764', 350:'#4CBF57', 400:'#3BB74A', 450:'#2BB13F', 500:'#16A34A', 550:'#089C2C', 600:'#028A25', 700:'#06721E', 750:'#045A16', 800:'#00440D', 850:'#012E07', 900:'#001A02' },
  Neutral: { white:'#FFFFFF', black:'#000000', 25:'#F1F7FC', 50:'#E3E9EF', 75:'#D5DCE3', 100:'#C3CBD2', 150:'#ADB5BD', 175:'#98A0A8', 200:'#838C94', 250:'#6F7880', 300:'#5B646D', 350:'#4C555E', 400:'#3D474F', 450:'#333C45', 500:'#000205', 550:'#252E37', 600:'#212A32', 700:'#1B242C', 750:'#161E25', 800:'#11181F', 850:'#0B1117', 900:'#04080D' },
};
function c(role, step) { return (C[role]?.[String(step)] || `MISSING(${role}.${step})`).toUpperCase(); }

const N = C.Neutral, B = C.Brand;

// ─── 2. SEMANTIC TRUTH TABLE (from zLig.txt semantic section) ─────────────────
const LIGHT_SEM = {
  brand:   { 'component-bg-default':c('Brand',500), 'component-bg-hover':c('Brand',550), 'component-bg-pressed':c('Brand',600), 'component-outline-default':c('Brand',300), 'component-outline-hover':c('Brand',300), 'component-outline-pressed':c('Brand',350), 'component-separator':c('Brand',100), 'content-default':c('Brand',550), 'content-strong':c('Brand',600), 'content-subtle':c('Brand',350), 'content-faint':c('Brand',200), 'container-bg':c('Brand',50), 'container-hover':c('Brand',75), 'container-pressed':c('Brand',100), 'container-outline':c('Brand',200), 'container-separator':c('Brand',100), 'on-component':'#FFFFFF', 'on-container':c('Brand',600) },
  danger:  { 'component-bg-default':c('Danger',500), 'component-bg-hover':c('Danger',550), 'component-bg-pressed':c('Danger',600), 'component-outline-default':c('Danger',300), 'component-outline-hover':c('Danger',300), 'component-outline-pressed':c('Danger',350), 'component-separator':c('Danger',100), 'content-default':c('Danger',550), 'content-strong':c('Danger',600), 'content-subtle':c('Danger',350), 'content-faint':c('Danger',200), 'container-bg':c('Danger',50), 'container-hover':c('Danger',75), 'container-pressed':c('Danger',100), 'container-outline':c('Danger',200), 'container-separator':c('Danger',150), 'on-component':'#FFFFFF', 'on-container':c('Danger',550) },
  success: { 'component-bg-default':c('Success',600), 'component-bg-hover':c('Success',550), 'component-bg-pressed':c('Success',600), 'component-outline-default':c('Success',500), 'component-outline-hover':c('Success',300), 'component-outline-pressed':c('Success',350), 'component-separator':c('Success',100), 'content-default':c('Success',600), 'content-strong':c('Success',600), 'content-subtle':c('Success',350), 'content-faint':c('Success',200), 'container-bg':c('Success',50), 'container-hover':c('Success',75), 'container-pressed':c('Success',100), 'container-outline':c('Success',200), 'container-separator':c('Success',175), 'on-component':'#FFFFFF', 'on-container':c('Success',700) },
  warning: { 'component-bg-default':c('Warning',600), 'component-bg-hover':c('Warning',550), 'component-bg-pressed':c('Warning',600), 'component-outline-default':c('Warning',300), 'component-outline-hover':c('Warning',300), 'component-outline-pressed':c('Warning',350), 'component-separator':c('Warning',100), 'content-default':c('Warning',600), 'content-strong':c('Warning',700), 'content-subtle':c('Warning',400), 'content-faint':c('Warning',350), 'container-bg':c('Warning',50), 'container-hover':c('Warning',75), 'container-pressed':c('Warning',100), 'container-outline':c('Warning',200), 'container-separator':c('Warning',100), 'on-component':'#FFFFFF', 'on-container':c('Warning',700) },
  info:    { 'component-bg-default':c('Info',600), 'component-bg-hover':c('Info',550), 'component-bg-pressed':c('Info',600), 'component-outline-default':c('Info',300), 'component-outline-hover':c('Info',300), 'component-outline-pressed':c('Info',350), 'component-separator':c('Info',100), 'content-default':c('Info',700), 'content-strong':c('Info',750), 'content-subtle':c('Info',550), 'content-faint':c('Info',500), 'container-bg':c('Info',50), 'container-hover':c('Info',75), 'container-pressed':c('Info',100), 'container-outline':c('Info',200), 'container-separator':c('Info',175), 'on-component':'#FFFFFF', 'on-container':c('Info',600) },
  neutral: { 'component-bg-default':c('Neutral',500), 'component-bg-hover':c('Neutral',550), 'component-bg-pressed':c('Neutral',600), 'component-outline-default':c('Neutral',300), 'component-outline-hover':c('Neutral',300), 'component-outline-pressed':c('Neutral',350), 'component-separator':c('Neutral',100), 'content-default':c('Neutral',550), 'content-strong':c('Neutral',600), 'content-subtle':c('Neutral',350), 'content-faint':c('Neutral',200), 'container-bg':c('Neutral',50), 'container-hover':c('Neutral',75), 'container-pressed':c('Neutral',100), 'container-outline':c('Neutral',200), 'container-separator':c('Neutral',100), 'on-component':'#FFFFFF', 'on-container':c('Neutral',600) },
};
const DARK_SEM = {
  brand:   { 'component-bg-default':c('Brand',500), 'component-bg-hover':c('Brand',350), 'component-bg-pressed':c('Brand',300), 'component-outline-default':c('Brand',750), 'component-outline-hover':c('Brand',350), 'component-outline-pressed':c('Brand',350), 'component-separator':c('Brand',350), 'content-default':c('Brand',150), 'content-strong':c('Brand',100), 'content-subtle':c('Brand',200), 'content-faint':c('Brand',350), 'container-bg':'#000000', 'container-hover':c('Brand',750), 'container-pressed':c('Brand',700), 'container-outline':c('Brand',550), 'container-separator':c('Brand',750), 'on-component':'#FFFFFF', 'on-container':c('Brand',200) },
  danger:  { 'component-bg-default':c('Danger',450), 'component-bg-hover':c('Danger',350), 'component-bg-pressed':c('Danger',300), 'component-outline-default':c('Danger',450), 'component-outline-hover':c('Danger',350), 'component-outline-pressed':c('Danger',350), 'component-separator':c('Danger',350), 'content-default':c('Danger',150), 'content-strong':c('Danger',100), 'content-subtle':c('Danger',200), 'content-faint':c('Danger',350), 'container-bg':c('Danger',850), 'container-hover':c('Danger',750), 'container-pressed':c('Danger',700), 'container-outline':c('Danger',550), 'container-separator':c('Danger',750), 'on-component':'#FFFFFF', 'on-container':c('Danger',150) },
  success: { 'component-bg-default':c('Success',600), 'component-bg-hover':c('Success',350), 'component-bg-pressed':c('Success',300), 'component-outline-default':c('Success',450), 'component-outline-hover':c('Success',350), 'component-outline-pressed':c('Success',350), 'component-separator':c('Success',350), 'content-default':c('Success',150), 'content-strong':c('Success',100), 'content-subtle':c('Success',200), 'content-faint':c('Success',350), 'container-bg':c('Success',850), 'container-hover':c('Success',750), 'container-pressed':c('Success',700), 'container-outline':c('Success',550), 'container-separator':c('Success',750), 'on-component':'#FFFFFF', 'on-container':c('Success',100) },
  warning: { 'component-bg-default':c('Warning',600), 'component-bg-hover':c('Warning',350), 'component-bg-pressed':c('Warning',300), 'component-outline-default':c('Warning',450), 'component-outline-hover':c('Warning',350), 'component-outline-pressed':c('Warning',350), 'component-separator':c('Warning',350), 'content-default':c('Warning',150), 'content-strong':c('Warning',100), 'content-subtle':c('Warning',200), 'content-faint':c('Warning',350), 'container-bg':c('Warning',900), 'container-hover':c('Warning',850), 'container-pressed':c('Warning',700), 'container-outline':c('Warning',850), 'container-separator':c('Warning',750), 'on-component':'#FFFFFF', 'on-container':c('Warning',175) },
  info:    { 'component-bg-default':c('Info',700), 'component-bg-hover':c('Info',350), 'component-bg-pressed':c('Info',300), 'component-outline-default':c('Info',550), 'component-outline-hover':c('Info',350), 'component-outline-pressed':c('Info',350), 'component-separator':c('Info',450), 'content-default':c('Info',150), 'content-strong':c('Info',100), 'content-subtle':c('Info',200), 'content-faint':c('Info',350), 'container-bg':c('Info',850), 'container-hover':c('Info',750), 'container-pressed':c('Info',700), 'container-outline':c('Info',750), 'container-separator':c('Info',750), 'on-component':'#FFFFFF', 'on-container':c('Info',100) },
  neutral: { 'component-bg-default':c('Neutral',450), 'component-bg-hover':c('Neutral',350), 'component-bg-pressed':c('Neutral',300), 'component-outline-default':c('Neutral',450), 'component-outline-hover':c('Neutral',350), 'component-outline-pressed':c('Neutral',350), 'component-separator':c('Neutral',350), 'content-default':c('Neutral',150), 'content-strong':c('Neutral',100), 'content-subtle':c('Neutral',200), 'content-faint':c('Neutral',350), 'container-bg':c('Neutral',800), 'container-hover':c('Neutral',750), 'container-pressed':c('Neutral',700), 'container-outline':c('Neutral',550), 'container-separator':c('Neutral',750), 'on-component':'#FFFFFF', 'on-container':c('Neutral',100) },
};

// ─── 3. SURFACE TRUTH TABLE (from zLig.txt surface sections) ──────────────────
const LIGHT_SURF = {
  base:    { bg:N[25],   subtle:N[50],   strong:N[75],   outline:N[100],  separator:N[100],  'ct-default':N[750], 'ct-strong':N[900],  'ct-subtle':N[400], 'ct-faint':N[300], 'cm-bg':N.white, 'cm-bg-hover':N[25],  'cm-bg-pressed':N[50],  'cm-outline':N[100], 'cm-outline-hover':N[150], 'cm-outline-pressed':N[150], 'cm-separator':N[100] },
  bright:  { bg:B.white, subtle:N[25],   strong:N[50],   outline:N[75],   separator:N[75],   'ct-default':N[700], 'ct-strong':N[850],  'ct-subtle':N[350], 'ct-faint':N[250], 'cm-bg':B.white, 'cm-bg-hover':N[25],  'cm-bg-pressed':N[50],  'cm-outline':N[100], 'cm-outline-hover':N[150], 'cm-outline-pressed':N[150], 'cm-separator':N[100] },
  deep:    { bg:N[75],   subtle:N[100],  strong:N[150],  outline:N[175],  separator:N[175],  'ct-default':N[900], 'ct-strong':N.black, 'ct-subtle':N[600], 'ct-faint':N[450], 'cm-bg':N[50],   'cm-bg-hover':N[75],  'cm-bg-pressed':N[100], 'cm-outline':N[150], 'cm-outline-hover':N[175], 'cm-outline-pressed':N[175], 'cm-separator':N[150] },
  dim:     { bg:N[50],   subtle:N[75],   strong:N[100],  outline:N[150],  separator:N[150],  'ct-default':N[800], 'ct-strong':B.black, 'ct-subtle':N[450], 'ct-faint':N[350], 'cm-bg':N[25],   'cm-bg-hover':N[50],  'cm-bg-pressed':N[75],  'cm-outline':N[150], 'cm-outline-hover':N[175], 'cm-outline-pressed':N[175], 'cm-separator':N[150] },
  accent:  { bg:B[25],   subtle:B[50],   strong:B[75],   outline:B[100],  separator:B[100],  'ct-default':B[750], 'ct-strong':B[900],  'ct-subtle':B[400], 'ct-faint':B[300], 'cm-bg':B.white, 'cm-bg-hover':B[25],  'cm-bg-pressed':B[50],  'cm-outline':B[100], 'cm-outline-hover':B[150], 'cm-outline-pressed':B[150], 'cm-separator':B[100] },
  card:    { bg:B.white, subtle:N[25],   strong:N[50],   outline:N[75],   separator:N[75],   'ct-default':N[700], 'ct-strong':N[850],  'ct-subtle':N[350], 'ct-faint':N[250], 'cm-bg':N[75],   'cm-bg-hover':N[100], 'cm-bg-pressed':N[150], 'cm-outline':N[200], 'cm-outline-hover':N[250], 'cm-outline-pressed':N[250], 'cm-separator':N[200] },
  modal:   { bg:B.white, subtle:N[25],   strong:N[50],   outline:N[75],   separator:N[75],   'ct-default':N[700], 'ct-strong':N[850],  'ct-subtle':N[350], 'ct-faint':N[250], 'cm-bg':B.white, 'cm-bg-hover':N[25],  'cm-bg-pressed':N[50],  'cm-outline':N[100], 'cm-outline-hover':N[150], 'cm-outline-pressed':N[150], 'cm-separator':N[100] },
  float:   { bg:B.white, subtle:N[25],   strong:N[50],   outline:N[75],   separator:N[75],   'ct-default':N[700], 'ct-strong':N[850],  'ct-subtle':N[350], 'ct-faint':N[250], 'cm-bg':N[75],   'cm-bg-hover':N[100], 'cm-bg-pressed':N[150], 'cm-outline':N[200], 'cm-outline-hover':N[250], 'cm-outline-pressed':N[250], 'cm-separator':N[200] },
  inverse: { bg:N[900],  subtle:N[850],  strong:N[800],  outline:N[750],  separator:N[750],  'ct-default':N[100], 'ct-strong':N[25],   'ct-subtle':N[350], 'ct-faint':N[450], 'cm-bg':N[850],  'cm-bg-hover':N[850], 'cm-bg-pressed':N[800], 'cm-outline':N[600], 'cm-outline-hover':N[550], 'cm-outline-pressed':N[550], 'cm-separator':N[600] },
};
const DARK_SURF = {
  base:    { bg:N[900],  subtle:N[850],  strong:N[800],  outline:N[750],  separator:N[750],  'ct-default':N[100], 'ct-strong':N[25],   'ct-subtle':N[200], 'ct-faint':N[300], 'cm-bg':N.black, 'cm-bg-hover':N[900], 'cm-bg-pressed':N[850], 'cm-outline':N[750], 'cm-outline-hover':N[700], 'cm-outline-pressed':N[700], 'cm-separator':N[750] },
  bright:  { bg:N[900],  subtle:N[850],  strong:N[800],  outline:N[800],  separator:N[750],  'ct-default':N[100], 'ct-strong':N[25],   'ct-subtle':N[200], 'ct-faint':N[300], 'cm-bg':B.black, 'cm-bg-hover':N[900], 'cm-bg-pressed':N[850], 'cm-outline':N[750], 'cm-outline-hover':N[700], 'cm-outline-pressed':N[700], 'cm-separator':N[750] },
  deep:    { bg:N.black, subtle:N[900],  strong:N[850],  outline:N[850],  separator:N[850],  'ct-default':N[75],  'ct-strong':N.white, 'ct-subtle':N[300], 'ct-faint':N[450], 'cm-bg':N[900],  'cm-bg-hover':N[850], 'cm-bg-pressed':N[800], 'cm-outline':N[800], 'cm-outline-hover':N[750], 'cm-outline-pressed':N[750], 'cm-separator':N[800] },
  dim:     { bg:N[900],  subtle:N[850],  strong:N[800],  outline:N[750],  separator:N[750],  'ct-default':N[100], 'ct-strong':N[25],   'ct-subtle':N[200], 'ct-faint':N[300], 'cm-bg':B.black, 'cm-bg-hover':N[900], 'cm-bg-pressed':N[850], 'cm-outline':N[750], 'cm-outline-hover':N[700], 'cm-outline-pressed':N[700], 'cm-separator':N[750] },
  accent:  { bg:B.black, subtle:B[900],  strong:B[850],  outline:B[800],  separator:B[800],  'ct-default':B[150], 'ct-strong':B[50],   'ct-subtle':B[400], 'ct-faint':B[500], 'cm-bg':B.black, 'cm-bg-hover':B[900], 'cm-bg-pressed':B[850], 'cm-outline':B[750], 'cm-outline-hover':B[700], 'cm-outline-pressed':B[700], 'cm-separator':B[750] },
  card:    { bg:N[800],  subtle:N[750],  strong:N[700],  outline:N[600],  separator:N[600],  'ct-default':N[50],  'ct-strong':B.white, 'ct-subtle':N[175], 'ct-faint':N[250], 'cm-bg':N[550],  'cm-bg-hover':N[450], 'cm-bg-pressed':N[400], 'cm-outline':N[350], 'cm-outline-hover':N[300], 'cm-outline-pressed':N[300], 'cm-separator':N[350] },
  modal:   { bg:N[850],  subtle:N[800],  strong:N[750],  outline:N[700],  separator:N[700],  'ct-default':N[75],  'ct-strong':B.white, 'ct-subtle':N[200], 'ct-faint':N[300], 'cm-bg':N[900],  'cm-bg-hover':N[850], 'cm-bg-pressed':N[800], 'cm-outline':N[700], 'cm-outline-hover':N[600], 'cm-outline-pressed':N[600], 'cm-separator':N[700] },
  float:   { bg:N[850],  subtle:N[800],  strong:N[750],  outline:N[700],  separator:N[700],  'ct-default':N[75],  'ct-strong':B.white, 'ct-subtle':N[200], 'ct-faint':N[300], 'cm-bg':N[900],  'cm-bg-hover':N[850], 'cm-bg-pressed':N[800], 'cm-outline':N[700], 'cm-outline-hover':N[600], 'cm-outline-pressed':N[600], 'cm-separator':N[700] },
  inverse: { bg:N[900],  subtle:N[850],  strong:N[800],  outline:N[800],  separator:N[750],  'ct-default':N[100], 'ct-strong':N[25],   'ct-subtle':N[175], 'ct-faint':N[300], 'cm-bg':N[850],  'cm-bg-hover':N[900], 'cm-bg-pressed':N[850], 'cm-outline':N[750], 'cm-outline-hover':N[700], 'cm-outline-pressed':N[700], 'cm-separator':N[750] },
};

// ─── 4. EXPECTED t1Picks STEP NUMBERS ─────────────────────────────────────────
const T1_LIGHT = {
  brand:   { fill:'500', content:'550', container:'50',    borderStep:'300', separatorStep:'100', onComponent:'white', onContainerStep:'600' },
  danger:  { fill:'500', content:'550', container:'50',    borderStep:'300', separatorStep:'100', onComponent:'white', onContainerStep:'550' },
  success: { fill:'600', content:'600', container:'50',    borderStep:'500', separatorStep:'100', onComponent:'white', onContainerStep:'700' },
  warning: { fill:'600', content:'600', container:'50',    borderStep:'300', separatorStep:'100', onComponent:'white', onContainerStep:'700' },
  info:    { fill:'600', content:'700', container:'50',    borderStep:'300', separatorStep:'100', onComponent:'white', onContainerStep:'600' },
  neutral: { fill:'500', content:'550', container:'50',    borderStep:'300', separatorStep:'100', onComponent:'white', onContainerStep:'600' },
};
const T1_DARK = {
  brand:   { fill:'500', content:'150', container:'black', borderStep:'750', separatorStep:'350', onComponent:'white', onContainerStep:'200' },
  danger:  { fill:'450', content:'150', container:'850',   borderStep:'450', separatorStep:'350', onComponent:'white', onContainerStep:'150' },
  success: { fill:'600', content:'150', container:'850',   borderStep:'450', separatorStep:'350', onComponent:'white', onContainerStep:'100' },
  warning: { fill:'600', content:'150', container:'900',   borderStep:'450', separatorStep:'350', onComponent:'white', onContainerStep:'175' },
  info:    { fill:'700', content:'150', container:'850',   borderStep:'550', separatorStep:'450', onComponent:'white', onContainerStep:'100' },
  neutral: { fill:'450', content:'150', container:'800',   borderStep:'450', separatorStep:'350', onComponent:'white', onContainerStep:'100' },
};

// ─── 5. PARSE CSS FILES ────────────────────────────────────────────────────────
function parseCss(relPath) {
  const css = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
  const light = {}, dark = {};
  let inDark = false;
  for (const line of css.split('\n')) {
    if (line.includes('[data-theme="dark"]')) { inDark = true; continue; }
    const m = line.match(/--([a-z][a-z0-9-]*):\s*(#[0-9A-Fa-f]{6})\b/i);
    if (m) (inDark ? dark : light)[m[1]] = m[2].toUpperCase();
  }
  return { light, dark };
}
const semCss  = parseCss('projects/writer-handhelds/semantic.css');
const surfCss = parseCss('projects/writer-handhelds/surfaces.css');
const primCss = parseCss('projects/writer-handhelds/primitives.css');
const config  = JSON.parse(fs.readFileSync(path.join(__dirname, '../projects/writer-handhelds/config.json'), 'utf8'));
const picks   = config.t1Picks || {};

// ─── 6. CHECK HELPER ──────────────────────────────────────────────────────────
let issues = 0, checked = 0;
const log = [];
function check(label, expected, actual) {
  checked++;
  const exp = (expected || '').toUpperCase();
  const act = (actual  || 'MISSING').toUpperCase();
  if (exp !== act) { log.push(`  ❌ ${label}\n       expected: ${exp}\n       actual:   ${act}`); issues++; }
}

// ─── 7. PRIMITIVES ────────────────────────────────────────────────────────────
const ROLES = ['brand','danger','success','warning','info','neutral'];
const STEPS = ['25','50','75','100','150','175','200','250','300','350','400','450','500','550','600','700','750','800','850','900'];
for (const role of ROLES) {
  const key = role.charAt(0).toUpperCase() + role.slice(1);
  for (const step of STEPS) {
    if (!C[key]?.[step]) continue;
    check(`[PRIM] --prim-${role}-${step}`, C[key][step], primCss.light[`prim-${role}-${step}`]);
  }
}

// ─── 8. SEMANTIC ──────────────────────────────────────────────────────────────
for (const [theme, spec, css] of [['LIGHT', LIGHT_SEM, semCss.light], ['DARK', DARK_SEM, semCss.dark]]) {
  for (const [role, slots] of Object.entries(spec)) {
    for (const [slot, expected] of Object.entries(slots)) {
      check(`[SEM ${theme}] --${role}-${slot}`, expected, css[`${role}-${slot}`]);
    }
  }
}

// ─── 9. SURFACES ──────────────────────────────────────────────────────────────
for (const [theme, spec, css] of [['LIGHT', LIGHT_SURF, surfCss.light], ['DARK', DARK_SURF, surfCss.dark]]) {
  for (const [name, slots] of Object.entries(spec)) {
    for (const [slot, expected] of Object.entries(slots)) {
      check(`[SURF ${theme}] --surface-${name}-${slot}`, expected, css[`surface-${name}-${slot}`]);
    }
  }
}

// ─── 10. CONFIG t1Picks ───────────────────────────────────────────────────────
for (const [theme, spec, section] of [['LIGHT', T1_LIGHT, picks.light], ['DARK', T1_DARK, picks.dark]]) {
  for (const [role, fields] of Object.entries(spec)) {
    const actual = section?.[role] || {};
    for (const [field, exp] of Object.entries(fields)) {
      check(`[CONFIG ${theme}] t1Picks.${role}.${field}`, exp, String(actual[field] ?? 'MISSING'));
    }
  }
}

// ─── 11. REPORT ───────────────────────────────────────────────────────────────
if (issues === 0) {
  console.log(`✅  All ${checked} values match the dev spec  (primitives + semantic + surfaces + config).`);
} else {
  console.log(`❌  ${issues} issue(s) found out of ${checked} checked:\n`);
  log.forEach(l => console.log(l));
}
process.exit(issues > 0 ? 1 : 0);
