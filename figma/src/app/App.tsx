import React, { useState } from "react";
import { SetupHeader, type DashboardTab } from "@/app/components/SetupHeader";
import { StepIndicator } from "@/app/components/StepIndicator";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardFooter } from "@/app/components/ui/card";
import { ChevronLeft, ChevronRight, Save, Settings, Sparkles, LayoutGrid, ClipboardList } from "lucide-react";
import { StepWorkspaceBasics } from "@/app/components/steps/StepWorkspaceBasics";
import { StepPlatformConfig } from "@/app/components/steps/StepPlatformConfig";
import { StepAgents } from "@/app/components/steps/StepAgents";
import { StepReview } from "@/app/components/steps/StepReview";
import { StepContent } from "@/app/components/steps/StepContent";
import { WorkspaceSettings } from "@/app/components/WorkspaceSettings";
import { ProfileSettings } from "@/app/components/ProfileSettings";
import { ContentPipeline } from "@/app/components/ContentPipeline";
import { ContentCalendar } from "@/app/components/ContentCalendar";
import { ContentIdeas } from "@/app/components/ContentIdeas";
import { FeatureList } from "@/app/components/FeatureList";
import { StrategyTab } from "@/app/components/StrategyTab";
import { PerformanceTab } from "@/app/components/PerformanceTab";
import { Home } from "@/app/components/Home";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, title: "Workspace", description: "Identity" },
  { id: 2, title: "Platforms", description: "Config" },
  { id: 3, title: "Content", description: "Strategy" },
  { id: 4, title: "Agents", description: "Team" },
  { id: 5, title: "Review", description: "Finish" },
];

import { TooltipProvider } from "@/app/components/ui/tooltip";
import { Toaster } from "sonner";

