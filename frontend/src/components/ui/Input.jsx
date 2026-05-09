import { cn } from '../../utils/cn';

const Input = ({ className, ...props }) => {
  return (
    <input
      className={cn(
        'w-full px-4 py-2.5 border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-dark-surface dark:text-dark-text transition-all duration-200',
        className
      )}
      {...props}
    />
  );
};

export default Input;
