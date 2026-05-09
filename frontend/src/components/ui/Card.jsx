import { cn } from '../../utils/cn';

const Card = ({ children, className, ...props }) => {
  return (
    <div
      className={cn('bg-white dark:bg-dark-surface rounded-xl shadow-lg border border-gray-200 dark:border-dark-border p-6 transition-all duration-200', className)}
      {...props}
    >
      {children}
    </div>
  );
};

const CardHeader = ({ children, className }) => {
  return <div className={cn('mb-4', className)}>{children}</div>;
};

const CardTitle = ({ children, className }) => {
  return <h2 className={cn('text-xl font-bold text-gray-900 dark:text-dark-text', className)}>{children}</h2>;
};

const CardContent = ({ children, className }) => {
  return <div className={cn('', className)}>{children}</div>;
};

export { Card, CardHeader, CardTitle, CardContent };
