import { cn } from '@/libs/utils';
import { Heading as HeadingPrimitive, HeadingProps } from 'react-aria-components';

const Heading = ({ className, ...props }: HeadingProps) => {
    return <HeadingPrimitive className={cn('text-[18px] leading-[28px] font-semibold text-[#0F172A]', className as string)} {...props} />;
};

export default Heading;
