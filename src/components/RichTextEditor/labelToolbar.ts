// Quill draws its toolbar as icon-only buttons and pickers without accessible names. Quill builds
// the toolbar after mount, so this runs on whatever is in the container now and again whenever the
// container changes. It never overwrites a label that is already there.

const BUTTON_LABELS: Array<[selector: string, label: string]> = [
    ["button.ql-bold", "Bold"],
    ["button.ql-italic", "Italic"],
    ["button.ql-underline", "Underline"],
    ["button.ql-strike", "Strikethrough"],
    ["button.ql-link", "Insert link"],
    ['button.ql-list[value="ordered"]', "Numbered list"],
    ['button.ql-list[value="bullet"]', "Bulleted list"],
];

const PICKER_LABELS: Array<[selector: string, label: string]> = [
    [".ql-size", "Text size"],
    [".ql-align", "Text alignment"],
];

export function labelToolbar(root: ParentNode, editorLabel = "Message body"): void {
    for (const [selector, label] of BUTTON_LABELS) {
        root.querySelectorAll(selector).forEach((el) => {
            if (!el.hasAttribute("aria-label")) el.setAttribute("aria-label", label);
        });
    }
    for (const [selector, label] of PICKER_LABELS) {
        root.querySelectorAll(`.ql-picker${selector} .ql-picker-label`).forEach((el) => {
            if (!el.hasAttribute("aria-label")) el.setAttribute("aria-label", label);
        });
    }
    root.querySelectorAll(".ql-editor").forEach((el) => {
        if (!el.hasAttribute("aria-label")) el.setAttribute("aria-label", editorLabel);
    });
}
