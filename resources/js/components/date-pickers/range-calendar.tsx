import { CalendarDate, getLocalTimeZone, today } from '@internationalized/date';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { memo, useCallback, useContext, useMemo, useState } from 'react';
import {
    CalendarCell,
    CalendarGrid,
    CalendarGridBody,
    CalendarGridHeader,
    CalendarHeaderCell,
    DateValue,
    Disclosure,
    DisclosureGroup,
    DisclosurePanel,
    Group,
    ListLayout,
    Radio,
    RadioGroup,
    RangeCalendar as RangeCalendarPrimitve,
    RangeCalendarProps,
    RangeCalendarStateContext,
    Virtualizer,
} from 'react-aria-components';
import Button from '../buttons/button';
import Heading from '../texts/heading';

const RangeCalendar = <T extends DateValue>({ ...props }: RangeCalendarProps<T>) => {
    const [state, setState] = useState<boolean>(false);
    const close = () => setState(false);
    return (
        <RangeCalendarPrimitve aria-label="Appointment date" {...props} className="rounded-[6px] border border-[#E2E8F0] p-2 text-sm outline-none">
            <header className="flex items-center justify-between gap-5">
                {/* <ToggleButton className="flex cursor-pointer items-center gap-1 outline-none" isSelected={state} onChange={setState}>
                    <Heading className="text-sm font-semibold" />
                    <ChevronDown className="size-4" />
                </ToggleButton> */}
                <Heading className="text-sm font-semibold" />
                <Group className="flex items-center gap-1">
                    <Button
                        slot="previous"
                        className="flex size-6 items-center justify-center rounded-[6px] text-gray-300 transition-all duration-150 hover:bg-gray-200 hover:text-gray-500"
                    >
                        <ChevronLeft className="size-4" />
                    </Button>

                    <Button
                        slot="next"
                        className="flex size-6 items-center justify-center rounded-[6px] text-gray-300 transition-all duration-150 hover:bg-gray-200 hover:text-gray-500"
                    >
                        <ChevronRight className="size-4" />
                    </Button>
                </Group>
            </header>
            {state ? <DateSelection close={close} /> : <Cal />}
        </RangeCalendarPrimitve>
    );
};

export default RangeCalendar;

const DateSelection = memo(({ close }: { close: () => void }) => {
    const state = useContext(RangeCalendarStateContext)!;

    const years = useMemo(() => {
        const year = today(getLocalTimeZone()).year - 100;
        return Array.from({ length: 200 }, (_, i) => year + i);
    }, []);
    const months = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
    const monthsInShortWords = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const onLoad = useCallback((e: HTMLDivElement) => {
        queueMicrotask(() => {
            if (!e) return;
            if (e.dataset.expanded !== 'true') return;
            e.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
    }, []);

    return (
        <Virtualizer
            layout={ListLayout}
            layoutOptions={{
                estimatedRowHeight: 280,
            }}
        >
            <DisclosureGroup
                className="aspect-square size-[280px] divide-y divide-[#E2E8F0] overflow-y-auto py-2"
                expandedKeys={[state.visibleRange.start.year]}
                allowsMultipleExpanded={false}
                onExpandedChange={(keys) =>
                    state.setFocusedDate(
                        new CalendarDate(Array.from(keys)[0] as number, state.visibleRange.start.month, state.visibleRange.start.day),
                    )
                }
            >
                {years.map((year) => (
                    <Disclosure id={year} key={year} className="w-full overflow-hidden" ref={onLoad}>
                        <Heading className="w-full overflow-hidden outline-none">
                            <Button
                                slot="trigger"
                                className="flex w-full cursor-pointer items-center justify-start gap-1 px-[12px] py-[8px] text-xs focus:ring-0"
                            >
                                <ChevronDown className="size-4" />
                                <span>{year}</span>
                            </Button>
                        </Heading>
                        <DisclosurePanel className="w-full p-2">
                            <RadioGroup
                                aria-label="Months"
                                className="grid grid-cols-3 gap-2"
                                value={state.visibleRange.start.month + ''}
                                onChange={(v) => {
                                    state.setFocusedDate(new CalendarDate(year, Number(v), state.visibleRange.start.day));
                                    close();
                                }}
                            >
                                {months.map((month, index) => (
                                    <Radio
                                        value={month + ''}
                                        key={index}
                                        className="selected:bg-gray-900 selected:text-white flex cursor-pointer items-center rounded-[6px] border border-[#E2E8F0] px-2 py-0.5"
                                    >
                                        {monthsInShortWords[index]}
                                    </Radio>
                                ))}
                            </RadioGroup>
                        </DisclosurePanel>
                    </Disclosure>
                ))}
            </DisclosureGroup>
        </Virtualizer>
    );
});

const Cal = () => {
    return (
        <CalendarGrid className="w-full">
            <CalendarGridHeader className="w-full">
                {(day) => (
                    <CalendarHeaderCell className="outline-none">
                        <span className="flex size-10 items-center justify-center text-sm">{day}</span>
                    </CalendarHeaderCell>
                )}
            </CalendarGridHeader>
            <CalendarGridBody className="w-full">
                {(date) => (
                    <CalendarCell className="group my-[1px] outline-none" date={date} data-today={date.compare(today(getLocalTimeZone()))}>
                        <span className="in-selected:bg-gray-200 in-selection-start:in-selected:bg-gray-900 in-selection-start:hover:bg-gray-900 in-selection-end:hover:bg-gray-900 in-selection-end:in-selected:text-white in-selection-end:in-selected:bg-gray-900 in-selection-start:in-selected:text-white in-unavailable:line-through in-unavailable:opacity-50 in-selected:text-black in-selected:group-data-[today=0]:after:bg-white in-outside-month:opacity-50 in-unavailable:hover:bg-transparent in-outside-month:hover:bg-transparent in-unavailable:cursor-not-allowed in-selection-start:rounded-l-[6px] in-selection-end:rounded-r-[6px] relative flex size-10 cursor-pointer items-center justify-center text-sm after:absolute after:bottom-1 after:inline-block after:size-0.5 after:rounded-full group-data-[today=0]:after:bg-black hover:bg-gray-200">
                            {date.day}
                        </span>
                    </CalendarCell>
                )}
            </CalendarGridBody>
        </CalendarGrid>
    );
};
