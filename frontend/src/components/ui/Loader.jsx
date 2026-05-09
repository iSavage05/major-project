import { Loader2, Brain, Sparkles, Cpu } from "lucide-react";

export const PageLoader = ({ label = "Loading..." }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 mx-auto mb-4 text-blue-600 dark:text-blue-400 animate-spin" />
        <p className="text-lg text-gray-700 dark:text-gray-300">{label}</p>
      </div>
    </div>
  );
};

export const Loader = ({ size = "md", variant = "default" }) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  if (variant === "ai") {
    return (
      <div className="flex items-center gap-1">
        <Brain
          className={`${sizeClasses[size]} text-purple-500 animate-pulse`}
        />
        <Sparkles
          className={`${sizeClasses[size]} text-blue-500 animate-bounce`}
          style={{ animationDelay: "0.1s" }}
        />
        <Cpu
          className={`${sizeClasses[size]} text-green-500 animate-pulse`}
          style={{ animationDelay: "0.2s" }}
        />
      </div>
    );
  }

  return <Loader2 className={`${sizeClasses[size]} animate-spin`} />;
};