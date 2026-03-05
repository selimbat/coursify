const CHECKBOX_PREFIX_REGEX = /^([-*]\s+\[[xX ]\]\s*)/;
const CHECKBOX_WITH_LABEL_REGEX = /^[-*]\s+\[[xX ]\]\s*(.*)/;
const CHECKBOX_REGEX = /^[-*]\s+\[[xX ]\]/;
const EMPTY_CHECKBOX_REGEX = /^[-*]\s+\[ \]\s*$/;

export function getCheckboxPrefix(line: string): string {
    const match = line.match(CHECKBOX_PREFIX_REGEX);
    return match ? match[1] : '';
}

export function getCheckboxLabel(line: string): string {
    const match = line.match(CHECKBOX_WITH_LABEL_REGEX);
    return match ? match[1] : '';
}

export function isCheckbox(line: string): boolean {
    return CHECKBOX_REGEX.test(line.trim());
}

export function isCheckboxWithLabel(line: string): boolean {
    const match = line.match(CHECKBOX_WITH_LABEL_REGEX);
    return !!match && match[1].trim().length > 0;
}

export function isChecked(line: string): boolean {
    return /^[-*]\s+\[[xX]\]/.test(line.trim());
}

export function isEmptyCheckbox(line: string): boolean {
    return EMPTY_CHECKBOX_REGEX.test(line.trim());
}

export function toggleCheckboxValue(line: string): string | undefined {
    if (!isCheckbox(line)) return undefined;
    return line.replace(/^([-*]\s+\[)([xX ])(\])/, (_, start: string, mark: string, end: string) => {
        const next = mark === ' ' ? 'x' : ' ';
        return `${start}${next}${end}`;
    });
}
