import { cn } from '@/libs/utils';
import { TextArea as TextAreaPrimitive, TextAreaProps } from 'react-aria-components';

const TextArea = ({ className, ...props }: TextAreaProps) => {
    const onLoad = (element: HTMLTextAreaElement) => {
        if (!element) return;
        const support = CSS.supports('field-sizing');
        if (support) return;

        const abort = new AbortController();

        const resizeHandler = () => {
            element.style.height = 'auto';
            element.style.height = `${element.scrollHeight}px`;
        };

        element.addEventListener('input', resizeHandler, { signal: abort.signal });
        element.addEventListener('change', resizeHandler, { signal: abort.signal });
        element.addEventListener('focus', resizeHandler, { signal: abort.signal });
        element.addEventListener('blur', resizeHandler, { signal: abort.signal });

        resizeHandler();

        return () => {
            abort.abort();
        };
    };

    return (
        <TextAreaPrimitive
            ref={onLoad}
            className={cn(
                'field-sizing-content resize-none rounded-[6px] border border-[#CBD5E1] bg-white px-[12px] py-[8px] text-[16px] leading-[24px] text-[#0F172A] caret-[#0F172A] ring-[#94A3B8] ring-offset-1 outline-hidden placeholder:text-[#94A3B8] invalid:border-red-500 invalid:ring-red-500 focus:ring-2 disabled:cursor-not-allowed',
                className as string,
            )}
            {...props}
        />
    );
};

export default TextArea;
