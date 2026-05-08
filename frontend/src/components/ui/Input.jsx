import { cn } from '../../utils/cn';

const Input = ({ className, ...props }) => {
  return (
    <input
      className={cn(
        'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
        className
      )}
      {...props}
    />
  );
};

export default Input;
