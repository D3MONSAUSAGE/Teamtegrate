
interface ProjectsErrorProps {
  error: string;
  onRetry: () => void;
}

export const ProjectsError = ({ error, onRetry }: ProjectsErrorProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
      <div className="bg-red-50 p-6 rounded-lg border border-red-200 text-center max-w-md">
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={onRetry}
          className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
        >
          Retry
        </button>
      </div>
    </div>
  );
};
