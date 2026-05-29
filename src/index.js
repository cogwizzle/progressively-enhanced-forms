/**
 * @module progressively-enhanced-forms
 *
 * Registers both custom elements:
 * - `<local-storage-form>` — persists and restores form field values via localStorage
 * - `<repeating-section>` — manages a dynamic list of cloned template rows with persistence
 *
 * Import this module once to activate both elements with no further setup required.
 *
 * @example
 * // In your HTML:
 * // <script type="module" src="index.js"></script>
 *
 * @example
 * // As an ES module:
 * import 'progressively-enhanced-forms'
 */
import './local-storage-form.js'
import './repeating-section.js'
