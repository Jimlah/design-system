import { cn } from '@/libs/utils';
import { SearchField as SearchFieldPrimitive, SearchFieldProps } from 'react-aria-components';

const SearchField = ({ className, ...props }: SearchFieldProps) => {
    return <SearchFieldPrimitive className={cn('disabled:opacity-50', className as string)} {...props} />;
};

export default SearchField;
