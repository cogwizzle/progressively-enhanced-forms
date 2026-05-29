# progressively-enhanced-forms

Zero-configuration web components that automatically save and restore HTML form state using `localStorage`. Drop them into any HTML page — no JavaScript wiring required.

## Installation

```sh
npm install progressively-enhanced-forms
```

Or load directly from a CDN:

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/progressively-enhanced-forms/src/index.js"></script>
```

## Quick start

```html
<!DOCTYPE html>
<html lang="en">
<body>
  <local-storage-form>
    <form id="profile">
      <input type="text" name="username" placeholder="Username">
      <button type="submit">Save</button>
    </form>
  </local-storage-form>

  <script type="module" src="node_modules/progressively-enhanced-forms/src/index.js"></script>
</body>
</html>
```

That's it. When the user submits the form, their data is saved to `localStorage`. When they return to the page, their values are restored automatically.

## Elements

### `<local-storage-form>`

Wraps a `<form>` to add automatic save and restore behavior.

- **On submit** — serializes all field values and saves them to `localStorage` under the form's `id`
- **On page load** — reads `localStorage` and restores saved values into each field

**Requirements:**
- The wrapped `<form>` must have an `id` attribute — this becomes the `localStorage` key
- No shadow DOM — your existing CSS reaches form fields naturally

```html
<local-storage-form>
  <form id="settings">
    <label>
      Display name
      <input type="text" name="display-name">
    </label>

    <label>
      Role
      <select name="role">
        <option value="viewer">Viewer</option>
        <option value="editor">Editor</option>
        <option value="admin">Admin</option>
      </select>
    </label>

    <label>
      <input type="checkbox" name="newsletter" value="yes">
      Subscribe to newsletter
    </label>

    <button type="submit">Save settings</button>
  </form>
</local-storage-form>
```

Saved to `localStorage` as:

```json
{ "display-name": "alice", "role": "editor", "newsletter": "yes" }
```

Multiple forms can live inside one `<local-storage-form>` — each is stored under its own `id`.

### `<repeating-section>`

Manages a dynamic list of cloned template rows with automatic persistence. Each row is based on a `<template>` you define, and rows are saved and restored independently of `<local-storage-form>`.

| Attribute | Required | Description |
|-----------|----------|-------------|
| `name`    | yes      | Identifies this section. Determines the `localStorage` key suffix: `{formId}.{name}` |

**Requirements:**
- Must be inside a `<form id="...">` 
- Define row fields in a `<template>` as the first direct child — use standard `name` attributes
- Add a `data-add` attribute to any element to make it the "add row" button — you control its markup and placement

```html
<form id="order">
  <repeating-section name="items">
    <template>
      <label>Item <input name="item-name" type="text"></label>
      <label>Qty  <input name="item-qty"  type="number" min="1"></label>
    </template>
    <button type="button" data-add>Add item</button>
  </repeating-section>

  <button type="submit">Place order</button>
</form>
```

Each row gets a **Remove** button automatically. Empty rows are not saved.

#### Using `<repeating-section>` inside `<local-storage-form>`

The two elements work together without any extra configuration. `<local-storage-form>` automatically excludes repeating section fields from its own storage to prevent duplication — each element manages its own slice of `localStorage`.

```html
<local-storage-form>
  <form id="profile">
    <input type="text" name="bio" placeholder="Bio">

    <repeating-section name="contacts">
      <template>
        <label>Name  <input name="contact-name"  type="text"></label>
        <label>Email <input name="contact-email" type="email"></label>
      </template>
      <button type="button" data-add>Add contact</button>
    </repeating-section>

    <button type="submit">Save</button>
  </form>
</local-storage-form>
```

`localStorage` keys for this example:

| Key                | Contents                        |
|--------------------|---------------------------------|
| `profile`          | `{ "bio": "..." }`              |
| `profile.contacts` | `[{ "contact-name": "Alice" }]` |

## Supported field types

| Field                            | Saved as          |
|----------------------------------|-------------------|
| `<input type="text">` and variants | string          |
| `<textarea>`                     | string            |
| `<select>`                       | string            |
| `<input type="radio">` group     | string            |
| `<input type="checkbox">` single | string            |
| `<input type="checkbox">` group  | array of strings  |

## Editor support

The package ships a `custom-elements.json` ([Custom Elements Manifest](https://custom-elements-manifest.open-wc.org/)) that enables autocomplete and hover documentation for both elements in supported editors.

**Neovim** — install [`wc-language-server`](https://github.com/wc-toolkit/wc-language-server) via Mason. It reads `custom-elements.json` automatically from your project root.

**VS Code** — install the [Web Components extension](https://marketplace.visualstudio.com/items?itemName=runem.lit-plugin) or add to `.vscode/settings.json`:

```json
{ "html.customData": ["node_modules/progressively-enhanced-forms/vscode-html-data.json"] }
```

## License

MIT
