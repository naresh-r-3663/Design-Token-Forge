import { useState } from 'react';
import {
  Alert, Avatar, Badge, Button, Card, Checkbox, DatePicker, Divider,
  FileUpload, IconButton, Input, Kbd, MenuButton, ProgressBar,
  ProgressRing, Radio, Select, Skeleton, Slider, Spinner, SplitButton,
  Textarea, Toast, Toggle, Tooltip,
} from '@design-token-forge/react';
import type { SemanticRole, SurfaceVariant, DensitySize } from '@design-token-forge/react';

const ROLES: SemanticRole[] = ['brand', 'danger', 'success', 'warning', 'info', 'neutral'];
const VARIANTS: SurfaceVariant[] = ['filled', 'outlined', 'soft', 'ghost'];
const SIZES: DensitySize[] = ['small', 'base', 'large'];

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="dtf-section">
    <h2 className="dtf-section-title">{title}</h2>
    <div className="dtf-section-body">{children}</div>
  </section>
);

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="dtf-row">
    <span className="dtf-row-label">{label}</span>
    <div className="dtf-row-items">{children}</div>
  </div>
);

export function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [role, setRole] = useState<SemanticRole>('brand');
  const [variant, setVariant] = useState<SurfaceVariant>('filled');
  const [size, setSize] = useState<DensitySize>('base');
  const [checked, setChecked] = useState(false);
  const [sliderVal, setSliderVal] = useState(40);
  const [inputVal, setInputVal] = useState('');
  const [toastVisible, setToastVisible] = useState(true);

  return (
    <div data-theme={theme} style={{ minHeight: '100vh', background: 'var(--color-white)' }}>
      {/* ── Controls ──────────────────────────────────────────── */}
      <header className="dtf-header">
        <h1>DTF React Wrappers — Live Demo</h1>
        <div className="dtf-controls">
          <label>
            Theme
            <select value={theme} onChange={e => setTheme(e.target.value as 'light' | 'dark')}>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
          <label>
            Role
            <select value={role} onChange={e => setRole(e.target.value as SemanticRole)}>
              {ROLES.map(r => <option key={r}>{r}</option>)}
            </select>
          </label>
          <label>
            Variant
            <select value={variant} onChange={e => setVariant(e.target.value as SurfaceVariant)}>
              {VARIANTS.map(v => <option key={v}>{v}</option>)}
            </select>
          </label>
          <label>
            Size
            <select value={size} onChange={e => setSize(e.target.value as DensitySize)}>
              {SIZES.map(s => <option key={s}>{s}</option>)}
            </select>
          </label>
        </div>
      </header>

      <main className="dtf-main">

        {/* ── Buttons ───────────────────────────────────────── */}
        <Section title="Button family">
          <Row label="Button roles">
            {ROLES.map(r => (
              <Button key={r} colorRole={r} variant={variant} size={size}>{r}</Button>
            ))}
          </Row>
          <Row label="Button variants">
            {VARIANTS.map(v => (
              <Button key={v} colorRole={role} variant={v} size={size}>{v}</Button>
            ))}
          </Row>
          <Row label="States">
            <Button colorRole={role} variant={variant} size={size}>Default</Button>
            <Button colorRole={role} variant={variant} size={size} disabled>Disabled</Button>
            <Button colorRole={role} variant={variant} size={size} loading>Loading</Button>
            <Button colorRole={role} variant={variant} size={size} rounded>Rounded</Button>
          </Row>
          <Row label="Icon Button">
            {ROLES.map(r => (
              <IconButton key={r} colorRole={r} variant={variant} size={size} aria-label={r}>
                ★
              </IconButton>
            ))}
          </Row>
          <Row label="Split Button">
            <SplitButton colorRole={role} variant={variant} size={size}>Split Action</SplitButton>
            <SplitButton colorRole="danger" variant="outlined" size={size}>Delete</SplitButton>
          </Row>
          <Row label="Menu Button">
            <MenuButton colorRole={role} variant={variant} size={size}>Menu</MenuButton>
            <MenuButton colorRole={role} variant="outlined" size={size} showChevron>Open Menu</MenuButton>
          </Row>
        </Section>

        {/* ── Form Controls ─────────────────────────────────── */}
        <Section title="Form controls">
          <Row label="Toggle (Switch)">
            {ROLES.map(r => (
              <Toggle key={r} colorRole={r} checked={checked} onChange={() => setChecked(c => !c)} label={r} />
            ))}
          </Row>
          <Row label="Checkbox">
            <Checkbox colorRole={role} checked={checked} onChange={() => setChecked(c => !c)} label="Check me" />
            <Checkbox colorRole={role} checked={false} indeterminate label="Indeterminate" onChange={() => {}} />
            <Checkbox colorRole={role} checked={false} disabled label="Disabled" onChange={() => {}} />
          </Row>
          <Row label="Radio">
            <Radio colorRole={role} name="demo" value="a" label="Option A" />
            <Radio colorRole={role} name="demo" value="b" label="Option B" />
            <Radio colorRole={role} name="demo" value="c" disabled label="Disabled" />
          </Row>
          <Row label="Input">
            <Input size={size} placeholder="Type something…" value={inputVal} onChange={e => setInputVal(e.target.value)} label="Label" />
            <Input size={size} placeholder="With error" error label="Error state" />
            <Input size={size} placeholder="Disabled" disabled label="Disabled" />
          </Row>
          <Row label="Textarea">
            <Textarea size={size} placeholder="Multi-line text…" label="Textarea" />
          </Row>
          <Row label="Select">
            <Select size={size} label="Pick one">
              <option value="">Choose…</option>
              <option value="a">Alpha</option>
              <option value="b">Beta</option>
            </Select>
          </Row>
          <Row label="Slider">
            <Slider
              size={size}
              min={0}
              max={100}
              value={sliderVal}
              onChange={e => setSliderVal(Number(e.target.value))}
              label={`Slider: ${sliderVal}`}
            />
          </Row>
        </Section>

        {/* ── Display ───────────────────────────────────────── */}
        <Section title="Display">
          <Row label="Avatar">
            <Avatar size={size} initials="AB" />
            <Avatar size={size} src="https://i.pravatar.cc/150?img=3" alt="User" />
            <Avatar size={size} initials="CD" status="online" />
            <Avatar size={size} initials="EF" status="busy" badgeCount={3} />
          </Row>
          <Row label="Badge">
            {ROLES.map(r => (
              <Badge key={r} colorRole={r} variant={variant}>{r}</Badge>
            ))}
          </Row>
          <Row label="Tooltip">
            <Tooltip id="tip1" content="This is a tooltip" placement="top">
              <Button colorRole={role} variant="outlined" size={size}>Hover me</Button>
            </Tooltip>
          </Row>
          <Row label="Kbd">
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
            <Kbd>Shift</Kbd>
            <Kbd>Enter</Kbd>
          </Row>
        </Section>

        {/* ── Feedback ──────────────────────────────────────── */}
        <Section title="Feedback">
          <Row label="Alert">
            {ROLES.map(r => (
              <Alert key={r} colorRole={r} title={`${r} alert`} onDismiss={() => {}}>
                This is a {r} message.
              </Alert>
            ))}
          </Row>
          <Row label="Toast">
            {toastVisible && (
              <Toast colorRole={role} title="Update complete" actionLabel="Undo" onAction={() => {}} onDismiss={() => setToastVisible(false)}>
                Your changes were saved.
              </Toast>
            )}
            {!toastVisible && (
              <Button size="small" colorRole="neutral" variant="outlined" onClick={() => setToastVisible(true)}>
                Show toast
              </Button>
            )}
          </Row>
          <Row label="Progress Bar">
            <ProgressBar value={65} size={size} colorRole={role} label="Upload progress" />
            <ProgressBar value={30} size={size} colorRole="success" label="Success" />
            <ProgressBar indeterminate size={size} colorRole={role} label="Loading…" />
          </Row>
          <Row label="Progress Ring">
            <ProgressRing value={75} size={size} colorRole={role} label="75%" />
            <ProgressRing value={30} size={size} colorRole="danger" label="30%" />
            <ProgressRing indeterminate size={size} colorRole={role} label="Loading" />
          </Row>
          <Row label="Spinner">
            {ROLES.map(r => <Spinner key={r} size={size} colorRole={r} label={`${r} loading`} />)}
          </Row>
          <Row label="Skeleton">
            <Skeleton variant="text" width="200px" />
            <Skeleton variant="rect" width="200px" height="80px" />
            <Skeleton variant="circle" width="48px" height="48px" />
            <Skeleton variant="text" lines={3} width="200px" />
          </Row>
        </Section>

        {/* ── Layout ────────────────────────────────────────── */}
        <Section title="Layout">
          <Row label="Card variants">
            {(['flat', 'raised', 'strong', 'outlined'] as const).map(v => (
              <Card key={v} variant={v} style={{ padding: '16px', minWidth: '120px' }}>
                <strong>{v}</strong>
                <p style={{ margin: '4px 0 0', fontSize: '13px' }}>Card content</p>
              </Card>
            ))}
          </Row>
          <Row label="Divider">
            <div style={{ width: '300px' }}>
              <p>Above</p>
              <Divider />
              <p>Below (solid)</p>
              <Divider variant="dashed" />
              <p>Below (dashed)</p>
              <Divider label="OR" />
              <p>With label</p>
            </div>
          </Row>
          <Row label="File Upload">
            <FileUpload mode="button" size={size} onFiles={files => console.log('Files:', files)}>
              Upload file
            </FileUpload>
            <FileUpload mode="dropzone" size={size} onFiles={files => console.log('Files:', files)} />
          </Row>
          <Row label="Date Picker">
            <DatePicker size={size} mode="popup" label="Pick a date" />
          </Row>
        </Section>

      </main>
    </div>
  );
}
