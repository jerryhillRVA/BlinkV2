import React from "react";
import { Button } from "@/app/components/ui/button";
import { Plus, Layout, Calendar, Library, Settings, ChevronRight, Globe, LayoutGrid, BarChart3, Target } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { DashboardTab } from "@/app/components/SetupHeader";

// Mock workspaces based on previous context
const WORKSPACES = [
  { id: "hive", name: "Hive Collective", color: "bg-[#d94e33]" },
  { id: "booze", name: "Booze Kills", color: "bg-[#2b6bff]" }
];

interface HomeProps {
  onSelectWorkspace: (name: string, tab: DashboardTab) => void;
  onAddWorkspace: () => void;
}

export function Home({ onSelectWorkspace, onAddWorkspace }: HomeProps) {
  return (
    <div className="max-w-6xl mx-auto space-y-12 py-10">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center p-3 bg-[#d94e33]/10 rounded-2xl mb-2">
          <LayoutGrid className="size-8 text-[#d94e33]" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
          Welcome to Blink Social
        </h1>
        <p className="text-gray-500 text-lg max-w-2xl mx-auto">
          Your command center for multi-platform content strategy and AI-driven growth.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Add Workspace Tile */}
        <motion.button
          whileHover={{ y: -5 }}
          onClick={onAddWorkspace}
          className="group relative flex flex-col items-center justify-center p-10 rounded-3xl border-2 border-dashed border-gray-200 hover:border-[#d94e33] hover:bg-[#d94e33]/5 transition-all h-[320px] bg-white/50 backdrop-blur-sm"
        >
          <div className="size-16 rounded-full bg-gray-50 group-hover:bg-[#d94e33]/10 flex items-center justify-center transition-colors mb-6">
            <Plus className="size-8 text-gray-400 group-hover:text-[#d94e33]" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#d94e33]">New Workspace</h3>
          <p className="text-sm text-muted-foreground mt-2 text-center">Initialize a new content strategy and AI team.</p>
        </motion.button>

        {/* Existing Workspace Tiles */}
        {WORKSPACES.map((workspace) => (
          <motion.div
            key={workspace.id}
            whileHover={{ y: -5 }}
            className="group relative flex flex-col rounded-3xl border border-gray-100 bg-white shadow-sm hover:shadow-xl transition-all overflow-hidden"
          >
            {/* Header / Banner */}
            <div className={cn("h-24 w-full px-6 py-4 flex items-center relative overflow-hidden", workspace.color)}>
              <div className="absolute top-0 right-0 p-4 opacity-20">
                <Globe className="size-20 -mr-4 -mt-4 text-white rotate-12" />
              </div>
              <h3 className="text-xl font-bold text-white relative z-10">{workspace.name}</h3>
            </div>

            <div className="flex-1 p-6 space-y-6">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Quick Access</p>
              
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => onSelectWorkspace(workspace.name, "pipeline")}
                  className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left text-sm font-medium text-gray-700 w-full"
                >
                  <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
                    <Library className="size-3.5" />
                  </div>
                  Content
                </button>
                <button 
                  onClick={() => onSelectWorkspace(workspace.name, "calendar")}
                  className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left text-sm font-medium text-gray-700 w-full"
                >
                  <div className="p-1.5 bg-green-50 text-green-600 rounded-lg">
                    <Calendar className="size-3.5" />
                  </div>
                  Calendar
                </button>
                <button 
                  onClick={() => onSelectWorkspace(workspace.name, "performance")}
                  className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left text-sm font-medium text-gray-700 w-full"
                >
                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                    <BarChart3 className="size-3.5" />
                  </div>
                  Performance
                </button>
                <button 
                  onClick={() => onSelectWorkspace(workspace.name, "strategy")}
                  className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left text-sm font-medium text-gray-700 w-full"
                >
                  <div className="p-1.5 bg-orange-50 text-orange-600 rounded-lg">
                    <Target className="size-3.5" />
                  </div>
                  Strategy
                </button>
              </div>
            </div>

            <div className="p-4 border-t bg-gray-50/50">
              <button 
                onClick={() => onSelectWorkspace(workspace.name, "pipeline")}
                className="w-full flex items-center justify-between px-4 py-2 rounded-xl text-sm font-bold text-[#d94e33] hover:bg-[#d94e33]/5 transition-colors"
              >
                Go to Workspace <ChevronRight className="size-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}