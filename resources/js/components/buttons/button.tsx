import { cn } from '@/libs/utils';
import { Button as ButtonPrimitive, ButtonProps } from 'react-aria-components';

const Button = ({ className, ...props }: ButtonProps) => {
    return (
        <ButtonPrimitive
            className={cn('group cursor-pointer outline-none focus:ring-2 focus:ring-[#94A3B8] focus:ring-offset-2', className as string)}
            {...props}
        />
    );
};

export default Button;
