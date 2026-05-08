import { cn } from '../../utils/cn';

const Card = ({ children, className, ...props }) => {
  return (
    <div
      className={cn('bg-white rounded-lg shadow-md p-6', className)}
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
  return <h2 className={cn('text-xl font-semibold text-gray-900', className)}>{children}</h2>;
};

const CardContent = ({ children, className }) => {
  return <div className={cn('', className)}>{children}</div>;
};

export { Card, CardHeader, CardTitle, CardContent };
