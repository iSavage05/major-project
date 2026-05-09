import { cn } from '../../utils/cn';

const Input = ({ className, ...props }) => {
  return (
    <input
      className={cn(
        'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors',
        className
      )}
      {...props}
    />
  );
};

export default Input;
