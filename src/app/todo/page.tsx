import KanbanBoardSupabase from "@/components/KanbanBoardSupabase";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function TodoPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-black">
        <KanbanBoardSupabase />
      </div>
    </ProtectedRoute>
  );
}
