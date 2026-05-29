// Reusable empty state component
interface EmptyStateProps {
  message: string;
  icon?: string;
}

export function EmptyState({ message, icon = 'pi-inbox' }: EmptyStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <i className={`pi ${icon} text-4xl text-text-tertiary mb-3`}></i>
      <p className="text-text-secondary text-sm">{message}</p>
    </div>
  );
}
