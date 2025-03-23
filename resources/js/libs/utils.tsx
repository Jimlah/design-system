import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...classes: string[]) => twMerge(clsx(...classes));

export { cn };
