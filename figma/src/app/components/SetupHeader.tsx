import React from "react";
import { 
  ChevronDown, 
  LogOut, 
  Settings, 
  Plus, 
  Video, 
  Sparkles,
  LayoutDashboard,
  Calendar,
  FolderOpen,
  ClipboardList,
  Menu,
  User,
  Target,
  BarChart3,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/app/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { cn } from "@/lib/utils";

export type DashboardTab = 'strategy' | 'content' | 'calendar' | 'performance' | 'features' | 'settings' | 'profile';

interface SetupHeaderProps {
  onAddWorkspace: () => void;
  onSelectWorkspace: (name: string) => void;
  onGoToSettings: () => void;
  onGoHome?: () => void;
  activeWorkspace?: string;
  activeTab?: DashboardTab;
  onTabChange?: (tab: DashboardTab) => void;
  showNav?: boolean;
}

export function SetupHeader({ 
  onAddWorkspace, 
  onSelectWorkspace, 
  onGoToSettings,
  onGoHome,
  activeWorkspace = "Hive Collective",
  activeTab = "settings",
  onTabChange,
  showNav = true
}: SetupHeaderProps) {
  const workspaces = ["Hive Collective", "Booze Kills"];

  const navItems = [
    { id: 'content', label: 'Content', icon: Sparkles },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'performance', label: 'Performance', icon: BarChart3 },
  ] as const;

  const secondaryNavItems = [
    { id: 'strategy', label: 'Strategy & Research', icon: Target },
  ] as const;

  return (
    <header className="w-full bg-linear-to-r from-[#d94e33] to-[#f26b4d] h-16 px-6 flex items-center justify-between shadow-md sticky top-0 z-50">
      <div className="flex items-center gap-4 overflow-visible min-w-0 flex-1">
        {/* Logo */}
        <div 
          className="flex items-center gap-2 text-white font-bold text-xl cursor-pointer shrink-0" 
          onClick={onGoHome}
        >
          <div className="p-1.5 bg-white rounded-md">
            <Video className="size-6 text-[#d94e33]" fill="currentColor" />
          </div>
          <span className="hidden xl:inline">BLINK SOCIAL</span>
          <span className="xl:hidden hidden md:inline">BLINK</span>
        </div>

        {/* Workspaces Dropdown */}
        {showNav && (
          <div className="flex items-center shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-white hover:bg-white/10 gap-2 h-9 font-medium px-2.5">
                  <span className="max-w-[120px] truncate hidden md:inline">{activeWorkspace}</span>
                  <ChevronDown className="size-4 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Your Workspaces
                </div>
                {workspaces.map((name) => (
                  <DropdownMenuItem 
                    key={name} 
                    onClick={() => onSelectWorkspace(name)}
                    className="flex items-center justify-between"
                  >
                    {name}
                    {activeWorkspace === name && <Sparkles className="size-3 text-[#d94e33]" />}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onAddWorkspace} className="text-[#d94e33] font-medium focus:text-[#d94e33]">
                  <Plus className="mr-2 size-4" /> Add Workspace
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Main Navigation */}
        {showNav && (
          <nav className="hidden sm:flex items-center gap-1 ml-2 border-l border-white/20 pl-3 shrink-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => onTabChange?.(item.id)}
                  className={cn(
                    "text-white/80 hover:text-white hover:bg-white/10 gap-1.5 h-9 font-medium transition-all px-2.5 whitespace-nowrap shrink-0",
                    isActive && "bg-white/15 text-white shadow-xs"
                  )}
                >
                  <Icon className={cn("size-4 shrink-0", isActive ? "opacity-100" : "opacity-70")} />
                  <span className="shrink-0">{item.label}</span>
                </Button>
              );
            })}
            
            {/* Separator */}
            <div className="h-6 w-[1px] bg-white/20 mx-1 shrink-0" />
            
            {/* Secondary Navigation */}
            {secondaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => onTabChange?.(item.id)}
                  className={cn(
                    "text-white/70 hover:text-white hover:bg-white/10 gap-1.5 h-9 font-normal transition-all px-2.5 whitespace-nowrap shrink-0",
                    isActive && "bg-white/15 text-white shadow-xs font-medium"
                  )}
                >
                  <Icon className={cn("size-4 shrink-0", isActive ? "opacity-100" : "opacity-60")} />
                  <span className="shrink-0">{item.label}</span>
                </Button>
              );
            })}
          </nav>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-2">
          {/* Mobile Menu */}
          <div className="sm:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                  <Menu className="size-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {showNav && navItems.map((item) => (
                  <DropdownMenuItem key={item.id} onClick={() => onTabChange?.(item.id)}>
                    <item.icon className="mr-2 size-4" /> {item.label}
                  </DropdownMenuItem>
                ))}
                {showNav && secondaryNavItems.map((item) => (
                  <DropdownMenuItem key={item.id} onClick={() => onTabChange?.(item.id)}>
                    <item.icon className="mr-2 size-4" /> {item.label}
                  </DropdownMenuItem>
                ))}
                {showNav && <DropdownMenuSeparator />}
                <DropdownMenuItem onClick={() => onTabChange?.('profile')}>
                  <User className="mr-2 size-4" /> Profile
                </DropdownMenuItem>
                {showNav && (
                  <DropdownMenuItem onClick={onGoToSettings}>
                    <Settings className="mr-2 size-4" /> Workspace Settings
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Gear icon kept as requested - hidden on homepage/setup */}
          {showNav && (
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn(
                "text-white hover:bg-white/10 h-9 w-9 hidden sm:flex transition-all",
                activeTab === 'settings' && "bg-white/20 shadow-inner"
              )}
              onClick={onGoToSettings}
              title="Workspace Settings"
            >
              <Settings className="size-5" />
            </Button>
          )}

          <div className="h-8 w-[1px] bg-white/20 mx-1 hidden sm:block" />

          <div className="flex items-center gap-3 text-white">
            <button 
              className="text-right hidden sm:block hover:opacity-80 transition-opacity outline-none"
              onClick={() => onTabChange?.('profile')}
            >
              <p className="text-sm font-medium leading-none">Brett Lewis</p>
              <p className="text-xs text-white/70">Admin</p>
            </button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 group outline-none">
                  <Avatar className={cn(
                    "h-8 w-8 border border-white/20 group-hover:border-white/40 transition-colors",
                    activeTab === 'profile' && "ring-2 ring-white/50 border-white"
                  )}>
                    <AvatarImage src="https://github.com/shadcn.png" />
                    <AvatarFallback>BL</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onTabChange?.('profile')}>
                  <User className="mr-2 size-4" /> Profile Settings
                </DropdownMenuItem>
                {showNav && (
                  <DropdownMenuItem onClick={onGoToSettings}>
                    <Settings className="mr-2 size-4" /> Workspace Settings
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  <LogOut className="mr-2 size-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 h-8 w-8 ml-1 hidden lg:flex">
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}