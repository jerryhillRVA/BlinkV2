import React from "react";
import { User, Key, Mail, Shield, ChevronRight, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";

export function ProfileSettings() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
        <p className="text-muted-foreground">
          Manage your personal information and account security.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Profile Information */}
        <Card className="border-none shadow-sm bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="size-5 text-[#d94e33]" /> Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Display Name</p>
                <p className="text-base font-semibold">Brett Lewis (Admin)</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</p>
                <p className="text-base font-semibold">blewis@jackreiley.com</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Current Workspace Role</p>
                <div className="flex items-center gap-2">
                  <Shield className="size-4 text-[#d94e33]" />
                  <span className="text-base font-semibold text-[#d94e33]">Admin</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Workspace Access</p>
                <p className="text-base font-semibold">2 workspace(s)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card className="border-none shadow-sm bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Key className="size-5 text-[#d94e33]" /> Change Password
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <div className="relative">
                  <Input 
                    id="current-password" 
                    type="password" 
                    placeholder="••••••••" 
                    className="pr-10"
                  />
                  <div className="absolute right-3 top-2.5">
                    <Lock className="size-4 text-muted-foreground/50" />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input 
                    id="new-password" 
                    type="password" 
                    placeholder="••••••••" 
                    className="pr-10"
                  />
                  <div className="absolute right-3 top-2.5">
                    <Lock className="size-4 text-muted-foreground/50" />
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground">Minimum 8 characters</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <div className="relative">
                  <Input 
                    id="confirm-password" 
                    type="password" 
                    placeholder="••••••••" 
                    className="pr-10"
                  />
                  <div className="absolute right-3 top-2.5">
                    <Lock className="size-4 text-muted-foreground/50" />
                  </div>
                </div>
              </div>
            </div>

            <Button className="w-full bg-[#d94e33] hover:bg-[#c2462e] shadow-lg shadow-[#d94e33]/10">
              Change Password
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
