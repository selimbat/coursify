import {
    getCheckboxLabel,
    getCheckboxPrefix,
    isCheckbox,
    isCheckboxWithLabel,
    isChecked,
    isEmptyCheckbox,
    toggleCheckboxValue
} from './helpers';

interface ControllerContext {
    getLines: () => string[];
    setLines: (lines: string[]) => void;
    commitLines: () => void;
    getActiveIndex: () => number | null;
    setActiveIndex: (index: number | null) => void;
    getActiveLabelMode: () => boolean;
    setActiveLabelMode: (value: boolean) => void;
    inputRefs: Record<number, HTMLTextAreaElement | null>;
}

type Direction = 'up' | 'down';

type EdgeDirection = 'left' | 'right';

export function createEditorController(ctx: ControllerContext) {
    let touchActive = false;
    let prevCursorPos = -1;

    function registerTouchListeners() {
        const markTouchStart = () => {
            touchActive = true;
        };
        const markTouchEnd = () => {
            touchActive = false;
        };
        document.addEventListener('touchstart', markTouchStart, { passive: true });
        document.addEventListener('touchend', markTouchEnd, { passive: true });
        document.addEventListener('touchcancel', markTouchEnd, { passive: true });
        return () => {
            document.removeEventListener('touchstart', markTouchStart);
            document.removeEventListener('touchend', markTouchEnd);
            document.removeEventListener('touchcancel', markTouchEnd);
        };
    }

    function attachRef(index: number) {
        return (node: HTMLTextAreaElement) => {
            ctx.inputRefs[index] = node;
            return () => {
                ctx.inputRefs[index] = null;
            };
        };
    }

    function autoResize(textarea: HTMLTextAreaElement) {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    }

    function focusLine(index: number, cursorPos?: number) {
        ctx.setActiveIndex(index);
        prevCursorPos = -1;
        const textarea = ctx.inputRefs[index];
        if (!textarea) return;
        const lines = ctx.getLines();
        const line = lines[index];
        if (isCheckboxWithLabel(line)) {
            const prefix = getCheckboxPrefix(line);
            const label = getCheckboxLabel(line);
            const rawPos = cursorPos ?? prefix.length + label.length;
            if (rawPos <= prefix.length) {
                ctx.setActiveLabelMode(false);
                textarea.value = line;
                textarea.focus();
                textarea.selectionStart = textarea.selectionEnd = rawPos;
            } else {
                ctx.setActiveLabelMode(true);
                textarea.value = label;
                textarea.focus();
                textarea.selectionStart = textarea.selectionEnd = rawPos - prefix.length;
            }
            return;
        }
        ctx.setActiveLabelMode(false);
        textarea.focus();
        const pos = cursorPos ?? textarea.value.length;
        textarea.selectionStart = textarea.selectionEnd = pos;
    }

    function updateActiveLabelMode(index: number) {
        if (ctx.getActiveIndex() !== index) return;
        const textarea = ctx.inputRefs[index];
        if (!textarea || document.activeElement !== textarea) return;
        const line = ctx.getLines()[index];
        if (!isCheckboxWithLabel(line)) {
            if (ctx.getActiveLabelMode()) ctx.setActiveLabelMode(false);
            return;
        }
        const prefix = getCheckboxPrefix(line);
        const pos = textarea.selectionStart ?? 0;
        if (ctx.getActiveLabelMode() && pos === 0) {
            ctx.setActiveLabelMode(false);
            textarea.value = line;
            textarea.selectionStart = textarea.selectionEnd = prefix.length;
        } else if (!ctx.getActiveLabelMode() && pos > prefix.length) {
            ctx.setActiveLabelMode(true);
            const labelCursor = pos - prefix.length;
            textarea.value = getCheckboxLabel(line);
            textarea.selectionStart = textarea.selectionEnd = labelCursor;
        }
    }

    function handleSelectionChange(index: number) {
        if (ctx.getActiveIndex() !== index) return;
        const textarea = ctx.inputRefs[index];
        if (!textarea || document.activeElement !== textarea) return;
        updateActiveLabelMode(index);
        if (!touchActive) return;
        const position = textarea.selectionStart ?? 0;
        const previous = prevCursorPos;
        prevCursorPos = position;
        if (previous < 0) return;
        if (position === 0 && previous <= 1 && index > 0) {
            prevCursorPos = -1;
            focusLine(index - 1, ctx.getLines()[index - 1].length);
            return;
        }
        const lineLength = textarea.value.length;
        if (position === lineLength && previous >= lineLength - 1 && index < ctx.getLines().length - 1) {
            prevCursorPos = -1;
            focusLine(index + 1, 0);
        }
    }

    function handleInput(index: number, event: Event) {
        const textarea = event.target as HTMLTextAreaElement;
        const lines = ctx.getLines();
        if (ctx.getActiveLabelMode() && isCheckboxWithLabel(lines[index])) {
            lines[index] = getCheckboxPrefix(lines[index]) + textarea.value;
        } else {
            lines[index] = textarea.value;
        }
        ctx.commitLines();
    }

    function handleEnterKey(index: number, textarea: HTMLTextAreaElement) {
        const lines = ctx.getLines();
        const fullLine = lines[index];
        const inLabelMode = ctx.getActiveLabelMode() && isCheckboxWithLabel(fullLine);
        const prefixLength = inLabelMode ? getCheckboxPrefix(fullLine).length : 0;
        const cursor = (textarea.selectionStart ?? textarea.value.length) + prefixLength;
        const before = fullLine.slice(0, cursor);
        const after = fullLine.slice(cursor);
        if (isEmptyCheckbox(fullLine)) {
            lines[index] = '';
            ctx.commitLines();
            focusLine(index, 0);
            return;
        }
        const checkbox = isCheckbox(fullLine);
        lines[index] = before;
        lines.splice(index + 1, 0, checkbox && cursor > 5 ? `- [ ] ${after}` : after);
        ctx.commitLines();
        focusLine(index + 1, checkbox ? 6 : 0);
    }

    function mergeWithPreviousLine(index: number, textarea: HTMLTextAreaElement) {
        const lines = ctx.getLines();
        const previousLength = lines[index - 1].length;
        lines[index - 1] = lines[index - 1] + lines[index];
        lines.splice(index, 1);
        ctx.commitLines();
        ctx.setActiveIndex(index - 1);
        const previous = ctx.inputRefs[index - 1];
        if (previous) {
            autoResize(previous);
            previous.focus();
            previous.selectionStart = previous.selectionEnd = previousLength;
        }
    }

    function swapLine(index: number, direction: Direction, textarea: HTMLTextAreaElement) {
        const lines = ctx.getLines();
        const cursor =
            ctx.getActiveLabelMode() && isCheckboxWithLabel(lines[index])
                ? (textarea.selectionStart ?? 0) + getCheckboxPrefix(lines[index]).length
                : textarea.selectionStart ?? 0;
        if (direction === 'up') {
            [lines[index - 1], lines[index]] = [lines[index], lines[index - 1]];
            ctx.commitLines();
            focusLine(index - 1, cursor);
            return;
        }
        [lines[index], lines[index + 1]] = [lines[index + 1], lines[index]];
        ctx.commitLines();
        focusLine(index + 1, cursor);
    }

    function handleArrowNavigation(index: number, textarea: HTMLTextAreaElement, key: 'ArrowUp' | 'ArrowDown') {
        const targetIndex = key === 'ArrowUp' ? index - 1 : index + 1;
        const lines = ctx.getLines();
        const rawCursor =
            ctx.getActiveLabelMode() && isCheckboxWithLabel(lines[index])
                ? (textarea.selectionStart ?? 0) + getCheckboxPrefix(lines[index]).length
                : textarea.selectionStart ?? 0;
        focusLine(targetIndex, rawCursor);
    }

    function handleEdgeNavigation(index: number, textarea: HTMLTextAreaElement, direction: EdgeDirection) {
        const isAtStart = textarea.selectionStart === 0 && textarea.selectionEnd === 0;
        const isAtEnd =
            textarea.selectionStart === textarea.value.length &&
            textarea.selectionEnd === textarea.value.length;
        if (direction === 'left' && isAtStart && index > 0) {
            focusLine(index - 1, ctx.getLines()[index - 1].length);
            return true;
        }
        if (direction === 'right' && isAtEnd && index < ctx.getLines().length - 1) {
            focusLine(index + 1, 0);
            return true;
        }
        return false;
    }

    function handleKeydown(index: number, event: KeyboardEvent, externalKeydown?: (event: KeyboardEvent) => void) {
        externalKeydown?.(event);
        if (event.defaultPrevented) return;
        const textarea = ctx.inputRefs[index];
        if (!textarea) return;
        if (event.key === 'Enter') {
            event.preventDefault();
            handleEnterKey(index, textarea);
            return;
        }
        if (
            event.key === 'Backspace' &&
            textarea.selectionStart === 0 &&
            textarea.selectionEnd === 0 &&
            index > 0 &&
            (!isCheckboxWithLabel(ctx.getLines()[index]) || !ctx.getActiveLabelMode())
        ) {
            event.preventDefault();
            mergeWithPreviousLine(index, textarea);
            return;
        }
        if (event.altKey && event.key === 'ArrowUp' && index > 0) {
            event.preventDefault();
            swapLine(index, 'up', textarea);
            return;
        }
        if (event.altKey && event.key === 'ArrowDown' && index < ctx.getLines().length - 1) {
            event.preventDefault();
            swapLine(index, 'down', textarea);
            return;
        }
        if (event.key === 'ArrowUp' && index > 0) {
            event.preventDefault();
            handleArrowNavigation(index, textarea, 'ArrowUp');
            return;
        }
        if (event.key === 'ArrowDown' && index < ctx.getLines().length - 1) {
            event.preventDefault();
            handleArrowNavigation(index, textarea, 'ArrowDown');
            return;
        }
        if (event.key === 'ArrowLeft' && handleEdgeNavigation(index, textarea, 'left')) {
            event.preventDefault();
            return;
        }
        if (event.key === 'ArrowRight' && handleEdgeNavigation(index, textarea, 'right')) {
            event.preventDefault();
        }
    }

    function handleBlur(event: FocusEvent) {
        const related = event.relatedTarget as HTMLElement | null;
        if (!related || !related.closest('[data-markdown-editor]')) {
            ctx.setActiveIndex(null);
            ctx.setActiveLabelMode(false);
        }
    }

    function toggleCheckbox(index: number) {
        const lines = ctx.getLines();
        const newLine = toggleCheckboxValue(lines[index]);
        if (!newLine) return;
        lines[index] = newLine;
        ctx.commitLines();
        if (ctx.getActiveIndex() === index && !ctx.getActiveLabelMode()) {
            const ta = ctx.inputRefs[index];
            if (ta) {
                const pos = ta.selectionStart ?? 0;
                ta.value = newLine;
                ta.selectionStart = ta.selectionEnd = pos;
            }
        }
    }

    function activateOnKey(index: number, event: KeyboardEvent) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            focusLine(index);
        }
    }

    return {
        registerTouchListeners,
        attachRef,
        focusLine,
        updateActiveLabelMode,
        handleSelectionChange,
        handleInput,
        handleKeydown,
        handleBlur,
        toggleCheckbox,
        activateOnKey
    };
}

export { isCheckboxWithLabel, isChecked, getCheckboxLabel } from './helpers';
