# Toolbar

A bar of controls, walked with the arrow keys.

```tsx
<Toolbar aria-label="Range">
  <Toolbar.Group>
    <ToggleButton size="sm">1h</ToggleButton>
    <ToggleButton size="sm" defaultSelected>
      24h
    </ToggleButton>
    <ToggleButton size="sm">7d</ToggleButton>
  </Toolbar.Group>
  <Toolbar.Separator />
  <Button size="sm" variant="ghost">
    Refresh
  </Button>
</Toolbar>
```

| Slot                | React Aria  | Notes                                   |
| ------------------- | ----------- | --------------------------------------- |
| `Toolbar`           | `Toolbar`   | The bar. `aria-label`, `orientation`    |
| `Toolbar.Group`     | —           | A run of controls that belongs together |
| `Toolbar.Separator` | `Separator` | The sheet's hairline, standing up       |

**The sheet has no toolbar class**, so the surface is an invention: its hairline, its square corners,
and its own controls inside it.

### One tab stop, and the arrow keys walk it

That is the whole reason to use this rather than a flex row: a bar of six controls costs a keyboard
user **one** press of Tab rather than six.

**But the toolbar itself is not focusable** — the roving tabindex lives on its children, so the entry
point is the first control. The first version of the `Keyboard` story called `bar.focus()`, and focus
stayed on the `body` with the arrow keys going nowhere. What is asserted is that the arrows move along
the row and stay inside the bar.

`Home` and `End` are **not** asserted: `End` did not reach the last control, and a test that presses a
key the component does not answer is worse than no test. That is the fourth such call here, after the
menu's type-ahead, the grid list's Space, and the breadcrumb's click.

### A segmented control is a group of toggles, and the exclusivity is the caller's

React Aria 1.22 has no `ToggleButtonGroup`, so one piece of state decides which is on. That is the
honest shape: a group of buttons is a layout, and "only one at a time" is a decision about the data
rather than about the markup.
