import React from "react";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Button } from "@/app/components/ui/button";
import { 
  Trash2, 
  User, 
  Briefcase, 
  ListTodo, 
  FileText,
  Plus
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { FieldInfo } from "@/app/components/FieldInfo";

interface Agent {
  id: number;
  name: string;
  role: string;
  responsibilities: string;
  outputs: string;
}

const fieldStyles = "bg-[#f3f4f6] border-none shadow-none focus-visible:ring-1 focus-visible:ring-gray-200 focus-visible:bg-[#edeff2] transition-colors";

export function StepAgents() {
  const [agents, setAgents] = React.useState<Agent[]>([
    { 
      id: 1, 
      name: "Reporting Agent", 
      role: "News Aggregator", 
      responsibilities: "Scan RSS feeds daily, identify emerging trends, and summarize complex tech articles for the engineering team.",
      outputs: "Daily news digests, weekly trend reports, and Slack alerts for high-priority news.",
    },
    { 
      id: 2, 
      name: "Creative Agent", 
      role: "Content Specialist", 
      responsibilities: "Write engaging captions, select strategic hashtags, suggest visual imagery, and create social story outlines.",
      outputs: "Social media post drafts, creative content concepts, and hashtag strategy documents.",
    },
  ]);

  const addAgent = () => {
    const newAgent: Agent = { 
      id: Date.now(), 
      name: "", 
      role: "", 
      responsibilities: "", 
      outputs: "",
    };
    setAgents([...agents, newAgent]);
  };

  const removeAgent = (id: number) => {
    if (agents.length > 1) {
      setAgents(agents.filter(a => a.id !== id));
    }
  };

  const updateAgent = (id: number, field: keyof Agent, value: string) => {
    setAgents(agents.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-8"
    >
      <div className="space-y-2 text-center md:text-left">
        <h2 className="text-2xl font-bold tracking-tight">Agent Personalities</h2>
        <p className="text-muted-foreground text-sm">
          Define the identity and focus areas for your AI team members.
        </p>
      </div>

      <div className="flex justify-end">
        <Button onClick={addAgent} variant="outline" size="sm" className="h-8 text-[#d94e33] border-[#d94e33] hover:bg-[#d94e33]/5">
          <Plus className="mr-1 size-3" /> Add Agent
        </Button>
      </div>

      <div className="space-y-10">
        <AnimatePresence mode="popLayout">
          {agents.map((agent, index) => (
            <motion.div
              key={agent.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative p-8 border rounded-2xl bg-white shadow-sm space-y-6 group"
            >
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-[#d94e33] text-white flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg">Agent Details</h3>
                </div>
                {agents.length > 1 && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
                    onClick={() => removeAgent(agent.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor={`name-${agent.id}`} className="flex items-center gap-2 text-sm font-bold text-gray-900">
                    <User className="size-4 text-[#d94e33]" /> Agent Name
                    <FieldInfo content="Give your AI agent a unique and memorable name." />
                  </Label>
                  <Input 
                    id={`name-${agent.id}`}
                    value={agent.name} 
                    onChange={(e) => updateAgent(agent.id, "name", e.target.value)}
                    placeholder="e.g. Reporting Bot" 
                    className={cn(fieldStyles, "h-12")} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`role-${agent.id}`} className="flex items-center gap-2 text-sm font-bold text-gray-900">
                    <Briefcase className="size-4 text-[#d94e33]" /> Role Description
                    <FieldInfo content="Define the specific role or professional title for this agent." />
                  </Label>
                  <Input 
                    id={`role-${agent.id}`}
                    value={agent.role} 
                    onChange={(e) => updateAgent(agent.id, "role", e.target.value)}
                    placeholder="e.g. News Aggregator & Researcher" 
                    className={cn(fieldStyles, "h-12")} 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`resp-${agent.id}`} className="flex items-center gap-2 text-sm font-bold text-gray-900">
                  <ListTodo className="size-4 text-[#d94e33]" /> Core Responsibilities
                  <FieldInfo content="List the primary tasks and duties this agent is responsible for." />
                </Label>
                <Textarea 
                  id={`resp-${agent.id}`}
                  value={agent.responsibilities}
                  onChange={(e) => updateAgent(agent.id, "responsibilities", e.target.value)}
                  placeholder="What specific tasks will this agent perform?" 
                  className={cn(fieldStyles, "min-h-[120px] py-4 resize-none")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`out-${agent.id}`} className="flex items-center gap-2 text-sm font-bold text-gray-900">
                  <FileText className="size-4 text-[#d94e33]" /> Desired Outputs
                  <FieldInfo content="Specify the tangible results or artifacts this agent should produce." />
                </Label>
                <Textarea 
                  id={`out-${agent.id}`}
                  value={agent.outputs}
                  onChange={(e) => updateAgent(agent.id, "outputs", e.target.value)}
                  placeholder="What tangible results should this agent produce?" 
                  className={cn(fieldStyles, "min-h-[120px] py-4 resize-none")}
                />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