export default function App() {
  const [view, setView] = useState<"home" | "setup" | "dashboard">("home");
  const [currentStep, setCurrentStep] = useState(1);
  const [activeWorkspace, setActiveWorkspace] = useState("Hive Collective");
  const [activeTab, setActiveTab] = useState<DashboardTab>("content");
  const [contentResetKey, setContentResetKey] = useState(0); // Key to reset ContentIdeas to overview
  const [calendarOpenItem, setCalendarOpenItem] = useState<{ itemId: string; tab: string } | null>(null);

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = () => {
    setView("dashboard");
    setActiveTab("content");
  };

  const handleAddWorkspace = () => {
    setView("setup");
    setCurrentStep(1);
  };

  const handleSelectWorkspace = (name: string, tab: DashboardTab = "content") => {
    setActiveWorkspace(name);
    setView("dashboard");
    setActiveTab(tab);
  };

  const handleGoToSettings = () => {
    setView("dashboard");
    setActiveTab("settings");
  };

  const handleTabChange = (tab: DashboardTab) => {
    // If clicking Content tab, reset to overview (unless we're deep-linking from calendar)
    if (tab === "content" && !calendarOpenItem) {
      if (activeTab === "content") {
        setContentResetKey(prev => prev + 1);
      } else {
        setContentResetKey(prev => prev + 1);
      }
    }
    setActiveTab(tab);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <StepWorkspaceBasics />;
      case 2:
        return <StepPlatformConfig />;
      case 3:
        return <StepContent />;
      case 4:
        return <StepAgents />;
      case 5:
        return <StepReview workspaceName={activeWorkspace} />;
      default:
        return <StepWorkspaceBasics />;
    }
  };

  const renderDashboardContent = () => {
    switch (activeTab) {
      case "strategy":
        return <StrategyTab />;
      case "content":
        return <ContentIdeas key={contentResetKey} initialOpenItem={calendarOpenItem} onClearOpenItem={() => setCalendarOpenItem(null)} />;
      case "calendar":
        return <ContentCalendar onOpenItem={(itemId: string, tab: string) => {
          setCalendarOpenItem({ itemId, tab });
          setActiveTab("content");
        }} />;
      case "performance":
        return <PerformanceTab />;
      case "features":
        return <FeatureList />;
      case "profile":
        return <ProfileSettings />;
      case "settings":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-[#d94e33] rounded-lg text-white">
                  <Sparkles className="size-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{activeWorkspace} Active</h2>
                  <p className="text-sm text-muted-foreground italic">Last synced: Just now</p>
                </div>
              </div>
            </div>
            <WorkspaceSettings activeWorkspace={activeWorkspace} />
          </div>
        );
      default:
        return <ContentIdeas key={contentResetKey} />;
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <Toaster position="top-center" expand={false} richColors />
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans">
        <SetupHeader 
          onAddWorkspace={handleAddWorkspace}
          onSelectWorkspace={(name) => handleSelectWorkspace(name)}
          onGoToSettings={handleGoToSettings}
          onGoHome={() => setView("home")}
          activeWorkspace={activeWorkspace}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          showNav={view === "dashboard"}
        />
        
        {/* Home / Back to Home navigation - only show in setup wizard */}
        {view === "setup" && (
          <div className="max-w-7xl mx-auto w-full px-4 pt-6">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setView("home")}
              className="text-muted-foreground hover:text-[#d94e33] gap-2"
            >
              <LayoutGrid className="size-4" /> Back to Home
            </Button>
          </div>
        )}

        <main className={cn(
          "flex-1 mx-auto px-4 relative transition-all duration-300 w-full",
          view === "dashboard" ? "max-w-7xl" : "max-w-6xl",
          view === "dashboard" && activeTab === "content" ? "py-6" : "py-12"
        )}>
          {/* Background Decorative Element */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-h-[400px] opacity-10 pointer-events-none overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1657727534685-36b09f84e193?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBwcm9mZXNzaW9uYWwlMjB3b3JrcGxhY2UlMjBkaWdpdGFsJTIwYmFja2dyb3VuZHxlbnwxfHx8fDE3NzAwNDY5MTF8MA&ixlib=rb-4.1.0&q=80&w=1080" 
              alt="" 
              className="w-full h-full object-cover rounded-full blur-3xl"
            />
          </div>

          <div className="relative z-10">
            <AnimatePresence mode="wait">
              {view === "home" ? (
                <motion.div
                  key="home"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                >
                  <Home 
                    onAddWorkspace={handleAddWorkspace} 
                    onSelectWorkspace={handleSelectWorkspace} 
                  />
                </motion.div>
              ) : view === "setup" ? (
                <motion.div
                  key="wizard"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center p-3 bg-[#d94e33]/10 rounded-2xl mb-4">
                      <Settings className="size-8 text-[#d94e33]" />
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2">
                      Setup Your Workspace
                    </h1>
                    <p className="text-gray-500 text-lg">
                      Follow the steps below to initialize your Blink Social workspace.
                    </p>
                  </div>

                  <StepIndicator steps={STEPS} currentStep={currentStep} />

                  <Card className="border-none shadow-xl bg-white/90 backdrop-blur-sm overflow-hidden mt-8 max-w-4xl mx-auto">
                    <CardContent className="p-8 md:p-12">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={currentStep}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                        >
                          {renderStep()}
                        </motion.div>
                      </AnimatePresence>
                    </CardContent>
                    
                    <CardFooter className="bg-gray-50/50 border-t p-6 flex justify-between items-center">
                      <Button
                        variant="ghost"
                        onClick={prevStep}
                        disabled={currentStep === 1 || currentStep === STEPS.length}
                        className="gap-2"
                      >
                        <ChevronLeft className="size-4" /> Back
                      </Button>
                      
                      <div className="flex gap-3">
                        {currentStep < STEPS.length ? (
                          <Button 
                            onClick={nextStep} 
                            className="bg-[#d94e33] hover:bg-[#c2462e] text-white px-8 gap-2 shadow-lg shadow-[#d94e33]/20 transition-all active:scale-95"
                          >
                            Next <ChevronRight className="size-4" />
                          </Button>
                        ) : (
                          <Button 
                            onClick={handleFinish} 
                            className="bg-[#d94e33] hover:bg-[#c2462e] text-white px-8 gap-2 shadow-lg shadow-[#d94e33]/20 transition-all active:scale-95"
                          >
                            Finish & Launch <Save className="size-4" />
                          </Button>
                        )}
                      </div>
                    </CardFooter>
                  </Card>
                  
                  <p className="text-center mt-8 text-sm text-muted-foreground">
                    Progress is automatically saved. You can come back and finish this later.
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  {renderDashboardContent()}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        <footer className="py-6 border-t bg-white text-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-4 mb-2">
            {view === "dashboard" && (
              <button
                onClick={() => setActiveTab("features")}
                className="text-muted-foreground hover:text-[#d94e33] transition-colors flex items-center gap-1.5"
              >
                <ClipboardList className="size-3.5" />
                Features
              </button>
            )}
          </div>
          &copy; 2026 Blink Social. All rights reserved.
        </footer>
      </div>
    </TooltipProvider>
  );
}