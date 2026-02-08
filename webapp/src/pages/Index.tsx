import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import NotebookPanel from "@/components/notebook/NotebookPanel";
import DashboardPanel from "@/components/dashboard/DashboardPanel";
import RunsPanel from "@/components/runs/RunsPanel";
import ModelBuilderPanel from "@/components/dashboard/ModelBuilderPanel";
import { NotebookProvider, useNotebook } from "@/hooks/useNotebook";
import { NotebookCellsProvider, useNotebookCellsContext } from "@/hooks/NotebookCellsContext";
import { PyodideProvider, usePyodideContext } from "@/hooks/PyodideContext";
import { STARTER_CODE, INITIAL_CELLS } from "@/lib/templates";

function NewSessionButton() {
  const { resetSession, isLoading } = useNotebook();
  const { clearAllOutputs, setCells } = useNotebookCellsContext();
  const { clearData, resetWorkflow } = usePyodideContext();

  const handleNewSession = async () => {
    // Reset notebook cells to initial state
    setCells(INITIAL_CELLS);
    clearAllOutputs();

    // Clear data and workflow
    clearData();
    resetWorkflow();

    // Create new backend session
    await resetSession();
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={handleNewSession}
      disabled={isLoading}
    >
      <Plus className="h-4 w-4" />
      <span className="hidden sm:inline">New Session</span>
    </Button>
  );
}

function NotebookContent() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const navigate = useNavigate();

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b border-border px-4 md:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="flex h-8 w-8 items-center justify-center rounded-lg overflow-hidden hover:opacity-80 transition-opacity"
          >
            <img src="/loopyter-logo.png" alt="Loopyter" className="h-8 w-8 object-contain" />
          </button>
          <h1 className="font-syne text-lg font-semibold text-foreground">
            Loopyter
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => navigate("/")}
          >
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Home</span>
          </Button>
          <NewSessionButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {/* Desktop Layout with Resizable Panels */}
        <div className="hidden md:block h-full">
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {/* Left Panel - Notebook */}
            <ResizablePanel defaultSize={45} minSize={30} maxSize={60}>
              <div className="h-full p-4 overflow-hidden">
                <NotebookPanel />
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle className="bg-border" />

            {/* Right Panel - Tabs */}
            <ResizablePanel defaultSize={55} minSize={40} maxSize={70}>
              <div className="h-full p-4 overflow-hidden">
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="flex h-full flex-col"
                >
                  <TabsList className="w-fit bg-secondary">
                    <TabsTrigger
                      value="dashboard"
                      className="data-[state=active]:bg-card data-[state=active]:text-foreground"
                    >
                      Dashboard
                    </TabsTrigger>
                    <TabsTrigger
                      value="build"
                      className="data-[state=active]:bg-card data-[state=active]:text-foreground"
                    >
                      Build
                    </TabsTrigger>
                    <TabsTrigger
                      value="runs"
                      className="data-[state=active]:bg-card data-[state=active]:text-foreground"
                    >
                      Runs
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="dashboard" className="flex-1 mt-4 overflow-hidden">
                    <DashboardPanel />
                  </TabsContent>
                  <TabsContent value="build" className="flex-1 mt-4 overflow-hidden">
                    <ModelBuilderPanel />
                  </TabsContent>
                  <TabsContent value="runs" className="flex-1 mt-4 overflow-hidden">
                    <RunsPanel />
                  </TabsContent>
                </Tabs>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>

        {/* Mobile Layout - Stacked */}
        <div className="md:hidden h-full flex flex-col overflow-hidden">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex h-full flex-col"
          >
            <div className="border-b border-border px-4 py-2">
              <TabsList className="w-full bg-secondary">
                <TabsTrigger
                  value="notebook"
                  className="flex-1 data-[state=active]:bg-card data-[state=active]:text-foreground"
                >
                  Code
                </TabsTrigger>
                <TabsTrigger
                  value="dashboard"
                  className="flex-1 data-[state=active]:bg-card data-[state=active]:text-foreground"
                >
                  Dashboard
                </TabsTrigger>
                <TabsTrigger
                  value="build"
                  className="flex-1 data-[state=active]:bg-card data-[state=active]:text-foreground"
                >
                  Build
                </TabsTrigger>
                <TabsTrigger
                  value="runs"
                  className="flex-1 data-[state=active]:bg-card data-[state=active]:text-foreground"
                >
                  Runs
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="notebook" className="flex-1 p-4 overflow-auto">
              <NotebookPanel />
            </TabsContent>
            <TabsContent value="dashboard" className="flex-1 p-4 overflow-auto">
              <DashboardPanel />
            </TabsContent>
            <TabsContent value="build" className="flex-1 p-4 overflow-auto">
              <ModelBuilderPanel />
            </TabsContent>
            <TabsContent value="runs" className="flex-1 p-4 overflow-auto">
              <RunsPanel />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

const Index = () => {
  return (
    <NotebookProvider initialCode={STARTER_CODE}>
      <PyodideProvider>
        <NotebookCellsProvider>
          <NotebookContent />
        </NotebookCellsProvider>
      </PyodideProvider>
    </NotebookProvider>
  );
};

export default Index;
